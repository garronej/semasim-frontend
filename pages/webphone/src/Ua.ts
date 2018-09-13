import { SyncEvent, VoidSyncEvent } from "ts-events-extended";
import { phoneNumber } from "../../../shared/dist/lib/phoneNumber";
import * as types from "../../../shared/dist/lib/types";
import {
    types as gwTypes,
    extractBundledDataFromHeaders,
    smuggleBundledDataInHeaders,
    urlSafeB64,
    readImsi
} from "../../../shared/dist/semasim-gateway";
import * as sip from "ts-sip";
import * as runExclusive from "run-exclusive";
import * as connection from "../../../shared/dist/lib/toBackend/connection";
import * as remoteApiCaller from "../../../shared/dist/lib/toBackend/remoteApiCaller";

declare const JsSIP: any;
declare const Buffer: any;

//JsSIP.debug.enable("JsSIP:*");
JsSIP.debug.disable("JsSIP:*");

const pcConfig: RTCConfiguration = {
    "iceServers": [{ "urls": ["stun:stun1.l.google.com:19302"] }]
};

export class Ua {

    public static email: string;
    public static instanceId: string;

    /** Must be called in webphone.ts */
    public static async init(): Promise<void>{

        const { email , uaInstanceId }= await remoteApiCaller.getUaInstanceIdAndEmail();

        this.email= email;
        this.instanceId= uaInstanceId;

    }

    /** post isRegistered */
    public readonly evtRegistrationStateChanged = new SyncEvent<boolean>();


    private readonly jsSipUa: any;
    private evtRingback = new SyncEvent<string>();

    private readonly jsSipSocket: JsSipSocket;

    constructor(
        public readonly userSim: types.UserSim.Usable
    ) {

        const { imsi } = userSim.sim;

        const uri = `sip:${imsi}-webRTC@semasim.com`;

        this.jsSipSocket= new JsSipSocket(imsi, uri);

        this.jsSipUa = new JsSIP.UA({
            "sockets": this.jsSipSocket,
            uri,
            "authorization_user": imsi,
            "password": this.userSim.password,
            "instance_id": Ua.instanceId,
            "register": false,
            "contact_uri": `${uri};enc_email=${urlSafeB64.enc(Ua.email)}`,
            //"connection_recovery_min_interval": 86400,
            //"connection_recovery_max_interval": 86400,
            "register_expires": 345600
        });

        /* 
        evt 'registered' is posted only when register change 
        so we use this instead.
        */
        this.jsSipSocket.evtSipPacket.attach(
            sipPacket => (
                !sip.matchRequest(sipPacket) &&
                sipPacket.headers.cseq.method === "REGISTER" &&
                sipPacket.status === 200
            ),
            () => {

                this.isRegistered = true;

                this.evtRegistrationStateChanged.post(true);

            }
        );

        this.jsSipUa.on("unregistered", () => {

            this.isRegistered = false;

            this.evtRegistrationStateChanged.post(false);

        });

        this.jsSipUa.on("newMessage", ({ originator, request }) => {

            if (originator === "remote") {
                this.onMessage(request);
            }

        });

        this.jsSipUa.on("newRTCSession", ({ originator, session, request }) => {

            if (originator === "remote") {
                this.onIncomingCall(session, request);
            }

        });

        this.jsSipUa.start();

    }

    public isRegistered = false;

    //TODO: If no response to register do something
    public register() {
        this.jsSipUa.register();
    }

    /** 
     * Do not actually send a REGISTER expire=0. 
     * Assert no packet will arrive to this UA until next register.
     * */
    public unregister() {
        this.jsSipUa.emit("unregistered");
    }

    public readonly evtIncomingMessage = new SyncEvent<{
        fromNumber: phoneNumber;
        bundledData: Exclude<gwTypes.BundledData.ServerToClient, gwTypes.BundledData.ServerToClient.Ringback>;
        text: string;
        onProcessed: () => void;
    }>();

    private onMessage(request): void {

        const bundledData = extractBundledDataFromHeaders((() => {

            const out = {};

            for (const key in request.headers) {
                out[key] = request.headers[key][0].raw;
            }

            return out;

        })()) as gwTypes.BundledData.ServerToClient;

        const fromNumber = this.toPhoneNumber(request.from.uri.user);

        if (bundledData.type === "RINGBACK") {

            this.evtRingback.post(bundledData.callId);

            return;

        }

        const pr = this.postEvtIncomingMessage({
            fromNumber,
            bundledData,
            "text": request.body,
        });

        this.jsSipSocket.setMessageOkDelay(request, pr);

    }

    private postEvtIncomingMessage = runExclusive.buildMethod(
        (evtData: Pick<SyncEvent.Type<typeof Ua.prototype.evtIncomingMessage>, "fromNumber" | "bundledData" | "text">) => {

            let onProcessed: () => void;

            const pr = new Promise<void>(resolve => onProcessed = resolve);

            this.evtIncomingMessage.post({
                ...evtData,
                "onProcessed": onProcessed!
            });

            return pr;

        }
    );

    public sendMessage(
        number: phoneNumber,
        text: string,
        exactSendDate: Date
    ): Promise<void> {

        const extraHeaders = (() => {

            const headers = smuggleBundledDataInHeaders((() => {

                const bundledData: gwTypes.BundledData.ClientToServer.Message = {
                    "type": "MESSAGE",
                    exactSendDate
                };

                return bundledData;

            })());

            const out: string[] = [];

            for (const key in headers) {

                out.push(`${key}: ${headers[key]}`);

            }

            return out;

        })();

        return new Promise<void>(
            (resolve, reject) => this.jsSipUa.sendMessage(
                `sip:${number}@semasim.com`,
                text,
                {
                    "contentType": "text/plain; charset=UTF-8",
                    extraHeaders,
                    "eventHandlers": {
                        "succeeded": () => resolve(),
                        "failed": ({ cause }) => reject(new Error(`Send message failed ${cause}`))
                    }
                }
            )
        );

    }

    /** return exactSendDate to match with sendReport and statusReport */


    public readonly evtIncomingCall = new SyncEvent<{
        fromNumber: phoneNumber;
        terminate(): void;
        prTerminated: Promise<void>;
        onAccepted(): Promise<{
            state: "ESTABLISHED";
            sendDtmf(signal: Ua.DtmFSignal, duration: number): void;
        }>
    }>();


    private onIncomingCall(jsSipRtcSession, request): void {

        const evtRequestTerminate = new VoidSyncEvent();
        const evtAccepted = new VoidSyncEvent();
        const evtTerminated = new VoidSyncEvent();
        const evtDtmf = new SyncEvent<{ signal: Ua.DtmFSignal; duration: number; }>();
        const evtEstablished = new VoidSyncEvent();

        evtRequestTerminate.attachOnce(() => jsSipRtcSession.terminate());

        evtDtmf.attach(({ signal, duration }) =>
            jsSipRtcSession.sendDTMF(signal, { duration })
        );

        evtAccepted.attachOnce(() => {

            jsSipRtcSession.answer({
                "mediaConstraints": { "audio": true, "video": false },
                pcConfig
            });

            (jsSipRtcSession.connection as RTCPeerConnection).ontrack =
                ({ streams: [stream] }) => playAudioStream(stream);

        });

        jsSipRtcSession.once("confirmed", () => evtEstablished.post());

        jsSipRtcSession.once("ended", () => evtTerminated.post());

        jsSipRtcSession.once("failed", () => evtTerminated.post());

        this.evtIncomingCall.post({
            "fromNumber": this.toPhoneNumber(request.from.uri.user),
            "terminate": () => evtRequestTerminate.post(),
            "prTerminated": Promise.race([
                evtRequestTerminate.waitFor(),
                evtTerminated.waitFor()
            ]),
            "onAccepted": async () => {

                evtAccepted.post();

                await evtEstablished.waitFor();

                return {
                    "state": "ESTABLISHED",
                    "sendDtmf":
                        (signal, duration) => evtDtmf.post({ signal, duration })
                };

            }
        });

    }

    public placeOutgoingCall(number: phoneNumber): {
        terminate(): void;
        prTerminated: Promise<void>;
        prNextState: Promise<{
            state: "RINGBACK";
            prNextState: Promise<{
                state: "ESTABLISHED";
                sendDtmf(signal: Ua.DtmFSignal, duration: number): void;
            }>
        }>
    } {

        const evtEstablished = new VoidSyncEvent();
        const evtTerminated = new VoidSyncEvent();
        const evtDtmf = new SyncEvent<{ signal: Ua.DtmFSignal; duration: number; }>();
        const evtRequestTerminate = new VoidSyncEvent();
        const evtRingback = new VoidSyncEvent();

        this.jsSipUa.call(
            `sip:${number}@semasim.com`,
            {
                "mediaConstraints": { "audio": true, "video": false },
                pcConfig,
                "eventHandlers": {
                    "connecting": function () {

                        const jsSipRtcSession = this;

                        if (!!evtRequestTerminate.postCount) {

                            jsSipRtcSession.terminate();

                            return;

                        }

                        evtRequestTerminate.attachOnce(
                            () => jsSipRtcSession.terminate()
                        );

                        evtDtmf.attach(({ signal, duration }) =>
                            jsSipRtcSession.sendDTMF(signal, { duration })
                        );


                        (jsSipRtcSession.connection as RTCPeerConnection).ontrack =
                            ({ streams: [stream] }) => playAudioStream(stream);

                    },
                    "confirmed": () => evtEstablished.post(),
                    "ended": () => evtTerminated.post(),
                    "sending": ({ request }) =>
                        this.evtRingback.waitFor(callId => callId === request.call_id, 30000)
                            .then(() => evtRingback.post())
                            .catch(() => { })

                }
            }
        );

        return {
            "prNextState": new Promise(async resolve => {

                await Promise.race([
                    evtRingback.waitFor(),
                    evtEstablished.waitFor()
                ]);

                resolve({
                    "state": "RINGBACK",
                    "prNextState": new Promise(async resolve => {

                        if (!evtEstablished.postCount) {
                            await evtEstablished.waitFor();
                        }

                        resolve({
                            "state": "ESTABLISHED",
                            "sendDtmf": (signal, duration) =>
                                evtDtmf.post({ signal, duration })
                        });

                    })
                });

            }),
            "prTerminated": Promise.race([
                evtRequestTerminate.waitFor(),
                evtTerminated.waitFor()
            ]),
            "terminate": () => evtRequestTerminate.post()
        };

    }

    /** convert raw number in phoneNumber */
    private toPhoneNumber(number: string): phoneNumber {
        return phoneNumber.build(
            number,
            this.userSim.sim.country ? this.userSim.sim.country.iso : undefined
        );
    }



}

export namespace Ua {

    export type DtmFSignal =
        "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "*" | "#";

}

function playAudioStream(stream: MediaStream) {

    $("<audio>", { "autoplay": "" }).get(0)["srcObject"] = stream;

}


/** The socket interface that jsSIP UA take as constructor parameter  */
interface IjsSipSocket {

    via_transport: string;
    url: string; /* "wss://www.semasim.com" */
    sip_uri: string; /* `sip:${imsi}-webRTC@semasim.com` */

    connect(): void;
    disconnect(): void;
    send(data: string): boolean;

    onconnect(): void;
    ondisconnect(error: boolean, code?: number, reason?: string): void;
    ondata(data: string): boolean;

}

class JsSipSocket implements IjsSipSocket {

    public readonly evtSipPacket = new SyncEvent<sip.Packet>();

    public readonly via_transport: sip.TransportProtocol = "WSS";

    public readonly url: string = connection.url;

    constructor(
        imsi: string,
        public readonly sip_uri: string
    ) {

        (async () => {

            const onBackedSocketConnect = (backendSocket: sip.Socket) => {

                const onSipPacket = (sipPacket: sip.Packet) => {

                    if (readImsi(sipPacket) !== imsi) {
                        return;
                    }

                    this.evtSipPacket.post(sipPacket);

                    this.ondata(
                        sip.toData(sipPacket).toString("utf8")
                    );

                }

                backendSocket.evtRequest.attach(onSipPacket);
                backendSocket.evtResponse.attach(onSipPacket);

            };

            connection.evtConnect.attach(socket => onBackedSocketConnect(socket));

            const socket = connection.get();

            if (!(socket instanceof Promise)) {

                onBackedSocketConnect(socket);

            }


        })();

    }

    public connect(): void {
        this.onconnect();
    }

    public disconnect(): void {
        throw new Error("JsSip should not call disconnect");
    }

    private messageOkDelays = new Map<string, Promise<void>>();

    /**
     * To call when receiving as SIP MESSAGE 
     * to prevent directly sending the 200 OK 
     * response immediately but rather wait
     * until some action have been completed.
     * 
     * @param request the request prop of the 
     * eventData emitted by JsSIP UA for the 
     * "newMessage" event. ( when originator === remote )
     * @param pr The response to the SIP MESSAGE
     * will not be sent until this promise resolve.
     */
    public setMessageOkDelay(request: any, pr: Promise<void>): void {
        this.messageOkDelays.set(
            request.getHeader("Call-ID"),
            pr
        );
    }


    public send(data: string): true {

        (async () => {

            const sipPacket = sip.parse(Buffer.from(data, "utf8"));

            if (!sip.matchRequest(sipPacket)) {

                const sipResponse: sip.Response = sipPacket;

                if (sipResponse.headers.cseq.method === "MESSAGE") {

                    const callId: string = sipResponse.headers["call-id"];

                    const pr = this.messageOkDelays.get(callId);

                    if (!!pr) {

                        await pr;

                        this.messageOkDelays.delete(callId);

                    }

                }

            }

            const socket = await connection.get();

            socket.write(
                sip.parse(
                    Buffer.from(data, "utf8")
                )
            );

        })();

        return true;

    }

    public onconnect(): void {
        throw new Error("Missing impl");
    }

    public ondisconnect(error: boolean, code?: number, reason?: string): void {
        throw new Error("Missing impl");
    }

    public ondata(data: string): boolean {
        throw new Error("Missing impl");
    }

}



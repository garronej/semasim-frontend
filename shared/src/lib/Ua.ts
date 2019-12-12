//NOTE: Require jssip_compat loaded on the page.

import { SyncEvent, VoidSyncEvent } from "ts-events-extended";

import { types as gwTypes } from "../gateway/types";
import { extractBundledDataFromHeaders, smuggleBundledDataInHeaders, } from "../gateway/bundledData";
import { readImsi } from "../gateway/readImsi";
import * as  serializedUaObjectCarriedOverSipContactParameter from "../gateway/serializedUaObjectCarriedOverSipContactParameter";

import * as sip from "ts-sip";
import * as runExclusive from "run-exclusive";
import { env } from "./env";

type phoneNumber = import("phone-number/dist/lib").phoneNumber;
type Encryptor = import("./crypto/cryptoLibProxy").Encryptor;
type Decryptor = import("./crypto/cryptoLibProxy").Decryptor;
type AsyncReturnType<T extends (...args: any) => Promise<any>> = T extends (...args: any) => Promise<infer R> ? R : any;
type ParamsNeededToInstantiateUa = AsyncReturnType<
    typeof import(
    "./crypto/appCryptoSetupHelper"
    )["appCryptoSetupHelper"]
>["paramsNeededToInstantiateUa"];
type ConnectionApi = {
    url: string;
    evtConnect: SyncEvent<sip.Socket>;
    get: () => Promise<sip.Socket> | sip.Socket;
};
type UsableUserSim = import("./types/userSim").UserSim.Usable;

declare const JsSIP: any;
declare const Buffer: any;

//JsSIP.debug.enable("JsSIP:*");
JsSIP.debug.disable("JsSIP:*");



export type DtmFSignal = "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "*" | "#";

export class Ua {

    public static instantiate(
        params: {
            email: string,
            uaInstanceId: string,
            cryptoRelatedParams: ParamsNeededToInstantiateUa;
            pushNotificationToken: string;
            connection: ConnectionApi;
            fromBackendEvents: import("./toBackend/appEvts").SubsetOfAppEvts<
            "evtSimPasswordChanged" | "evtSimPermissionLost" | "evtSimReachabilityStatusChange" | "rtcIceEServer"
            >
        }
    ): Ua {

        const {
            uaInstanceId,
            email,
            cryptoRelatedParams: {
                towardUserDecryptor,
                towardUserEncryptKeyStr,
                getTowardSimEncryptor
            },
            pushNotificationToken,
            connection,
            fromBackendEvents
        } = params;

        return new Ua(
            {
                "instance": uaInstanceId,
                "pushToken": pushNotificationToken,
                towardUserEncryptKeyStr,
                "userEmail": email
            },
            towardUserDecryptor,
            (() => {

                const evtUnregisteredByGateway = new SyncEvent<{ imsi: string; }>();

                const onEvt = ({ sim: { imsi } }: UsableUserSim) => evtUnregisteredByGateway.post({ imsi })

                fromBackendEvents.evtSimPasswordChanged.attach(onEvt);

                fromBackendEvents.evtSimPermissionLost.attach(onEvt);

                fromBackendEvents.evtSimReachabilityStatusChange.attach(
                    ({ reachableSimState }) => reachableSimState === undefined,
                    onEvt
                );

                return evtUnregisteredByGateway;

            })(),
            getTowardSimEncryptor,
            imsi => new JsSipSocket(imsi, connection),
            () => fromBackendEvents.rtcIceEServer.getCurrent()
        );


    }

    public descriptor: gwTypes.Ua;

    /** evtUnregisteredByGateway should post when a sim that was previously
     * reachable goes unreachable, when this happen SIP packets can no longer be
     * routed to the gateway and the gateway unregister all the SIP contact
     * It happen also when an user lose access to sim or need to refresh sim password.
     * */
    private constructor(
        uaDescriptorWithoutPlatform: Omit<gwTypes.Ua, "platform">,
        private towardUserDecryptor: Decryptor,
        private evtUnregisteredByGateway: SyncEvent<{ imsi: string; }>,
        private getTowardSimEncryptor: (usableUserSim: { towardSimEncryptKeyStr: string; }) => { towardSimEncryptor: Encryptor; },
        private getJsSipSocket: (imsi: string) => JsSipSocket,
        private getRtcIceServer: () => Promise<RTCIceServer>,
    ) {

        this.descriptor = {
            ...uaDescriptorWithoutPlatform,
            "platform": (() => {
                switch (env.jsRuntimeEnv) {
                    case "browser": return "web";
                    case "react-native": return env.hostOs;
                }
            })()
        };

    }


    public newUaSim(
        usableUserSim: { sim: { imsi: string; }; password: string; towardSimEncryptKeyStr: string; }
    ): UaSim {

        const { sim } = usableUserSim;

        return new UaSim(
            this.descriptor,
            this.towardUserDecryptor,
            this.getRtcIceServer,
            (() => {

                const out = new VoidSyncEvent();

                this.evtUnregisteredByGateway.attach(
                    ({ imsi }) => imsi === sim.imsi,
                    () => out.post()
                );

                return out;


            })(),
            this.getJsSipSocket(sim.imsi),
            sim.imsi,
            usableUserSim.password,
            this.getTowardSimEncryptor(usableUserSim).towardSimEncryptor
        );
    }


}


export class UaSim {


    /** post isRegistered */
    public readonly evtRegistrationStateChanged = new SyncEvent<boolean>();

    private readonly jsSipUa: any;
    private evtRingback = new SyncEvent<string>();



    /** Use UA.prototype.newUaSim to instantiate an UaSim */
    constructor(
        uaDescriptor: gwTypes.Ua,
        private readonly towardUserDecryptor: Decryptor,
        private getRtcIceServer: () => Promise<RTCIceServer>,
        evtUnregisteredByGateway: VoidSyncEvent,
        private readonly jsSipSocket: JsSipSocket,
        imsi: string,
        sipPassword: string,
        private readonly towardSimEncryptor: Encryptor,

    ) {

        const uri = this.jsSipSocket.sip_uri;

        const register_expires = 61;

        //NOTE: Do not put more less than 60 or more than 7200 for register expire ( asterisk will respond with 60 or 7200 )
        this.jsSipUa = new JsSIP.UA({
            "sockets": this.jsSipSocket,
            uri,
            "authorization_user": imsi,
            "password": sipPassword,
            //NOTE: The ua instance id is also bundled in the contact uri but
            //but jsSip does not allow us to not include an instance id
            //if we don't provide one it will generate one for us.
            //So we are providing it for consistency.
            "instance_id": uaDescriptor.instance.match(/"<urn:([^>]+)>"$/)![1],
            "register": false,
            "contact_uri": uri + ";" + serializedUaObjectCarriedOverSipContactParameter.buildParameter(uaDescriptor),
            register_expires
        });

        let lastRegisterTime = 0;

        this.jsSipUa.on("registrationExpiring", async () => {

            if (!this.isRegistered) {
                return;
            }

            //NOTE: For react native, jsSIP does not post "unregistered" event when registration
            //actually expire.
            if (Date.now() - lastRegisterTime >= register_expires * 1000) {

                console.log("Sip registration has expired while app was in the background");

                this.jsSipUa.emit("unregistered");

            }

            this.jsSipUa.register();

        });

        evtUnregisteredByGateway.attach(
            () => this.jsSipUa.emit("unregistered")
        );

        /* 
        event 'registered' is posted only when register change 
        so we use this instead.
        */
        this.jsSipSocket.evtSipRegistrationSuccess.attach(()=>{

                lastRegisterTime = Date.now();

                if( this.isRegistered ){
                    return;
                }

                this.isRegistered = true;

                this.evtRegistrationStateChanged.post(this.isRegistered);

        });

        this.jsSipUa.on("unregistered", () => {

            if( !this.isRegistered ){
                return;
            }

            this.isRegistered = false;

            this.evtRegistrationStateChanged.post(this.isRegistered);

        });

        this.jsSipUa.on("newMessage", ({ originator, request }) => {

            if (originator !== "remote") {
                return;
            }

            this.onMessage(request);

        });

        this.jsSipUa.on("newRTCSession", ({ originator, session, request }) => {

            if (originator !== "remote") {
                return;
            }

            this.onIncomingCall(session, request);

        });

        this.jsSipUa.start();

    }

    public isRegistered = false;

    /*
    //TODO: If no response to register do something
    public register() {

        this.jsSipUa.register();

    }
    */

    public register() {

        this.jsSipUa.register();

        Promise.race([
            this.jsSipSocket.evtUnderlyingSocketClose.waitFor()
                .then(() => { throw new Error("Closed before registered") }),
            this.jsSipSocket.evtSipRegistrationSuccess.waitFor()
        ]).catch(() => {

            console.log("[Ua] socket closed while a SIP registration was ongoing, retrying SIP REGISTER");

            this.register();

        });

    }


    public unregister() {

        if (!this.isRegistered) {
            return;
        }

        this.jsSipUa.unregister();

    }



    public readonly evtIncomingMessage = new SyncEvent<{
        fromNumber: phoneNumber;
        bundledData: Exclude<gwTypes.BundledData.ServerToClient, gwTypes.BundledData.ServerToClient.Ringback>;
        handlerCb: () => void;
    }>();

    private async onMessage(request): Promise<void> {

        const bundledData = await extractBundledDataFromHeaders<gwTypes.BundledData.ServerToClient>(
            (() => {

                const out = {};

                for (const key in request.headers) {
                    out[key] = request.headers[key][0].raw;
                }

                return out;

            })(),
            this.towardUserDecryptor
        );


        const fromNumber = request.from.uri.user;

        if (bundledData.type === "RINGBACK") {

            this.evtRingback.post(bundledData.callId);

            return;

        }

        const pr = this.postEvtIncomingMessage({
            fromNumber,
            bundledData
        });

        this.jsSipSocket.setMessageOkDelay(request, pr);

    }

    private postEvtIncomingMessage = runExclusive.buildMethod(
        (evtData: Pick<SyncEvent.Type<typeof UaSim.prototype.evtIncomingMessage>, "fromNumber" | "bundledData">) => {

            let handlerCb!: () => void;

            const pr = new Promise<void>(resolve => handlerCb = resolve);

            this.evtIncomingMessage.post({
                ...evtData,
                handlerCb
            });

            return pr;

        }
    );

    public sendMessage(
        number: phoneNumber,
        bundledData: gwTypes.BundledData.ClientToServer
    ): Promise<void> {

        return new Promise<void>(
            async (resolve, reject) => this.jsSipUa.sendMessage(
                `sip:${number}@${env.baseDomain}`,
                "| encrypted message bundled in header |",
                {
                    "contentType": "text/plain; charset=UTF-8",
                    "extraHeaders": await smuggleBundledDataInHeaders<gwTypes.BundledData.ClientToServer>(
                        bundledData,
                        this.towardSimEncryptor
                    ).then(headers => Object.keys(headers).map(key => `${key}: ${headers[key]}`)),
                    "eventHandlers": {
                        "succeeded": () => resolve(),
                        "failed": ({ cause }) => reject(new Error(`Send message failed ${cause}`))
                    }
                }
            )
        );


    }

    public readonly evtIncomingCall = new SyncEvent<{
        fromNumber: phoneNumber;
        terminate(): void;
        prTerminated: Promise<void>;
        onAccepted(): Promise<{
            state: "ESTABLISHED";
            sendDtmf(signal: DtmFSignal, duration: number): void;
        }>
    }>();


    private onIncomingCall(jsSipRtcSession, request): void {

        const evtRequestTerminate = new VoidSyncEvent();
        const evtAccepted = new VoidSyncEvent();
        const evtTerminated = new VoidSyncEvent();
        const evtDtmf = new SyncEvent<{ signal: DtmFSignal; duration: number; }>();
        const evtEstablished = new VoidSyncEvent();


        evtRequestTerminate.attachOnce(() => jsSipRtcSession.terminate());

        evtDtmf.attach(({ signal, duration }) =>
            jsSipRtcSession.sendDTMF(signal, { duration })
        );

        evtAccepted.attachOnce(async () => {

            const rtcIceServer = await this.getRtcIceServer();

            jsSipRtcSession.on("icecandidate", newIceCandidateHandler(rtcIceServer));

            jsSipRtcSession.answer({
                "mediaConstraints": { "audio": true, "video": false },
                "pcConfig": { "iceServers": [rtcIceServer] }
            });

            (jsSipRtcSession.connection as RTCPeerConnection).addEventListener(
                "track",
                ({ streams: [stream] }) => playAudioStream(stream)
            );

        });


        jsSipRtcSession.once("confirmed", () => evtEstablished.post());

        jsSipRtcSession.once("ended", () => evtTerminated.post());

        jsSipRtcSession.once("failed", () => evtTerminated.post());


        this.evtIncomingCall.post({
            "fromNumber": request.from.uri.user,
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

    public async placeOutgoingCall(number: phoneNumber): Promise<{
        terminate(): void;
        prTerminated: Promise<void>;
        prNextState: Promise<{
            state: "RINGBACK";
            prNextState: Promise<{
                state: "ESTABLISHED";
                sendDtmf(signal: DtmFSignal, duration: number): void;
            }>
        }>
    }> {

        const evtEstablished = new VoidSyncEvent();
        const evtTerminated = new VoidSyncEvent();
        const evtDtmf = new SyncEvent<{ signal: DtmFSignal; duration: number; }>();
        const evtRequestTerminate = new VoidSyncEvent();
        const evtRingback = new VoidSyncEvent();

        const rtcICEServer = await this.getRtcIceServer();

        this.jsSipUa.call(
            `sip:${number}@${env.baseDomain}`,
            {
                "mediaConstraints": { "audio": true, "video": false },
                "pcConfig": {
                    "iceServers": [rtcICEServer]
                },
                "eventHandlers": {
                    "icecandidate": newIceCandidateHandler(rtcICEServer),
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

                        (jsSipRtcSession.connection as RTCPeerConnection).addEventListener(
                            "track",
                            ({ streams: [stream] }) => playAudioStream(stream)
                        );

                    },
                    "confirmed": () => evtEstablished.post(),
                    "ended": () => evtTerminated.post(),
                    "failed": () => evtTerminated.post(),
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



}


function playAudioStream(stream: MediaStream) {

    const audio = document.createElement("audio");

    audio.autoplay = true;

    audio.srcObject = stream;

}

/** The socket interface that jsSIP UA take as constructor parameter  */
interface IjsSipSocket {

    via_transport: string;
    url: string; /* "wss://dev.[dev.]semasim.com" */
    sip_uri: string; /* `sip:${imsi}@[dev.]semasim.com` */

    connect(): void;
    disconnect(): void;
    send(data: string): boolean;

    onconnect(): void;
    ondisconnect(error: boolean, code?: number, reason?: string): void;
    ondata(data: string): boolean;

}

interface Hacks {


    /** Posted when a OK response to a REGISTER request is received */
    readonly evtSipRegistrationSuccess: VoidSyncEvent;

    /**
     * To call when receiving as SIP MESSAGE 
     * to prevent immediately sending the 200 OK 
     * response but rather wait
     * until some action have been completed.
     * 
     * @param request the request prop of the 
     * eventData emitted by JsSIP UA for the 
     * "newMessage" event. ( when originator === remote )
     * @param pr The response to the SIP MESSAGE
     * will not be sent until this promise resolve.
     */
    setMessageOkDelay(request: any, pr: Promise<void>): void;

    readonly evtUnderlyingSocketClose: VoidSyncEvent;

}

class JsSipSocket implements IjsSipSocket, Hacks {

    public readonly evtSipRegistrationSuccess= new VoidSyncEvent();
    public readonly evtUnderlyingSocketClose = new VoidSyncEvent();

    public readonly via_transport: sip.TransportProtocol = "WSS";

    public readonly url: string = this.connection.url;

    private sdpHacks(direction: "INCOMING" | "OUTGOING", sipPacket: sip.Packet) {

        if (sipPacket.headers["content-type"] !== "application/sdp") {
            return;
        }

        const editSdp = (sdpEditor: (parsedSdp: any) => void): void => {

            const parsedSdp = sip.parseSdp(
                sip.getPacketContent(sipPacket)
                    .toString("utf8")
            );

            sdpEditor(parsedSdp);

            sip.setPacketContent(
                sipPacket,
                sip.stringifySdp(parsedSdp)
            );

        };

        switch (direction) {
            case "INCOMING":

                //NOTE: Sdp Hack for Mozilla
                if (!/firefox/i.test(navigator.userAgent)) {
                    return;
                }

                console.log("Firefox SDP hack !");

                editSdp(parsedSdp => {

                    const a = parsedSdp["m"][0]["a"];

                    if (!!a.find(v => /^mid:/i.test(v))) {
                        return;
                    }

                    parsedSdp["m"][0]["a"] = [...a, "mid:0"];

                });

                break;
            case "OUTGOING":


                editSdp(parsedSdp => {

                    //NOTE: We allow to try establishing P2P connection only 
                    //when the public address resolved by the stun correspond
                    //to a private address of class A ( 192.168.x.x ).
                    //Otherwise we stripe out the srflx candidate and use turn.

                    const a = parsedSdp["m"][0]["a"];

                    const updated_a = a.filter(line => {

                        const match = line.match(/srflx\ raddr\ ([0-9]+)\./);

                        if (!match) {
                            return true;
                        }

                        return match[1] === "192";

                    });

                    parsedSdp["m"][0]["a"] = updated_a;

                });

                break;
        }



    }

    public readonly sip_uri: string;

    constructor(
        imsi: string,
        private readonly connection: ConnectionApi
    ) {

        this.sip_uri = `sip:${imsi}@${env.baseDomain}`;

        const onBackedSocketConnect = (backendSocket: sip.Socket) => {

            backendSocket.evtClose.attachOnce(() => this.evtUnderlyingSocketClose.post());

            {

                const onSipPacket = (sipPacket: sip.Packet) => {

                    if (readImsi(sipPacket) !== imsi) {
                        return;
                    }

                    this.sdpHacks("INCOMING", sipPacket);

                    this.ondata(sip.toData(sipPacket).toString("utf8"));

                    if (
                        !sip.matchRequest(sipPacket) &&
                        sipPacket.headers.cseq.method === "REGISTER" &&
                        sipPacket.status === 200
                    ) {
                        this.evtSipRegistrationSuccess.post();
                    }

                }

                backendSocket.evtRequest.attach(onSipPacket);
                backendSocket.evtResponse.attach(onSipPacket);

            }

            backendSocket.evtPacketPreWrite.attach(sipPacket => this.sdpHacks("OUTGOING", sipPacket));

        };

        connection.evtConnect.attach(socket => onBackedSocketConnect(socket));

        const socket = connection.get();

        if (!(socket instanceof Promise)) {

            onBackedSocketConnect(socket);

        }


    }

    public connect(): void {
        this.onconnect();
    }

    public disconnect(): void {
        throw new Error("JsSip should not call disconnect");
    }

    private messageOkDelays = new Map<string, Promise<void>>();

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

            while (true) {

                const socketOrPrSocket = this.connection.get();

                const socket = socketOrPrSocket instanceof Promise ?
                    (await socketOrPrSocket) :
                    socketOrPrSocket;

                const isSent = await socket.write(
                    sip.parse(
                        Buffer.from(data, "utf8")
                    )
                );

                if (!isSent) {
                    console.log("WARNING: websocket sip data was not sent successfully", data);
                    continue;
                }

                break;

            }

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

/** Let end gathering ICE candidates as quickly as possible. */
function newIceCandidateHandler(rtcICEServer: RTCIceServer) {

    const isReady = newIceCandidateHandler.isReadyFactory(rtcICEServer);

    let readyTimer: number | undefined = undefined;

    return (data: { candidate: RTCIceCandidate, ready: () => void }) => {

        const { candidate, ready } = data;

        //console.log(candidate);

        const readyState = isReady(candidate.candidate);

        console.log(`ICE: ${readyState}`);

        switch (readyState) {
            case "NOT READY": return;
            case "AT LEAST ONE RELAY CANDIDATE READY":
                if (readyTimer === undefined) {
                    readyTimer = setTimeout(() => {
                        console.log("Timing out ice candidates gathering");
                        ready();
                    }, 300);
                }
                return;
            case "ALL CANDIDATES READY":
                clearTimeout(readyTimer);
                ready();
                return;
        }

    };

}

namespace newIceCandidateHandler {

    export function isReadyFactory(rtcICEServer: RTCIceServer) {

        //console.log(JSON.stringify(rtcICEServer, null, 2));

        const p = (() => {

            const urls = typeof rtcICEServer.urls === "string" ?
                [rtcICEServer.urls] : rtcICEServer.urls;;

            return {
                "isSrflxCandidateExpected": !!urls.find(url => !!url.match(/^stun/i)),
                "isRelayCandidateExpected": !!urls.find(url => !!url.match(/^turn:/i)),
                "isEncryptedRelayCandidateExpected": !!urls.find(url => !!url.match(/^turns:/i)),
                "lines": new Array<string>()
            };

        })();

        //console.log(JSON.stringify(p, null, 2));

        return (
            line: string
        ): "ALL CANDIDATES READY" | "AT LEAST ONE RELAY CANDIDATE READY" | "NOT READY" => {

            p.lines.push(line);

            const isRtcpExcepted = !!p.lines
                .map(line => parseLine(line))
                .find(({ component }) => component === "RTCP")
                ;

            if (isFullyReady({ ...p, isRtcpExcepted })) {
                return "ALL CANDIDATES READY";
            }

            return countRelayCandidatesReady(p.lines, isRtcpExcepted) >= 1 ?
                "AT LEAST ONE RELAY CANDIDATE READY" : "NOT READY";

        };

    }

    function parseLine(line: string): {
        component: "RTP" | "RTCP";
        priority: number;
    } {

        const match = line.match(/(1|2)\s+(?:udp|tcp)\s+([0-9]+)\s/i)!;

        return {
            "component": match[1] === "1" ? "RTP" : "RTCP",
            "priority": parseInt(match[2])
        }

    }

    function countRelayCandidatesReady(lines: string[], isRtcpExcepted: boolean): number {

        const parsedLines = lines
            .filter(line => !!line.match(/udp.+relay/i))
            .map(parseLine);

        const parsedRtpLines = parsedLines
            .filter(({ component }) => component === "RTP");

        if (!isRtcpExcepted) {
            return parsedRtpLines.length;
        }

        const parsedRtcpLines = parsedLines
            .filter(({ component }) => component === "RTCP");

        return parsedRtpLines
            .filter(({ priority: rtpPriority }) =>
                !!parsedRtcpLines.find(({ priority }) => Math.abs(priority - rtpPriority) === 1)
            )
            .length
            ;

    }

    function isSrflxCandidateReady(lines: string[], isRtcpExcepted: boolean): boolean {

        const parsedLines = lines
            .filter(line => !!line.match(/udp.+srflx/i))
            .map(parseLine)
            ;

        const parsedRtpLines = parsedLines
            .filter(({ component }) => component === "RTP");

        if (!isRtcpExcepted) {
            return parsedRtpLines.length !== 0;
        }

        const parsedRtcpLines = parsedLines
            .filter(({ component }) => component === "RTCP");

        return !!parsedRtpLines
            .find(({ priority: rtpPriority }) =>
                !!parsedRtcpLines.find(({ priority }) => Math.abs(priority - rtpPriority) === 1)
            )
            ;

    }

    function isFullyReady(p: {
        lines: string[];
        isSrflxCandidateExpected: boolean;
        isRelayCandidateExpected: boolean;
        isEncryptedRelayCandidateExpected: boolean;
        isRtcpExcepted: boolean;
    }): boolean {

        return (
            !p.isSrflxCandidateExpected ?
                true :
                isSrflxCandidateReady(p.lines, p.isRtcpExcepted)
        ) && (
                (p.isRelayCandidateExpected ? 1 : 0)
                +
                (p.isEncryptedRelayCandidateExpected ? 1 : 0)
                <=
                countRelayCandidatesReady(p.lines, p.isRtcpExcepted));

    }

}

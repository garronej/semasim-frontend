//NOTE: Require jssip_compat loaded on the page.

import { Evt, VoidEvt, UnpackEvt, NonPostableEvt, StatefulReadonlyEvt } from "evt";

import type { types as gwTypes } from "../gateway/types";
import { extractBundledDataFromHeaders, smuggleBundledDataInHeaders, } from "../gateway/bundledData";
import { readImsi } from "../gateway/readImsi";
import * as  serializedUaObjectCarriedOverSipContactParameter from "../gateway/serializedUaObjectCarriedOverSipContactParameter";
import * as types from "./types";
import { AsyncReturnType } from "../tools/typeSafety/AsyncReturnType";

import * as sip from "ts-sip";
import * as runExclusive from "run-exclusive";
import { env } from "./env";

type phoneNumber = import("phone-number/dist/lib").phoneNumber;
type Encryptor = import("./crypto/cryptoLibProxy").Encryptor;
type Decryptor = import("./crypto/cryptoLibProxy").Decryptor;
type CryptoRelatedParams = AsyncReturnType<
    typeof import("./crypto/appCryptoSetupHelper")["appCryptoSetupHelper"]
>["paramsNeededToInstantiateUa"];


declare const JsSIP: any;
declare const Buffer: any;

//JsSIP.debug.enable("JsSIP:*");
JsSIP.debug.disable("JsSIP:*");

type ConnectionApi = Pick<import("./toBackend/connection").ConnectionApi, "url" | "getSocket" | "evtConnect"> &
{ remoteNotifyEvts: Pick<types.RemoteNotifyEvts, "getRtcIceServer"> };

type UserSimEvts = Pick<
    types.UserSim.Evts,
    "evtSipPasswordRenewed" | "evtDelete" | "evtReachabilityStatusChange"
>;


export function createSipUserAgentFactory(
    params: {
        email: string,
        uaInstanceId: string,
        cryptoRelatedParams: CryptoRelatedParams;
        pushNotificationToken: string;
        connectionApi: ConnectionApi;
        userSimEvts: UserSimEvts;
    }
) {

    const uaDescriptor: gwTypes.Ua = {
        "instance": params.uaInstanceId,
        "pushToken": params.pushNotificationToken,
        "towardUserEncryptKeyStr": params.cryptoRelatedParams.towardUserEncryptKeyStr,
        "userEmail": params.email,
        "platform": (() => {
            switch (env.jsRuntimeEnv) {
                case "browser": return "web";
                case "react-native": return env.hostOs;
            }
        })()

    };

    const { towardUserDecryptor } = params.cryptoRelatedParams;

    const getCurrentRtcIceServers = () => params.connectionApi.remoteNotifyEvts.getRtcIceServer();

    return function createSipUserAgent(
        userSim: {
            sim: { imsi: string; };
            password: string;
            towardSimEncryptKeyStr: string;
            ownership: { status: "OWNED" | "SHARED CONFIRMED" };
            reachableSimState: Object | undefined;
        }
    ): SipUserAgent {

        const { imsi } = userSim.sim;

        const getPrReachable = () => params.userSimEvts.evtReachabilityStatusChange.waitFor(
            ({ sim, reachableSimState }) => (
                sim.imsi === imsi &&
                reachableSimState !== undefined
            )).then(() => { });

        return new SipUserAgent({
            uaDescriptor,
            towardUserDecryptor,
            getCurrentRtcIceServers,
            "evtUnregistered": (() => {

                const out = new Evt<{ prReRegister: Promise<void>; }>();

                params.userSimEvts.evtSipPasswordRenewed.attach(
                    ({ sim }) => sim.imsi === imsi,
                    () => out.post({ "prReRegister": Promise.resolve() })
                );

                params.userSimEvts.evtDelete.attachOnce(
                    ({ userSim: { sim } }) => sim.imsi === imsi,
                    () => out.post({ "prReRegister": new Promise<never>(() => { }) })
                );

                params.userSimEvts.evtReachabilityStatusChange.attach(
                    ({ sim, reachableSimState }) => (
                        sim.imsi === imsi &&
                        reachableSimState === undefined
                    ),
                    () => out.post({ "prReRegister": getPrReachable() })
                );

                return out;

            })(),
            "jsSipSocket": new JsSipSocket(imsi, params.connectionApi),
            imsi,
            "password": userSim.password,
            "towardSimEncryptor": params.cryptoRelatedParams.getTowardSimEncryptor(userSim)
                .towardSimEncryptor,
            "prRegister": userSim.reachableSimState === undefined ?
                getPrReachable() : Promise.resolve()
        });

    }

}


class SipUserAgent {

    public readonly evtIsRegistered: StatefulReadonlyEvt<boolean> = Evt.create<boolean>(false);

    private readonly jsSipUa: any;
    private evtRingback = new Evt<string>();

    constructor(
        private readonly params: {
            uaDescriptor: gwTypes.Ua;
            towardUserDecryptor: Decryptor;
            getCurrentRtcIceServers: () => Promise<RTCIceServer>;
            evtUnregistered: Evt<{ prReRegister: Promise<void>; }>;
            jsSipSocket: JsSipSocket;
            imsi: string;
            password: string;
            towardSimEncryptor: Encryptor;
            prRegister: Promise<void>;
        }
    ) {

        //NOTE: Do not put more less than 60 or more than 7200 for register expire ( asterisk will respond with 60 or 7200 )
        const register_expires = 61;

        {

            const uri = params.jsSipSocket.sip_uri;

            this.jsSipUa = new JsSIP.UA({
                "sockets": params.jsSipSocket,
                uri,
                "authorization_user": params.imsi,
                "password": params.password,
                //NOTE: The ua instance id is also bundled in the contact uri but
                //but jsSip does not allow us to not include an instance id
                //if we don't provide one it will generate one for us.
                //So we are providing it for consistency.
                "instance_id": params.uaDescriptor.instance.match(/"<urn:([^>]+)>"$/)![1],
                "register": false,
                "contact_uri": uri + ";" + serializedUaObjectCarriedOverSipContactParameter.buildParameter(params.uaDescriptor),
                register_expires
            });

        }

        let lastRegisterTime = 0;


        this.jsSipUa.on("registrationExpiring", async () => {

            if (!this.evtIsRegistered.state) {
                return;
            }


            //NOTE: For react native, jsSIP does not post "unregistered" event when registration
            //actually expire.
            if (Date.now() - lastRegisterTime >= register_expires * 1000) {

                console.log("Sip registration has expired while app was in the background");

                this.jsSipUa.emit("unregistered");

            }

            //this.jsSipUa.register();
            this.register();

        });


        params.evtUnregistered.attach(({ prReRegister }) => {

            /*
            if (!obsIsRegistered.value) {
                return;
            }

            this.jsSipUa.emit("unregistered");

            if (!shouldReRegister) {
                return;
            }

            //this.jsSipUa.register();
            this.register();
            */

            this.jsSipUa.emit("unregistered");

            prReRegister.then(() => this.register());

        });

        /* 
        event 'registered' is posted only when register change 
        so we use this instead.
        */
        params.jsSipSocket.evtSipRegistrationSuccess.attach(() => {

            lastRegisterTime = Date.now();

            Evt.asPostable(this.evtIsRegistered).state = true;

        });

        this.jsSipUa.on("unregistered", () => Evt.asPostable(this.evtIsRegistered).state = false);

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

        params.prRegister.then(() => this.register());

    }


    private register() {

        this.jsSipUa.register();

        Promise.race([
            this.params.jsSipSocket.evtUnderlyingSocketClose.waitFor()
                .then(() => { throw new Error("Closed before registered") }),
            this.params.jsSipSocket.evtSipRegistrationSuccess.waitFor()
        ]).catch(() => {

            console.log("[Ua] socket closed while a SIP registration was ongoing, retrying SIP REGISTER");

            this.register();

        });

    }


    /*
    public unregister() {

        if (!this.isRegistered) {
            return;
        }

        this.jsSipUa.unregister();

    }
    */


    public readonly evtIncomingMessage: NonPostableEvt<{
            fromNumber: phoneNumber;
            bundledData: Exclude<
                gwTypes.BundledData.ServerToClient,
                gwTypes.BundledData.ServerToClient.Ringback
            >;
            handlerCb: () => void;
    }> = new Evt();


    private async onMessage(request): Promise<void> {

        const bundledData = await extractBundledDataFromHeaders<gwTypes.BundledData.ServerToClient>(
            (() => {

                const out = {};

                for (const key in request.headers) {
                    out[key] = request.headers[key][0].raw;
                }

                return out;

            })(),
            this.params.towardUserDecryptor
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

        this.params.jsSipSocket.setMessageOkDelay(request, pr);

    }

    private postEvtIncomingMessage = runExclusive.buildMethod(
        (evtData: Pick<UnpackEvt<typeof SipUserAgent.prototype.evtIncomingMessage>, "fromNumber" | "bundledData">) => {

            let handlerCb!: () => void;

            const pr = new Promise<void>(resolve => handlerCb = resolve);

            Evt.asPostable(this.evtIncomingMessage).post({
                ...evtData,
                handlerCb
            })

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
                        this.params.towardSimEncryptor
                    ).then(headers => Object.keys(headers).map(key => `${key}: ${headers[key]}`)),
                    "eventHandlers": {
                        "succeeded": () => resolve(),
                        "failed": ({ cause }) => reject(new Error(`Send message failed ${cause}`))
                    }
                }
            )
        );


    }

    public readonly evtIncomingCall = Evt.asNonPostable(
        Evt.create<{
            fromNumber: phoneNumber;
            terminate(): void;
            prTerminated: Promise<void>;
            onAccepted(): Promise<{
                state: "ESTABLISHED";
                sendDtmf(signal: types.PhoneCallUi.DtmFSignal, duration: number): void;
            }>
        }>()
    );



    private onIncomingCall(jsSipRtcSession: any, request: any): void {

        const evtRequestTerminate = Evt.create();
        const evtAccepted = Evt.create();
        const evtTerminated = Evt.create();
        const evtDtmf = Evt.create<{ signal: types.PhoneCallUi.DtmFSignal; duration: number; }>();
        const evtEstablished = Evt.create();


        evtRequestTerminate.attachOnce(() => jsSipRtcSession.terminate());

        evtDtmf.attach(({ signal, duration }) =>
            jsSipRtcSession.sendDTMF(signal, { duration })
        );

        evtAccepted.attachOnce(async () => {

            const rtcIceServer = await this.params.getCurrentRtcIceServers();

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


        Evt.asPostable(this.evtIncomingCall).post({
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
                sendDtmf(signal: types.PhoneCallUi.DtmFSignal, duration: number): void;
            }>
        }>
    }> {

        const evtEstablished = Evt.create();
        const evtTerminated = Evt.create();
        const evtDtmf = Evt.create<{ signal: types.PhoneCallUi.DtmFSignal; duration: number; }>();
        const evtRequestTerminate = Evt.create();
        const evtRingback = Evt.create();

        const rtcICEServer = await this.params.getCurrentRtcIceServers();

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
    readonly evtSipRegistrationSuccess: VoidEvt;

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

    readonly evtUnderlyingSocketClose: VoidEvt;

}

class JsSipSocket implements IjsSipSocket, Hacks {

    public readonly evtSipRegistrationSuccess = Evt.create();
    public readonly evtUnderlyingSocketClose = Evt.create();

    public readonly via_transport: sip.TransportProtocol = "WSS";

    public readonly url: string = this.connectionApi.url;

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
        private readonly connectionApi: ConnectionApi
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

        connectionApi.evtConnect.attach(socket => onBackedSocketConnect(socket));

        const socket = connectionApi.getSocket();

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

                const socketOrPrSocket = this.connectionApi.getSocket();

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

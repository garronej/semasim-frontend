import { SyncEvent, VoidSyncEvent } from "ts-events-extended";
import { phoneNumber } from "../../../shared";
import { types, apiDeclaration } from "../../../api";
import {
    types as gwTypes,
    extractBundledDataFromHeaders,
    smuggleBundledDataInHeaders,
    urlSafeB64
} from "./semasim-gateway";
import { AppSocket } from "./AppSocket";

declare const JsSIP: any;

//JsSIP.debug.enable("JsSIP:*");
JsSIP.debug.disable("JsSIP:*");

export class Ua {

    public static email: string;
    public static instanceId: string;
    private static appSocket: AppSocket;

    /** Must be called in webphone.ts */
    public static init(email: string, instanceId: string) {

        this.email = email;
        this.instanceId = instanceId;

        this.appSocket = new AppSocket();

        this.appSocket.connect();

        this.appSocket.evtConnected.attach(() => console.log("appSocket connected"));
        this.appSocket.evtDisconnected.attach(() => console.log("appSocket disconnected"));
        //this.appSocket.evtRawSipPacket.attach(({ data })=> console.log(data));

    }

    public readonly evtIncomingMessage = new SyncEvent<{
        fromNumber: phoneNumber;
        bundledData: gwTypes.BundledData.ServerToClient;
        text: string;
    }>();

    /** isRegistered */
    public readonly evtRegistrationStateChanged = new SyncEvent<boolean>();

    private readonly jsSipUa: any;

    private evtRingback = new SyncEvent<string>();

    constructor(
        public readonly userSim: types.UserSim.Usable,
    ) {

        let uri = `sip:${this.userSim.sim.imsi}-webRTC@${apiDeclaration.domain}`;

        this.jsSipUa = new JsSIP.UA({
            "sockets": Ua.appSocket.makeProxy(this.userSim.sim.imsi),
            uri,
            "authorization_user": this.userSim.sim.imsi,
            "password": this.userSim.password,
            "instance_id": Ua.instanceId,
            "register": false,
            "contact_uri": `${uri};enc_email=${urlSafeB64.enc(Ua.email)}`,
            "connection_recovery_min_interval": 86400,
            "connection_recovery_max_interval": 86400,
            "register_expires": 86400
        });

        this.jsSipUa.on("registered", ({ response }) =>
            this.evtRegistrationStateChanged.post(true)
        );

        this.jsSipUa.on("unregistered", ({ response, cause }) =>
            this.evtRegistrationStateChanged.post(false)
        );

        this.jsSipUa.on("newMessage", ({ originator, message, request }) => {

            if (originator !== "remote") return;

            let bundledData = extractBundledDataFromHeaders((() => {

                let out = {};

                for (let key in request.headers) {
                    out[key] = request.headers[key][0].raw;
                }

                return out;

            })()) as gwTypes.BundledData.ServerToClient;

            let fromNumber = phoneNumber.build(
                request.from.uri.user,
                this.userSim.sim.country ? this.userSim.sim.country.iso : undefined
            );

            if (bundledData.type === "RINGBACK") {

                this.evtRingback.post(bundledData.callId);

                return;

            }

            this.evtIncomingMessage.post({ fromNumber, bundledData, "text": request.body });

        });

        this.jsSipUa.start();

        (async () => {

            if (!Ua.appSocket.isConnected()) {
                await Ua.appSocket.evtConnected.waitFor()
            }

            this.jsSipUa.register();

        })();

        this.jsSipUa.on("connecting", ({ socket, attempts }) => console.log(`connecting attempts: ${attempts}`));
        this.jsSipUa.on("connected", ({ socket }) => console.log("connected"));
        this.jsSipUa.on("disconnected", () => console.log("disconnected"));
        this.jsSipUa.on("registrationFailed", ({ response, cause }) => console.log("registrationFailed", { response, cause }));
        this.jsSipUa.on("registrationExpiring", () => console.log("registrationExpiring"));
        this.jsSipUa.on("newRTCSession", ({ originator, session, request }) =>
            console.log("newRTCSession", { originator, session, request })
        );

    }

    public get isRegistered(): boolean {
        return this.jsSipUa.isRegistered();
    }

    /** return exactSendDate to match with sendReport and statusReport */
    public async sendMessage(
        number: phoneNumber,
        text: string
    ): Promise<Date> {

        let exactSendDate = new Date();

        let extraHeaders = (() => {

            let headers = smuggleBundledDataInHeaders((() => {

                let bundledData: gwTypes.BundledData.ClientToServer.Message = {
                    "type": "MESSAGE",
                    exactSendDate
                };

                return bundledData;

            })());

            let out: string[] = [];

            for (let key in headers) {

                out.push(`${key}: ${headers[key]}`);

            }

            return out;

        })();

        return new Promise<Date>(
            (resolve, reject) => this.jsSipUa.sendMessage(
                `sip:${number}@${apiDeclaration.domain}`,
                text,
                {
                    "contentType": "text/plain; charset=UTF-8",
                    extraHeaders,
                    "eventHandlers": {
                        "succeeded": () => resolve(exactSendDate),
                        "failed": ({ cause }) => reject(new Error(`Send message failed ${cause}`))
                    }
                }
            )
        );

    }

    private readonly pcConfig: RTCConfiguration = {
        "iceServers": [{ "urls": ["stun:stun1.l.google.com:19302"] }]
    };

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

        let evtEstablished = new VoidSyncEvent();
        let evtTerminated = new VoidSyncEvent();
        let evtDtmf = new SyncEvent<{ signal: Ua.DtmFSignal; duration: number; }>();
        let evtRequestTerminate = new VoidSyncEvent();
        let evtRingback = new VoidSyncEvent();

        this.jsSipUa.call(
            `sip:${number}@${apiDeclaration.domain}`,
            {
                "mediaConstraints": { "audio": true, "video": false },
                "pcConfig": this.pcConfig,
                "eventHandlers": {
                    "connecting": function () {

                        let jsSipRtcSession = this;

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

                        let rtcPeerConnection: RTCPeerConnection = jsSipRtcSession.connection;

                        rtcPeerConnection.onaddstream = ({ stream }) => {

                            let audioElem = $("<audio>", { "autoplay": "" });

                            audioElem.get(0)["srcObject"] = stream;

                        };

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


}

export namespace Ua {

    export type DtmFSignal =
        "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "*" | "#";

}



import { SyncEvent } from "ts-events-extended";
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

    /** return exactSendDate */
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


    public placeOutgoingCall(number: phoneNumber): {
        terminate(): void;
        prError: Promise<Error>,
        pr: Promise<{
            state: "RINGBACK"
            pr: Promise<{
                state: "ESTABLISHED" | "REMOTE REJECT"
                pr: Promise<{
                    state: "REMOTE HANGUP"
                }>
            }>
        }>
    } {

        console.log("========================================================!!!avec ice");

        let pcConfig: RTCConfiguration= {
            "iceServers": [ { "urls": [ "stun:stun1.l.google.com:19302" ] } ]
        };

        this.jsSipUa.call(
            `sip:${number}@${apiDeclaration.domain}`,
            {
                "mediaConstraints": { "audio": true, "video": false },
                pcConfig,
                "eventHandlers": {
                    "connecting": function () {

                        let rtcPeerConnection: RTCPeerConnection = this.connection;

                        rtcPeerConnection.onaddstream = ({ stream }) => {

                            let audioElem= $("<audio>", { "autoplay": "" });

                            audioElem.get(0)["srcObject"]= stream;

                        };


                    },
                    "peerconnection": () => console.log("peerconnection"),
                    "sending": () => console.log("sending"),
                    "progress": () => console.log("progress"),
                    "accepted": () => console.log("accepted"),
                    "confirmed": () => console.log("confirmed"),
                    "ended": () => console.log("ended"),
                    "failed": () => console.log("failed"),
                    "newDTMF": () => console.log("newDTMF"),
                    "newInfo": () => console.log("newInfo"),
                    "hold": () => console.log("hold"),
                    "unhold": () => console.log("unhold"),
                    "muted": () => console.log("muted"),
                    "unmuted": () => console.log("unmuted"),
                    "reinvite": () => console.log("reinvite"),
                    "update": () => console.log("update"),
                    "refer": () => console.log("refer"),
                    "replaces": () => console.log("replaces"),
                    "sdp": () => console.log("sdp"),
                    "getusermediafailed": () => console.log("getusermediafailed"),
                    "peerconnection:createofferfailed": () => console.log("peerconnection:createofferfailed"),
                    "peerconnection:createanswerfailed": () => console.log("peerconnection:createanswerfailed"),
                    "peerconnection:setlocaldescriptionfailed": () => console.log("peerconnection:setlocaldescriptionfailed"),
                    "peerconnection:setremotedescriptionfailed": () => console.log("peerconnection:setremotedescriptionfailed")
                }
            }
        );


        return null as any;

    }


}



/*

this.structure.find("button.id_ko").one("click", function () {

    try {
        session.terminate();

    } catch (error) {

        console.info("on a eut une erreur onTerminate", error.message);

    }


});





widget.userAgent.on("newRTCSession", function (data) {

    console.log("newRtcSession");



    data.session.once("ended", function () {

        window.free = true;

    });


    if (data.originator === "remote") {

        console.log("number", data.request.from.uri.user);

        var number = intlTelInputUtils.formatNumber(
            data.request.from.uri.user,
            widget.headerWidget.simCountry,
            intlTelInputUtils.numberFormat.E164
        );

        console.log("number after", number);


        let contact = widget.contactWidget.contacts[number] || { "number": number };

        widget.callWidget.incomingCall(contact, data.session);

    } else {


        let number = data.request.headers.To[0].match(/<sip:(.*)@d.+\.semasim\.vpn>$/)[1];

        let contact = widget.contactWidget.contacts[number];

        widget.callWidget.outgoingCall(contact, data.session);


    }

    session.on("addstream", function (data) {

        $("<audio>", { "autoplay": "", "src": window.URL.createObjectURL(data.stream) });

    }).on("failed", function (data) {

        widget.setState(CallWidget.TERMINATED, data.originator + " " + data.cause);

    }).on("iceconnectionstatechange", function (data) {

        //console.info("iceconnectionstatechange", data.state );

        if (data.state !== "connected") return;

        setTimeout(function () { widget.setState(CallWidget.RINGBACK, "remote ringing"); }, 3000);

        this.once("ended", function (data) {

            widget.setState(CallWidget.TERMINATED, data.originator + " " + data.cause);

        });


    })
    */
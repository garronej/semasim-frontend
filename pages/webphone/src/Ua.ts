import { SyncEvent } from "ts-events-extended";
import { phoneNumber } from "../../../shared";
import { types, apiDeclaration } from "../../../api";
import { 
    types as gwTypes, 
    extractBundledDataFromHeaders, 
    smuggleBundledDataInHeaders 
} from "./semasim-gateway";

declare const Buffer: any;
declare const JsSIP: any;

//JsSIP.debug.enable("JsSIP:*");
JsSIP.debug.disable("JsSIP:*");

export class Ua {

    /** Must be set manually before instantiation */
    public static instanceId: string;
    public static email: string;

    private static webSocket: object | undefined = undefined;

    public readonly evtIncomingMessage= new SyncEvent<{ 
        fromNumber: phoneNumber; 
        bundledData: gwTypes.BundledData.ServerToClient; 
        text: string; 
    }>();

    private readonly jsSipUa: any;

    constructor(
        public readonly userSim: types.UserSim.Usable,
    ) {

        if (!Ua.webSocket) {

            Ua.webSocket = new JsSIP.WebSocketInterface(
                `wss://www.${apiDeclaration.domain}`
            ) as object;

            Object.defineProperty(Ua.webSocket, "_onMessage", {
                "value": function _onMessage(ev: MessageEvent) {

                    let str= Buffer.from(ev.data).toString("utf8");

                    //console.log(str);

                    this.ondata(str);

                }
            });


        }

        let uri = `sip:${this.userSim.sim.imsi}@${apiDeclaration.domain}`;

        this.jsSipUa = new JsSIP.UA({
            "sockets": [Ua.webSocket],
            uri,
            "password": this.userSim.password,
            "instance_id": Ua.instanceId,
            "register": true,
            "contact_uri": [
                uri,
                `base64_email=${Buffer.from(Ua.email, "utf8").toString("base64")}`
            ].join(";"),
            "connection_recovery_min_interval": 120,
            "register_expires": 86400
        });

        this.jsSipUa.on("connecting", ({ socket, attempts }) => console.log(`connecting attempts: ${attempts}`));
        this.jsSipUa.on("connected", ({ socket }) => console.log("connected"));
        this.jsSipUa.on("disconnected", () => console.log("disconnected"));
        this.jsSipUa.on("registered", ({ response }) => console.log("registered", { response }));
        this.jsSipUa.on("unregistered", ({ response, cause }) => console.log("unregistered", { response, cause }));
        this.jsSipUa.on("registrationFailed", ({ response, cause }) => console.log("registrationFailed", { response, cause }));
        this.jsSipUa.on("registrationExpiring", () => console.log("registrationExpiring"));

        this.jsSipUa.on("newRTCSession", ({ originator, session, request }) =>
            console.log("newRTCSession", { originator, session, request })
        );

        this.jsSipUa.on("newMessage", ({ originator, message, request }) =>
            console.log("newMessage", { originator, message, request })
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

    }

    /** return exactSendDate */
    public async sendMessage(number: phoneNumber, text: string): Promise<Date> {

        let exactSendDate= new Date();

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

}

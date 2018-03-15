import { SyncEvent} from "ts-events-extended";
import { phoneNumber } from "../../../shared";
import { types, apiDeclaration } from "../../../api";
import {
    types as gwTypes,
    extractBundledDataFromHeaders,
    smuggleBundledDataInHeaders
} from "./semasim-gateway";
import { AppSocket } from "./AppSocket";

declare const Buffer: any;
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
        
        this.appSocket= new AppSocket();

        this.appSocket.connect();

        this.appSocket.evtConnected.attach(()=> console.log("appSocket connected"));
        this.appSocket.evtDisconnected.attach(()=> console.log("appSocket disconnected"));
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

        let uri = `sip:${this.userSim.sim.imsi}@${apiDeclaration.domain}`;

        this.jsSipUa = new JsSIP.UA({
            "sockets": Ua.appSocket.makeProxy(this.userSim.sim.imsi),
            uri,
            "password": this.userSim.password,
            "instance_id": Ua.instanceId,
            "register": false,
            "contact_uri": [
                uri,
                `base64_email=${Buffer.from(Ua.email, "utf8").toString("base64")}`
            ].join(";"),
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

        (async ()=>{

            if( !Ua.appSocket.isConnected() ){
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

}

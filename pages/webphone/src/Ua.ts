import { SyncEvent } from "ts-events-extended";
import { phoneNumber } from "../../../shared";
import { types, apiDeclaration } from "../../../api";

declare const Buffer: any;
declare const JsSIP: any;

//JsSIP.debug.enable("JsSIP:*");
JsSIP.debug.disable("JsSIP:*");

export class Ua {

    public static instanceId: string;
    public static email: string;

    private static webSocket: object | undefined = undefined;

    public readonly evtNewMessage = new SyncEvent<{
        number: phoneNumber;
        text: string;
    }>();

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

                    console.log(str);

                    this.ondata(str);

                }
            });


        }

        let uri = `sip:${this.userSim.sim.imsi}@${apiDeclaration.domain}`;

        let jsSipUa = new JsSIP.UA({
            "sockets": [Ua.webSocket],
            uri,
            "password": this.userSim.password,
            "instance_id": Ua.instanceId,
            "register": true,
            "contact_uri": [
                uri,
                `base64_email=${Buffer.from(Ua.email, "utf8").toString("base64")}`
            ].join(";"),
            "connection_recovery_min_interval": 120
        });

        jsSipUa.on("connecting", ({ socket, attempts }) => console.log(`connecting attempts: ${attempts}`));
        jsSipUa.on("connected", ({ socket }) => console.log("connected"));
        jsSipUa.on("disconnected", () => console.log("disconnected"));
        jsSipUa.on("registered", ({ response }) => console.log("registered", { response }));
        jsSipUa.on("unregistered", ({ response, cause }) => console.log("unregistered", { response, cause }));
        jsSipUa.on("registrationFailed", ({ response, cause }) => console.log("registrationFailed", { response, cause }));
        jsSipUa.on("registrationExpiring", () => console.log("registrationExpiring"));

        jsSipUa.on("newRTCSession", ({ originator, session, request }) =>
            console.log("newRTCSession", { originator, session, request })
        );

        jsSipUa.on("newMessage", ({ originator, message, request }) =>
            console.log("newMessage", { originator, message, request })
        );

        jsSipUa.on("newMessage", ({ originator, message, request }) => {

            if (originator !== "remote") return;

            let text = request.body;

            let number = phoneNumber.build(
                request.from.uri.user,
                this.userSim.sim.country ? this.userSim.sim.country.iso : undefined
            );


            this.evtNewMessage.post({ text, number });

        });

        jsSipUa.start();

    }

}

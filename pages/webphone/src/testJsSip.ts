import { client as api, declaration } from "../../../api";
import Types = declaration.Types;

declare const Buffer: any;

const JsSIP: any = window["JsSIP"];

//JsSIP.debug.enable("JsSIP:*");
JsSIP.debug.disable("JsSIP:*");

export async function run() {

    console.log("Run test jsSIP");

    let userSims = await api.getSims();

    let userSim = userSims[0];

    let webSocket = new JsSIP.WebSocketInterface(`wss://www.${Types.domain}`);

    let email= "joseph.garrone.gj@gmail.com";

    let uri= `sip:${userSim.sim.imsi}@${Types.domain}`;

    let ua = new JsSIP.UA({
        "sockets": [webSocket],
        uri,
        "password": userSim.password,
        "instance_id": "uuid:8f1fa16a-1165-4a96-8341-785b1ef24f12",
        "register": true,
        "contact_uri": [ 
            uri, 
            `base64_email=${Buffer.from(email, "utf8").toString("base64")}` 
        ].join(";"),
        "connection_recovery_min_interval": 120
    });

    ua.on("connecting", ({ socket, attempts })=> console.log(`connecting attempts: ${attempts}`));
    ua.on("connected", ({ socket })=> console.log("connected"));
    ua.on("disconnected", ()=> console.log("disconnected"));
    ua.on("registered", ({ response })=> console.log("registered", { response }));
    ua.on("unregistered", ({ response, cause })=> console.log("unregistered",{ response, cause }));
    ua.on("registrationFailed", ({ response, cause })=> console.log("registrationFailed", { response, cause }));
    ua.on("registrationExpiring", ()=> console.log("registrationExpiring"));

    ua.on("newRTCSession", ({ originator, session, request})=> 
        console.log("newRTCSession", { originator, session, request })
    );

    ua.on("newMessage", ({ originator, message, request })=> console.log("newMessage", { originator, message, request }));

    ua.start();

}

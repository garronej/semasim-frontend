import { client as api, declaration } from "../../../api";
import Types = declaration.Types;

const JsSIP: any = window["JsSIP"];

JsSIP.debug.enable("JsSIP:*");

//Maybe need www

export async function run() {

    console.log("Run test jsSIP");

    let userSims= await api.getSims();

    let userSim= userSims[0];

    let webSocket = new JsSIP.WebSocketInterface(`wss://${Types.domain}`);

    let configuration = {
        "sockets": [webSocket],
        "uri": `sip:${userSim.sim.imsi}@semasim.com`,
        "password": userSim.password,
        "instance_id": "uuid:8f1fa16a-1165-4a96-8341-785b1ef24f12",
        "register": true
    };

    let coolPhone = new JsSIP.UA(configuration);


}

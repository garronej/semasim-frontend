
import * as sip from "ts-sip";
import { SyncEvent } from "ts-events-extended";
import * as localApiHandlers from "./localApiHandlers";

export const url = "wss://www.semasim.com";

const idString = "frontendToBackend";

const apiServer = new sip.api.Server(
    localApiHandlers.handlers, 
    sip.api.Server.getDefaultLogger({
        idString,
        "log": console.log.bind(console),
        "hideKeepAlive": true
    })
);

let socketCurrent: sip.Socket | undefined = undefined;

//TODO: No need to export it.
export const evtConnect = new SyncEvent<sip.Socket>();

export function connect() {

    const socket = new sip.Socket(
        new WebSocket(url, "SIP"),
        {
            "remoteAddress": "www.semasim.com",
            "remotePort": 443
        }
    );

    socket.evtClose.attachOnce(() => {

        if( localApiHandlers.evtOpenElsewhere.postCount !== 0 ){
            return;
        }

        connect();

    });

    apiServer.startListening(socket);

    sip.api.client.enableKeepAlive(socket, 6 * 1000);

    sip.api.client.enableErrorLogging(
        socket,
        sip.api.client.getDefaultErrorLogger({
            idString,
            "log": console.log.bind(console)
        })
    );

    //TODO: Maybe move.
    socket.enableLogger({
        "socketId": idString,
        "remoteEndId": "BACKEND",
        "localEndId": "FRONTEND",
        "connection": false,
        "error": true,
        "close": true,
        "incomingTraffic": false,
        "outgoingTraffic": false,
        "ignoreApiTraffic": true
    }, console.log.bind(console));

    socketCurrent = socket;

    socket.evtConnect.attachOnce(() =>
        evtConnect.post(socket)
    );

}

export function get(): sip.Socket | Promise<sip.Socket> {

    if (
        !socketCurrent ||
        socketCurrent.evtClose.postCount !== 0 ||
        !socketCurrent.evtConnect.postCount
    ) {

        return new Promise<sip.Socket>(
            resolve => evtConnect.attachOnce(
                () => resolve(socketCurrent)
            )
        );

    } else {

        return socketCurrent;

    }

}

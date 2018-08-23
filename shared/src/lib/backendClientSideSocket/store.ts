
import * as sipLibrary from "ts-sip";
import { SyncEvent } from "ts-events-extended";
import { handlers as localApiHandlers } from "./localApiHandlers";

let currentBackendSocketInst: sipLibrary.Socket | undefined = undefined;

export const evtNewBackendConnection = new SyncEvent<sipLibrary.Socket>();

const idString= "backendSocket";

const server = new sipLibrary.api.Server(
    localApiHandlers, 
    sipLibrary.api.Server.getDefaultLogger({
        idString,
        "log": console.log.bind(console),
        "hideKeepAlive": true
    })
);

export function set(backendSocketInst: sipLibrary.Socket) {

    server.startListening(backendSocketInst);

    sipLibrary.api.client.enableKeepAlive(backendSocketInst, 15000);

    sipLibrary.api.client.enableErrorLogging(
        backendSocketInst, 
        sipLibrary.api.client.getDefaultErrorLogger({ 
            idString,
            "log": console.log.bind(console)
        })
    );

    backendSocketInst.evtConnect.attachOnce(() =>
        evtNewBackendConnection.post(backendSocketInst)
    );

    currentBackendSocketInst = backendSocketInst;

}

export function get(): sipLibrary.Socket | Promise<sipLibrary.Socket> {

    if (
        !currentBackendSocketInst ||
        currentBackendSocketInst.evtClose.postCount ||
        !currentBackendSocketInst.evtConnect.postCount
    ) {

        return new Promise<sipLibrary.Socket>(
            resolve => evtNewBackendConnection.attachOnce(
                () => resolve(currentBackendSocketInst)
            )
        );

    } else {

        return currentBackendSocketInst;

    }

}

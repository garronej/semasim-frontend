
import * as sip from "ts-sip";
import { SyncEvent } from "ts-events-extended";
import * as localApiHandlers from "./localApiHandlers";
import * as remoteApiCaller from "./remoteApiCaller";
import * as types from "../types/userSim";
import * as bootbox_custom from "../../tools/bootbox_custom";
import { baseDomain, isDevEnv  } from "../env";
import * as cookies from "../cookies/logic/frontend";

export const url = `wss://web.${baseDomain}`;

const idString = "toBackend";

//const log= isDevEnv ? console.log.bind(console) : (() => { });
const log = console.log.bind(console); isDevEnv;

const apiServer = new sip.api.Server(
    localApiHandlers.handlers,
    sip.api.Server.getDefaultLogger({
        idString,
        log,
        "hideKeepAlive": true
    })
);

let socketCurrent: sip.Socket | undefined = undefined;

let userSims: types.UserSim.Usable[] | undefined = undefined;

export const evtConnect = new SyncEvent<sip.Socket>();

/** 
 * - Multiple auxiliary connection can be established at the same time.
 * - On the contrary only one main connection can be active at the same time for a given user account )
 * - Auxiliary connections does not receive most of the events defined in localApiHandler.
 *   But will receive notifyIceServer ( if requestTurnCred === true ).
 * - Auxiliary connections will not receive phonebook entries 
 * ( userSims will appear as if they had no contacts stored )
 * 
 * Called from outside isReconnect should never be passed.
 *  */
export function connect(
    connectionParams: cookies.WebsocketConnectionParams,
    isReconnect?: undefined | "RECONNECT"
) {

    //We register 'offline' event only on the first call of connect()
    if (socketCurrent === undefined) {

        window.addEventListener("offline", () => {

            const socket = get();

            if (socket instanceof Promise) {
                return;
            }

            socket.destroy("Browser is offline");

        });

    }

    const removeCookie= cookies.WebsocketConnectionParams.set(connectionParams);

    const socket = new sip.Socket(
        new WebSocket(url, "SIP"),
        true,
        {
            "remoteAddress": `web.${baseDomain}`,
            "remotePort": 443
        },
        20000
    );

    apiServer.startListening(socket);

    sip.api.client.enableKeepAlive(socket, 6 * 1000);

    sip.api.client.enableErrorLogging(
        socket,
        sip.api.client.getDefaultErrorLogger({
            idString,
            "log": console.log.bind(console)
        })
    );

    socket.enableLogger({
        "socketId": idString,
        "remoteEndId": "BACKEND",
        "localEndId": "FRONTEND",
        "connection": true,
        "error": true,
        "close": true,
        "incomingTraffic": false,
        "outgoingTraffic": true,
        "ignoreApiTraffic": true
    }, log);

    socketCurrent = socket;

    socket.evtConnect.attachOnce(() => {

        log(`Socket ${!!isReconnect ? "re-" : ""}connected`);

        removeCookie();

        if (!!isReconnect) {

            bootbox_custom.dismissLoading();

        }

        const includeContacts = connectionParams.connectionType === "MAIN";

        if (userSims === undefined) {

            remoteApiCaller.getUsableUserSims(includeContacts)
                .then(userSims_ => userSims = userSims_);

        } else {

            remoteApiCaller.getUsableUserSims(includeContacts, "STATELESS")
                .then(userSims_ => {

                    for (const userSim_ of userSims_) {

                        const userSim = userSims!
                            .find(({ sim }) => sim.imsi === userSim_.sim.imsi);

                        /*
                        By testing if digests are the same we cover 99% of the case
                        when the sim could have been modified while offline...good enough.
                        */
                        if (
                            !userSim ||
                            userSim.sim.storage.digest !== userSim_.sim.storage.digest
                        ) {

                            location.reload();

                            return;

                        }

                        /*
                        If userSim is online we received a notification before having the 
                        response of the request... even possible?
                         */
                        if (userSim.isOnline) {
                            continue;
                        }

                        userSim.isOnline = userSim_.isOnline;

                        userSim.password = userSim_.password;

                        userSim.dongle = userSim_.dongle;

                        userSim.gatewayLocation = userSim_.gatewayLocation;

                        if (userSim.isOnline) {

                            localApiHandlers.evtSimIsOnlineStatusChange.post(userSim);

                        }


                    }


                });


        }

        evtConnect.post(socket)

    });

    socket.evtClose.attachOnce(async () => {

        log("Socket disconnected");

        for (const userSim of userSims || []) {

            userSim.isOnline = false;

            localApiHandlers.evtSimIsOnlineStatusChange.post(userSim);

        }

        if (localApiHandlers.evtOpenElsewhere.postCount !== 0) {
            return;
        }

        if (socket.evtConnect.postCount === 1) {

            bootbox_custom.loading("Reconnecting...");

        }

        while (!navigator.onLine) {

            await new Promise(resolve => setTimeout(resolve, 1000));

        }

        connect(connectionParams, "RECONNECT");

    });


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


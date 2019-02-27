
import * as sip from "ts-sip";
import { SyncEvent } from "ts-events-extended";
import * as localApiHandlers from "./localApiHandlers";
import * as remoteApiCaller from "./remoteApiCaller";
import * as types from "../types";
import * as bootbox_custom from "../tools/bootbox_custom";
import * as Cookies from "js-cookie";

/** semasim.com or dev.semasim.com */
export const baseDomain = window.location.href.match(/^https:\/\/web\.([^\/]+)/)![1];

export const url = `wss://web.${baseDomain}`;

const idString = "toBackend";

const apiServer = new sip.api.Server(
    localApiHandlers.handlers,
    sip.api.Server.getDefaultLogger({
        idString,
        "log": baseDomain.substring(0, 3) === "dev" ?
            console.log.bind(console) : (() => { }),
        "hideKeepAlive": true
    })
);

let socketCurrent: sip.Socket | undefined = undefined;

let userSims: types.UserSim.Usable[] | undefined = undefined;

//TODO: No need to export it.
export const evtConnect = new SyncEvent<sip.Socket>();

export function connect(
    requestTurnCred?: "REQUEST TURN CRED" | undefined,
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

    Cookies.set("requestTurnCred", `${!!requestTurnCred}`);

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
        "outgoingTraffic": false,
        "ignoreApiTraffic": true
    }, console.log.bind(console));

    socketCurrent = socket;

    socket.evtConnect.attachOnce(() => {

        if (!!isReconnect) {

            bootbox_custom.dismissLoading();

        }

        if (userSims === undefined) {

            remoteApiCaller.getUsableUserSims().then(userSims_ => userSims = userSims_);

        } else {

            remoteApiCaller.getUsableUserSims("STATELESS").then(userSims_ => {

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

        connect(requestTurnCred, "RECONNECT");

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

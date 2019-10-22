
import * as sip from "ts-sip";
import { SyncEvent } from "ts-events-extended";
import * as localApiHandlers from "./localApiHandlers";
import { WebsocketConnectionParams } from "../types/WebsocketConnectionParams";
import { dialogApi } from "../../tools/modal/dialog";
import * as urlGetParameters from "../../tools/urlGetParameters";
import { baseDomain, isDevEnv } from "../env";
import { AuthenticatedSessionDescriptorSharedData } from "../localStorage/AuthenticatedSessionDescriptorSharedData";
import * as env from "../env";
import { tryLoginFromStoredCredentials } from "../procedure/tryLoginFromStoredCredentials";
import { evtOpenElsewhere } from "./events";
import { restartApp } from "../restartApp";

export const url = `wss://web.${baseDomain}`;

const idString = "toBackend";


isDevEnv;
/*
const log: typeof console.log = isDevEnv ?
    ((...args) => console.log.apply(console, ["[toBackend/connection]", ...args])) :
    (() => { });
    */

const log: typeof console.log = true ?
    ((...args) => console.log.apply(console, ["[toBackend/connection]", ...args])) :
    (() => { });





export namespace notConnectedUserFeedback {

    export type State = { isVisible: true, message: string } | { isVisible: false };

    let setVisibilityWithMessage: (state: State) => void;

    export function setVisibility(isVisible: boolean) {

        const state: State = isVisible ?
            ({ isVisible, "message": "Connecting to Semasim..." }) :
            ({ isVisible })
            ;

        setVisibilityWithMessage(state);

    }

    /** NOTE: To call from react-native project */
    export function provideCustomImplementation(
        setVisibilityWithMessageImpl: typeof setVisibilityWithMessage
    ) {
        setVisibilityWithMessage = setVisibilityWithMessageImpl;
    }

}

notConnectedUserFeedback.provideCustomImplementation(state => {

    if (state.isVisible) {

        dialogApi.loading(state.message, 1200);

    } else {


        dialogApi.dismissLoading();

    }

});

const apiServer = new sip.api.Server(
    localApiHandlers.handlers,
    sip.api.Server.getDefaultLogger({
        idString,
        log,
        "hideKeepAlive": true
    })
);


/** getPrLoggedIn is called when the user
 * is no longer logged in, it should return a Promise
 * that resolve when the user is logged back in
 * if not provided and if in browser the page will be reloaded
 * else error will be thrown.
 */
export const connect = (() => {

    let hasBeenInvoked = false;

    return (
        requestTurnCred: WebsocketConnectionParams["requestTurnCred"],
        getPrLoggedIn: (() => Promise<void>) | undefined
    ) => {

        if (hasBeenInvoked) {
            return;
        }

        hasBeenInvoked = true;

        //We register 'offline' event only on the first call of connect()
        //TODO: React native.
        if (env.jsRuntimeEnv === "browser") {

            window.addEventListener("offline", () => {

                const socket = get();

                if (socket instanceof Promise) {
                    return;
                }

                socket.destroy("Browser is offline");

            });

        }

        //connectRecursive(requestTurnCred, getPrLoggedIn, false);
        connectRecursive(requestTurnCred, getPrLoggedIn);

    };

})();

export const evtConnect = new SyncEvent<sip.Socket>();

let socketCurrent: sip.Socket | undefined = undefined;



async function connectRecursive(
    requestTurnCred: WebsocketConnectionParams["requestTurnCred"],
    getPrLoggedIn: (() => Promise<void>) | undefined,
    //isReconnect: boolean
) {


    notConnectedUserFeedback.setVisibility(true);


    {

        const result = await tryLoginFromStoredCredentials();

        if (result === "NO VALID CREDENTIALS") {

            if (!!getPrLoggedIn) {

                notConnectedUserFeedback.setVisibility(false);

                await getPrLoggedIn();

                notConnectedUserFeedback.setVisibility(true);


            } else {

                if (env.jsRuntimeEnv === "react-native") {
                    throw new Error("never: getPreLoggedIn is not optional for react native");
                }

                restartApp();
                return;


            }


        }

    }

    let webSocket: WebSocket;

    try {

        webSocket = new WebSocket(
            urlGetParameters.buildUrl<WebsocketConnectionParams>(
                url,
                {
                    "connect_sid": (await AuthenticatedSessionDescriptorSharedData.get()).connect_sid,
                    requestTurnCred
                }
            ), "SIP"
        );

    } catch (error) {

        log("WebSocket construction error: " + error.message);

        //connectRecursive(requestTurnCred, getPrLoggedIn, isReconnect);
        connectRecursive(requestTurnCred, getPrLoggedIn);

        return;

    }

    const socket = new sip.Socket(
        webSocket,
        true,
        {
            "remoteAddress": `web.${baseDomain}`,
            "remotePort": 443
        },
        20000
    );


    apiServer.startListening(socket);

    sip.api.client.enableKeepAlive(socket, 25 * 1000);

    sip.api.client.enableErrorLogging(
        socket,
        sip.api.client.getDefaultErrorLogger({
            idString,
            log
        })
    );

    socket.enableLogger({
        "socketId": idString,
        "remoteEndId": "BACKEND",
        "localEndId": "FRONTEND",
        "connection": true,
        "error": true,
        "close": true,
        "incomingTraffic": true,
        "outgoingTraffic": true,
        "ignoreApiTraffic": true
    }, log);

    socketCurrent = socket;

    socket.evtConnect.attachOnce(() => {

        log(`Socket (re-)connected`);

        notConnectedUserFeedback.setVisibility(false);


        evtConnect.post(socket)

    });

    socket.evtClose.attachOnce(async () => {

        if (evtOpenElsewhere.postCount !== 0) {
            return;
        }

        connectRecursive(requestTurnCred, getPrLoggedIn);

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


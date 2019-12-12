
import * as sip from "ts-sip";
import { SyncEvent } from "ts-events-extended";
import * as localApiHandlers from "./localApiHandlers";
import { WebsocketConnectionParams } from "../types/WebsocketConnectionParams";
import { dialogApi } from "../../tools/modal/dialog";
import * as urlGetParameters from "../../tools/urlGetParameters";
import { env } from "../env";
import { AuthenticatedSessionDescriptorSharedData } from "../localStorage/AuthenticatedSessionDescriptorSharedData";
import { tryLoginFromStoredCredentials } from "../tryLoginFromStoredCredentials";
import { appEvts } from "./appEvts";
import { restartApp } from "../restartApp";
import * as networkStateMonitoring from "../networkStateMonitoring";

export const url = `wss://web.${env.baseDomain}`;

const idString = "toBackend";


env.isDevEnv;
/*
const log: typeof console.log = env.isDevEnv ?
    ((...args) => console.log.apply(console, ["[toBackend/connection]", ...args])) :
    (() => { });
    */

const log: typeof console.log = true ?
    ((...args) => console.log.apply(console, ["[toBackend/connection]", ...args])) :
    (() => { });


namespace notConnectedUserFeedback {

    export type State = { isVisible: true, message: string } | { isVisible: false };


    let setVisibilityWithMessage: (state: State) => void;

    export function setVisibility(isVisible: boolean) {

        const state: State = isVisible ?
            ({ isVisible, "message": "Connecting..." }) :
            ({ isVisible })
            ;

        setVisibilityWithMessage(state);

    }

    export function provideCustomImplementation(
        setVisibilityWithMessageImpl: typeof setVisibilityWithMessage
    ) {
        setVisibilityWithMessage = setVisibilityWithMessageImpl;
    }

}


const apiServer = new sip.api.Server(
    localApiHandlers.handlers,
    sip.api.Server.getDefaultLogger({
        idString,
        log,
        "hideKeepAlive": true
    })
);

export type ConnectParams = ConnectParams.Browser | ConnectParams.ReactNative;

export namespace ConnectParams {

    export type _Common = {
        requestTurnCred: boolean;
    };

    export type Browser = _Common & {
        assertJsRuntimeEnv: "browser";
    };

    export type ReactNative = _Common & {
        assertJsRuntimeEnv: "react-native";
        notConnectedUserFeedback: (state: notConnectedUserFeedback.State) => void;
    };


}


/** login is called when the user
 * is no longer logged in, it should return a Promise
 * that resolve when the user is logged back in
 * if not provided and if in browser the page will be reloaded
 * else error will be thrown.
 */
export const connect = (() => {

    let hasBeenInvoked = false;

    return function connect(params: ConnectParams) {

        if (hasBeenInvoked) {
            throw new Error("Should be invoked only once");
        }

        hasBeenInvoked = true;

        if (params.assertJsRuntimeEnv !== env.jsRuntimeEnv) {
            throw new Error("Wrong params for js runtime environnement");
        }

        notConnectedUserFeedback.provideCustomImplementation(
            params.assertJsRuntimeEnv === "react-native" ?
                params.notConnectedUserFeedback :
                (state => {

                    if (state.isVisible) {

                        dialogApi.loading(state.message, 1200);

                    } else {

                        dialogApi.dismissLoading();

                    }

                })
        );


        //TODO: See if of any use
        networkStateMonitoring.getApi().then(api =>
            api.evtStateChange.attach(
                () => !api.getIsOnline(),
                () => {

                    const socket = get();

                    if (socket instanceof Promise) {
                        return;
                    }

                    socket.destroy("Internet connection lost");

                }
            )
        );

        AuthenticatedSessionDescriptorSharedData.evtChange.attach(
            authenticatedSessionDescriptorSharedData => !authenticatedSessionDescriptorSharedData,
            () => {

                const socket = get();

                if (socket instanceof Promise) {
                    return;
                }

                socket.destroy("User no longer authenticated");

            }
        );

        connectRecursive(params.requestTurnCred ? "REQUEST TURN CRED" : "DO NOT REQUEST TURN CRED");

    };

})();

export const evtConnect = new SyncEvent<sip.Socket>();

let socketCurrent: sip.Socket | undefined = undefined;

/** Assert user logged in, will restart app as soon as user is detected as no longer logged in */
async function connectRecursive(
    requestTurnCred: WebsocketConnectionParams["requestTurnCred"]
) {

    notConnectedUserFeedback.setVisibility(true);

    const loginAttemptResult = await tryLoginFromStoredCredentials();

    if (loginAttemptResult !== "LOGGED IN") {

        restartApp("User is no longer logged in");

        return;

    }


    const { connect_sid } = await AuthenticatedSessionDescriptorSharedData.get();

    let webSocket: WebSocket;

    try {

        webSocket = new WebSocket(
            urlGetParameters.buildUrl<WebsocketConnectionParams>(
                url,
                {
                    connect_sid,
                    requestTurnCred
                }
            ), "SIP"
        );

    } catch (error) {

        log("WebSocket construction error: " + error.message);

        connectRecursive(requestTurnCred);

        return;

    }

    const socket = new sip.Socket(
        webSocket,
        true,
        {
            "remoteAddress": `web.${env.baseDomain}`,
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

        evtConnect.post(socket);


    });

    socket.evtClose.attachOnce(async () => {

        if (appEvts.evtOpenElsewhere.postCount !== 0) {
            return;
        }

        connectRecursive(requestTurnCred);

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


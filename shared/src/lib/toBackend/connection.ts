
import * as sip from "ts-sip";
import { Evt } from "evt";
import * as localApiHandlers from "./localApiHandlers";
import * as urlGetParameters from "../../tools/urlGetParameters";
import { env } from "../env";
import { assert } from "../../tools/typeSafety/assert";
import { id } from "../../tools/typeSafety/id";
import * as types from "../types";

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


export type ConnectionApi = {
    url: string;
    getSocket: () => sip.Socket | Promise<sip.Socket>;
    evtConnect: Evt<sip.Socket>;
    remoteNotifyEvts: types.RemoteNotifyEvts;
};

export type Params = {
    requestTurnCred: boolean;
    restartApp: import("../restartApp").RestartApp;
    notConnectedUserFeedback: (state: { isVisible: true, message: string } | { isVisible: false }) => void;
    networkStateMonitoringApi: import("../networkStateMonitoring").NetworkStateMonitoring;
    AuthenticatedSessionDescriptorSharedData: typeof import("../localStorage/AuthenticatedSessionDescriptorSharedData").AuthenticatedSessionDescriptorSharedData;
    tryLoginWithStoredCredentialIfNotAlreadyLogedIn: import("../tryLoginWithStoredCredentialIfNotAlreadyLogedInFactory").TryLoginWithStoredCredentialIfNotAlreadyLogedIn
};

/** login is called when the user
 * is no longer logged in, it should return a Promise
 * that resolve when the user is logged back in
 * if not provided and if in browser the page will be reloaded
 * else error will be thrown.
 */
export function connectAndGetApi(params: Params): ConnectionApi {

    assert(
        !connectAndGetApi.hasBeenInvoked,
        "Should be invoked only once"
    );

    connectAndGetApi.hasBeenInvoked = true;

    const url = `wss://web.${env.baseDomain}`;

    const { evtConnect, getSocket, setSocketCurrent } = (() => {

        let socketCurrent: sip.Socket | undefined = undefined;
        const evtConnect = new Evt<sip.Socket>();

        return {
            evtConnect,
            "setSocketCurrent": (socket: sip.Socket) => {
                socketCurrent = socket;
                socket.evtConnect.attachOnce(() => evtConnect.post(socket));
            },
            "getSocket": () => (
                !socketCurrent ||
                socketCurrent.evtClose.postCount !== 0 ||
                !socketCurrent.evtConnect.postCount
            ) ? evtConnect.waitFor() : socketCurrent
        };

    })();

    const { AuthenticatedSessionDescriptorSharedData } = params;

    const { remoteNotifyEvts, handlers } = localApiHandlers.getHandlers();

    {

        const setNotConnectUserFeedbackVisibility = (isVisible: boolean) => params.notConnectedUserFeedback(
            isVisible ?
                ({ isVisible, "message": "Connecting..." }) :
                ({ isVisible })
        );

        const requestTurnCred = params.requestTurnCred ? "REQUEST TURN CRED" : "DO NOT REQUEST TURN CRED";

        const getShouldReconnect = () => remoteNotifyEvts.evtOpenElsewhere.postCount === 0;

        const apiServer = new sip.api.Server(
            handlers,
            sip.api.Server.getDefaultLogger({
                idString,
                log,
                "hideKeepAlive": true
            })
        );

        const { restartApp, tryLoginWithStoredCredentialIfNotAlreadyLogedIn } = params;

        (async function connectRecursive() {

            setNotConnectUserFeedbackVisibility(true);

            const loginAttemptResult = await tryLoginWithStoredCredentialIfNotAlreadyLogedIn();

            if (loginAttemptResult !== "LOGGED IN") {

                restartApp("User is no longer logged in");

                return;

            }


            const { connect_sid } = await AuthenticatedSessionDescriptorSharedData.get();

            let webSocket: WebSocket;

            try {

                webSocket = new WebSocket(
                    urlGetParameters.buildUrl<types.WebsocketConnectionParams>(
                        url,
                        {
                            connect_sid,
                            requestTurnCred
                        }
                    ), "SIP"
                );

            } catch (error) {

                log("WebSocket construction error: " + error.message);

                connectRecursive();

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
                "incomingTraffic": false,
                "outgoingTraffic": false,
                "ignoreApiTraffic": true
            }, log);

            setSocketCurrent(socket);

            socket.evtConnect.attachOnce(() => {

                log(`Socket (re-)connected`);

                setNotConnectUserFeedbackVisibility(false);

            });

            socket.evtClose.attachOnce(async () => {

                if (!getShouldReconnect()) {
                    return;
                }

                connectRecursive();

            });

        })();

    }

    {

        const api = params.networkStateMonitoringApi;

        //TODO: See if of any use
        api.evtStateChange.attach(
            () => !api.getIsOnline(),
            () => {

                const socket = getSocket();

                if (socket instanceof Promise) {
                    return;
                }

                socket.destroy("Internet connection lost");

            }
        )

    }

    AuthenticatedSessionDescriptorSharedData.evtChange.attach(
        authenticatedSessionDescriptorSharedData => !authenticatedSessionDescriptorSharedData,
        () => {

            const socket = getSocket();

            if (socket instanceof Promise) {
                return;
            }

            socket.destroy("User no longer authenticated");

        }
    );

    return id<ConnectionApi>({
        url,
        remoteNotifyEvts,
        evtConnect,
        getSocket
    });

}


connectAndGetApi.hasBeenInvoked = false;

/*
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
*/


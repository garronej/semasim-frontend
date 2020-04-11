import * as sip from "ts-sip";
import { Evt } from "evt";
import * as types from "../types";
export declare type ConnectionApi = {
    url: string;
    getSocket: () => sip.Socket | Promise<sip.Socket>;
    evtConnect: Evt<sip.Socket>;
    remoteNotifyEvts: types.RemoteNotifyEvts;
};
export declare type Params = {
    requestTurnCred: boolean;
    restartApp: import("../restartApp").RestartApp;
    notConnectedUserFeedback: (state: {
        isVisible: true;
        message: string;
    } | {
        isVisible: false;
    }) => void;
    networkStateMonitoringApi: import("../networkStateMonitoring").NetworkStateMonitoring;
    AuthenticatedSessionDescriptorSharedData: typeof import("../localStorage/AuthenticatedSessionDescriptorSharedData").AuthenticatedSessionDescriptorSharedData;
    tryLoginWithStoredCredentialIfNotAlreadyLogedIn: import("../tryLoginWithStoredCredentialIfNotAlreadyLogedInFactory").TryLoginWithStoredCredentialIfNotAlreadyLogedIn;
};
/** login is called when the user
 * is no longer logged in, it should return a Promise
 * that resolve when the user is logged back in
 * if not provided and if in browser the page will be reloaded
 * else error will be thrown.
 */
export declare function connectAndGetApi(params: Params): ConnectionApi;
export declare namespace connectAndGetApi {
    var hasBeenInvoked: boolean;
}

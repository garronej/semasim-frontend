import * as remoteApiCaller from "../toBackend/remoteApiCaller";
import * as connection from "../toBackend/connection";
import { registerInteractiveRemoteNotifyEvtHandlers } from "../registerInteractiveRemoteNotifyEvtHandlers";
import * as types from "../types/UserSim";
import { assert } from "../../tools/typeSafety/assert";
import { env } from "../env";
import { VoidDeferred } from "../../tools/Deferred";
import { NonPostableEvts } from "../../tools/NonPostableEvts";

export namespace minimalLaunch {

    export type Params = Params.Browser | Params.ReactNative;

    export namespace Params {

        export type Common_ = {
            restartApp: import("../restartApp").RestartApp;
            dialogApi: import("../../tools/modal/dialog").DialogApi,
            startMultiDialogProcess: typeof import("../../tools/modal/dialog").startMultiDialogProcess;
            networkStateMonitoringApi: import("../networkStateMonitoring").NetworkStateMonitoring;
            tryLoginWithStoredCredentialIfNotAlreadyLogedIn: import("../tryLoginWithStoredCredentialIfNotAlreadyLogedInFactory").TryLoginWithStoredCredentialIfNotAlreadyLogedIn;
            AuthenticatedSessionDescriptorSharedData: typeof import("../localStorage/AuthenticatedSessionDescriptorSharedData").AuthenticatedSessionDescriptorSharedData;
            requestTurnCred: boolean;
        };

        export type Browser = Common_ & {
            assertJsRuntimeEnv: "browser";
        };


        export type ReactNative = Common_ & {
            assertJsRuntimeEnv: "react-native";
            notConnectedUserFeedback: connection.Params["notConnectedUserFeedback"];
        };


    }

}


/** Assert user logged in ( AuthenticatedSessionDescriptorSharedData.isPresent ) */
export async function minimalLaunch(
    params: minimalLaunch.Params
): Promise<{
    getWdApiFactory: ReturnType<typeof remoteApiCaller.factory>["getWdApiFactory"];
    connectionApi: connection.ConnectionApi,
    coreApi: Omit<remoteApiCaller.CoreApi, "getUserSims">;
    readyToDisplayUnsolicitedDialogs(): void;
    userSims: types.UserSim[];
    userSimEvts: NonPostableEvts<types.UserSim.Evts>;
}> {

    const {
        restartApp,
        dialogApi,
        startMultiDialogProcess,
        networkStateMonitoringApi,
        tryLoginWithStoredCredentialIfNotAlreadyLogedIn,
        AuthenticatedSessionDescriptorSharedData,
        requestTurnCred
    } = params;


    assert(
        params.assertJsRuntimeEnv === env.jsRuntimeEnv,
        "Wrong params for js runtime environnement"
    );

    assert(await AuthenticatedSessionDescriptorSharedData.isPresent());

    const connectionApi = connection.connectAndGetApi({
        requestTurnCred,
        restartApp,
        "notConnectedUserFeedback": params.assertJsRuntimeEnv === "react-native" ?
            params.notConnectedUserFeedback :
            (state => {

                //TODO: Maybe restart app here because some unpredictable bug can appear.

                if (state.isVisible) {

                    dialogApi.loading(state.message, 1200);

                } else {

                    dialogApi.dismissLoading();

                }

            }),
        networkStateMonitoringApi,
        AuthenticatedSessionDescriptorSharedData,
        tryLoginWithStoredCredentialIfNotAlreadyLogedIn
    });

    const { getCoreApi, getWdApiFactory } = remoteApiCaller.factory({
        connectionApi,
        restartApp
    });

    const coreApi = getCoreApi({
        "userEmail": (await AuthenticatedSessionDescriptorSharedData.get()).email
    });

    const { userSims, userSimEvts } = await coreApi.getUserSims({ "includeContacts": true });

    const dReadyToDisplayUnsolicitedDialogs= new VoidDeferred();

    registerInteractiveRemoteNotifyEvtHandlers({
        "getUsableSimFriendlyNames": () => userSims
            .filter(types.UserSim.Usable.match)
            .map(({ friendlyName }) => friendlyName),
        "sharedNotConfirmedUserSims": userSims
            .filter(types.UserSim.Shared.NotConfirmed.match),
        userSimEvts,
        "prReadyToDisplayUnsolicitedDialogs": dReadyToDisplayUnsolicitedDialogs.pr,
        "remoteNotifyEvts": connectionApi.remoteNotifyEvts,
        coreApi,
        dialogApi,
        startMultiDialogProcess,
        restartApp
    });

    return {
        getWdApiFactory,
        connectionApi,
        coreApi,
        "readyToDisplayUnsolicitedDialogs": dReadyToDisplayUnsolicitedDialogs.resolve,
        userSims,
        userSimEvts
    };


}

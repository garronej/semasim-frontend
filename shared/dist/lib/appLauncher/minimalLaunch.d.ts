import * as remoteApiCaller from "../toBackend/remoteApiCaller";
import * as connection from "../toBackend/connection";
import * as types from "../types/UserSim";
import type { TryLoginWithStoredCredentialIfNotAlreadyLogedIn } from "../tryLoginWithStoredCredentialIfNotAlreadyLogedInFactory";
import type { AuthenticatedSessionDescriptorSharedData } from "../localStorage/AuthenticatedSessionDescriptorSharedData";
import type { RestartApp } from "../restartApp";
import type { DialogApi, startMultiDialogProcess } from "../../tools/modal/dialog";
import type { NetworkStateMonitoring } from "../networkStateMonitoring";
export declare namespace minimalLaunch {
    type Params = Params.Browser | Params.ReactNative;
    namespace Params {
        type Common_ = {
            restartApp: RestartApp;
            dialogApi: DialogApi;
            startMultiDialogProcess: typeof startMultiDialogProcess;
            networkStateMonitoringApi: NetworkStateMonitoring;
            tryLoginWithStoredCredentialIfNotAlreadyLogedIn: TryLoginWithStoredCredentialIfNotAlreadyLogedIn;
            AuthenticatedSessionDescriptorSharedData: typeof AuthenticatedSessionDescriptorSharedData;
            requestTurnCred: boolean;
        };
        type Browser = Common_ & {
            assertJsRuntimeEnv: "browser";
        };
        type ReactNative = Common_ & {
            assertJsRuntimeEnv: "react-native";
            notConnectedUserFeedback: connection.Params["notConnectedUserFeedback"];
        };
    }
}
/** Assert user logged in ( AuthenticatedSessionDescriptorSharedData.isPresent ) */
export declare function minimalLaunch(params: minimalLaunch.Params): Promise<{
    getWdApiFactory: ReturnType<typeof remoteApiCaller.factory>["getWdApiFactory"];
    connectionApi: connection.ConnectionApi;
    coreApi: Omit<remoteApiCaller.CoreApi, "getUserSims">;
    readyToDisplayUnsolicitedDialogs(): void;
    userSims: types.UserSim[];
    userSimEvts: types.UserSim.Evts;
}>;

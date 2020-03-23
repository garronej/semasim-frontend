import * as remoteApiCaller from "../toBackend/remoteApiCaller";
import * as connection from "../toBackend/connection";
import * as types from "../types/UserSim";
import { NonPostableEvts } from "../../tools/NonPostableEvts";
export declare namespace minimalLaunch {
    type Params = Params.Browser | Params.ReactNative;
    namespace Params {
        type Common_ = {
            restartApp: import("../restartApp").RestartApp;
            dialogApi: import("../../tools/modal/dialog").DialogApi;
            startMultiDialogProcess: typeof import("../../tools/modal/dialog").startMultiDialogProcess;
            networkStateMonitoringApi: import("../networkStateMonitoring").NetworkStateMonitoring;
            tryLoginWithStoredCredentialIfNotAlreadyLogedIn: import("../tryLoginWithStoredCredentialIfNotAlreadyLogedInFactory").TryLoginWithStoredCredentialIfNotAlreadyLogedIn;
            AuthenticatedSessionDescriptorSharedData: typeof import("../localStorage/AuthenticatedSessionDescriptorSharedData").AuthenticatedSessionDescriptorSharedData;
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
    userSimEvts: NonPostableEvts<types.UserSim.Evts>;
}>;

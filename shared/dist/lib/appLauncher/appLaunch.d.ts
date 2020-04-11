import { restartApp } from "../restartApp";
import { baseTypes as dialogBaseTypes, dialogApi, startMultiDialogProcess } from "../../tools/modal/dialog";
import * as types from "../types";
import * as loginPageLogic from "../pageLogic/login";
import * as registerPageLogic from "../pageLogic/register";
import { createModal } from "../../tools/modal";
import type { StatefulReadonlyEvt } from "evt";
export declare namespace appLaunch {
    type Params = Params.Browser | Params.ReactNative;
    namespace Params {
        type Browser = {
            assertJsRuntimeEnv: "browser";
        };
        type ReactNative = {
            assertJsRuntimeEnv: "react-native";
            notConnectedUserFeedback: import("../toBackend/connection").Params["notConnectedUserFeedback"];
            actionToPerformBeforeAppRestart: () => Promise<void>;
            dialogBaseApi: dialogBaseTypes.Api;
            prEvtPushNotificationToken: Promise<StatefulReadonlyEvt<string>>;
        };
    }
    type Out = {
        dialogApi: typeof dialogApi;
        startMultiDialogProcess: typeof startMultiDialogProcess;
        createModal: typeof createModal;
        restartApp: typeof restartApp;
        prAuthenticationStep: Promise<AuthenticationStep>;
    };
    type AuthenticationStep = AuthenticationStep.AuthenticationApi & {
        getAccountManagementApiAndWebphoneLauncher: GetAccountManagementApiAndWebphoneLauncher;
    };
    namespace AuthenticationStep {
        type AuthenticationApi = AuthenticationApi.NeedLogin | AuthenticationApi.DoNotNeedLogin;
        namespace AuthenticationApi {
            type NeedLogin = {
                needLogin: true;
                tryLoginWithStoredCredentialIfNotAlreadyLogedIn: import("../tryLoginWithStoredCredentialIfNotAlreadyLogedInFactory").TryLoginWithStoredCredentialIfNotAlreadyLogedIn;
                launchLogin: loginPageLogic.LaunchLogin;
                launchRegister: registerPageLogic.LaunchRegister;
            };
            type DoNotNeedLogin = {
                needLogin: false;
            };
        }
    }
    type GetAccountManagementApiAndWebphoneLauncher = (params: {
        prReadyToDisplayUnsolicitedDialogs: Promise<void>;
    }) => Promise<AccountManagementApiAndWebphoneLauncher>;
    type AccountManagementApiAndWebphoneLauncher = {
        accountManagementApi: types.AccountManagementApi;
        getWebphones(params: {
            phoneCallUiCreateFactory: types.PhoneCallUi.CreateFactory;
        }): Promise<types.Webphone[]>;
    };
}
export declare function appLaunch(params: appLaunch.Params): appLaunch.Out;
export declare namespace appLaunch {
    var hasBeedCalled: boolean;
}

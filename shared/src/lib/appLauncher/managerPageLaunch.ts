import { restartApp } from "../restartApp";
import { dialogApi, startMultiDialogProcess } from "../../tools/modal/dialog";
import * as networkStateMonitoring from "../networkStateMonitoring";
import { tryLoginWithStoredCredentialIfNotAlreadyLogedInFactory } from "../tryLoginWithStoredCredentialIfNotAlreadyLogedInFactory";
import { AuthenticatedSessionDescriptorSharedData } from "../localStorage/AuthenticatedSessionDescriptorSharedData";
import { getWebApi } from "../webApiCaller";
import { assert } from "../../tools/typeSafety/assert";
import { env } from "../env";
import { minimalLaunch } from "./minimalLaunch";
import { createModal } from "../../tools/modal";
import * as types from "../types";

export function managerPageLaunch(
    params: {
        assertJsRuntimeEnv: "browser"
    }
): {
    dialogApi: typeof dialogApi;
    startMultiDialogProcess: typeof startMultiDialogProcess;
	createModal: typeof createModal;
    prReadyToAuthenticateStep: Promise<{
        loginUser: import("../webApiCaller").WebApi["loginUser"];
        prAccountManagementApi: Promise<types.AccountManagementApi>;
    }>;
} {

    assert(params.assertJsRuntimeEnv === env.jsRuntimeEnv);

    return {
        dialogApi,
        startMultiDialogProcess,
        createModal,
        "prReadyToAuthenticateStep": (async () => {

            const networkStateMonitoringApi = await networkStateMonitoring.getApi();

            const webApi = (() => {

                const { getLoginLogoutApi, ...rest } = getWebApi({
                    AuthenticatedSessionDescriptorSharedData,
                    networkStateMonitoringApi,
                    restartApp
                });

                return {
                    ...rest,
                    ...getLoginLogoutApi({ "assertJsRuntimeEnv": params.assertJsRuntimeEnv })
                };

            })();

            const tryLoginWithStoredCredentialIfNotAlreadyLogedIn = tryLoginWithStoredCredentialIfNotAlreadyLogedInFactory({
                "assertJsRuntimeEnv": "browser",
                webApi
            });

            return {
                "loginUser": webApi.loginUser,
                "prAccountManagementApi": (async () => {

                    if (await tryLoginWithStoredCredentialIfNotAlreadyLogedIn() === "NO VALID CREDENTIALS") {

                        await AuthenticatedSessionDescriptorSharedData.evtChange
                            .waitFor(authenticatedSessionDescriptorSharedData =>
                                !!authenticatedSessionDescriptorSharedData
                            );

                    }

                    return onceLoggedIn({
                        networkStateMonitoringApi,
                        tryLoginWithStoredCredentialIfNotAlreadyLogedIn,
                        webApi
                    });

                })()

            };


        })()
    }



}

async function onceLoggedIn(
    params: {
        networkStateMonitoringApi: import("../networkStateMonitoring").NetworkStateMonitoring;
        tryLoginWithStoredCredentialIfNotAlreadyLogedIn: import("../tryLoginWithStoredCredentialIfNotAlreadyLogedInFactory").TryLoginWithStoredCredentialIfNotAlreadyLogedIn;
        webApi: types.AccountManagementApi["webApi"]
    }
): Promise<types.AccountManagementApi> {

    const { networkStateMonitoringApi, tryLoginWithStoredCredentialIfNotAlreadyLogedIn, webApi } = params;

    const { coreApi, readyToDisplayUnsolicitedDialogs, userSims, userSimEvts } = await minimalLaunch({
        "assertJsRuntimeEnv": "browser",
        restartApp,
        dialogApi, startMultiDialogProcess,
        networkStateMonitoringApi,
        tryLoginWithStoredCredentialIfNotAlreadyLogedIn,
        AuthenticatedSessionDescriptorSharedData,
        "requestTurnCred": false
    });

    readyToDisplayUnsolicitedDialogs();

    return {
        "email": (await AuthenticatedSessionDescriptorSharedData.get()).email,
        ...types.UserSim.Usable.Evts.build({ userSims, userSimEvts }),
        coreApi,
        webApi,
    };

}
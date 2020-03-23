
import * as loginPageLogic from "../pageLogic/login";
import { getWebApi } from "../webApiCaller";
import { AuthenticatedSessionDescriptorSharedData } from "../localStorage/AuthenticatedSessionDescriptorSharedData";
import * as networkStateMonitoring from "../networkStateMonitoring";
import { restartApp } from "../restartApp";
import { dialogApi } from "../../tools/modal/dialog";
import { TowardUserKeys } from "../localStorage/TowardUserKeys";
import { JustRegistered } from "../localStorage/JustRegistered";

export type Api = loginPageLogic.LaunchLogin.Api;

export async function loginPageLaunch(
    params: {
        assertJsRuntimeEnv: "browser";
    } & loginPageLogic.LaunchLogin.Params
): Promise<Api>{

	const networkStateMonitoringApi = await networkStateMonitoring.getApi();

	const webApi = (() => {

		const { getLoginLogoutApi, ...rest } = getWebApi({
			AuthenticatedSessionDescriptorSharedData,
			networkStateMonitoringApi,
			restartApp
		});

		return {
			...rest,
			...getLoginLogoutApi({
				"assertJsRuntimeEnv": params.assertJsRuntimeEnv,
			})
		};

    })();

    return loginPageLogic.factory({
        webApi,
        dialogApi,
        JustRegistered,
        TowardUserKeys
    })(params);

}
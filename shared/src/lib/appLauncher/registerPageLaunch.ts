
import * as registerPageLogic from "../pageLogic/register";
import { getWebApi } from "../webApiCaller";
import { AuthenticatedSessionDescriptorSharedData } from "../localStorage/AuthenticatedSessionDescriptorSharedData";
import * as networkStateMonitoring from "../networkStateMonitoring";
import { restartApp } from "../restartApp";
import { dialogApi } from "../../tools/modal/dialog";
import { JustRegistered } from "../localStorage/JustRegistered";

export type Api = registerPageLogic.LaunchRegister.Api;

export async function registerPageLaunch(
    params: {
        assertJsRuntimeEnv: "browser";
    } & registerPageLogic.LaunchRegister.Params
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

    return registerPageLogic.factory({
        webApi,
        dialogApi,
        JustRegistered
    })(params);

}

import { UiWebphoneController } from "./UiWebphoneController";
import * as webApiCaller from "frontend-shared/dist/lib/webApiCaller";
import { dialogApi } from "frontend-shared/dist/tools/modal/dialog";
import * as observer from "frontend-shared/dist/tools/observer";
import { appLauncher, Params as AppLauncherParams } from "frontend-shared/dist/lib/appLauncher";


import * as overrideWebRTCImplementation from "frontend-shared/dist/tools/overrideWebRTCImplementation";

overrideWebRTCImplementation.testOverrideWebRTCImplementation();

observer.observeWebRTC();

$(document).ready(async () => {

	$("#logout").click(() => webApiCaller.logoutUser());

	dialogApi.loading("Decrypting your chat history 🔐", 0);

	const webphones = await appLauncher((() => {

		const out: AppLauncherParams.Browser = {
			"assertJsRuntimeEnv": "browser"
		}

		return out;

	})()).then(({ prWebphones })=> prWebphones);

	dialogApi.dismissLoading();

	if (webphones.length === 0) {

		window.location.href = "/manager";

	}

	$("#page-payload").html("");

	for (const webphone of webphones) {

		$("#page-payload").append(
			(new UiWebphoneController(webphone))
				.structure
		);

	}

});

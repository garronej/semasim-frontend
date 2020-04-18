
import { uiWebphoneControllerDependencyInjection } from "./UiWebphoneController";
import { phoneCallUiCreateFactoryDependencyInjections } from "./phoneCallUiCreateFactory";
import { appLaunch } from "frontend-shared/dist/lib/appLauncher/appLaunch";
import { assert } from "frontend-shared/dist/tools/typeSafety/assert";
import * as availablePages from "frontend-shared/dist/lib/availablePages";
//import * as overrideWebRTCImplementation from "frontend-shared/dist/tools/overrideWebRTCImplementation";
//overrideWebRTCImplementation.testOverrideWebRTCImplementation();
//evterver.evterveWebRTC();
import { Deferred } from "frontend-shared/dist/tools/Deferred";


$(document).ready(async () => {

	const dLogoutUser = new Deferred<import("frontend-shared/dist/lib/types").AccountManagementApi["webApi"]["logoutUser"]>();

	$("#logout").click(() => dLogoutUser.pr.then(logoutUser => logoutUser()));

	const { dialogApi, createModal, prAuthenticationStep} = appLaunch({
		"assertJsRuntimeEnv": "browser"
	});

	dialogApi.loading("Decrypting your chat history 🔐", 0);
	
	const { needLogin, getAccountManagementApiAndWebphoneLauncher } = await prAuthenticationStep;

	assert(!needLogin);

	const { accountManagementApi, getWebphones } = await getAccountManagementApiAndWebphoneLauncher({
		"prReadyToDisplayUnsolicitedDialogs": Promise.resolve()
	});

	dLogoutUser.resolve(accountManagementApi.webApi.logoutUser);

	const webphones = await getWebphones({ 
		"phoneCallUiCreateFactory": phoneCallUiCreateFactoryDependencyInjections({ createModal })
	});

	dialogApi.dismissLoading();

	if (webphones.length === 0) {

		window.location.href = `/${availablePages.PageName.manager}`;

		return;

	}

	$("#page-payload").html("");

	const { UiWebphoneController }= uiWebphoneControllerDependencyInjection({ dialogApi });

	webphones.forEach(
		webphone => $("#page-payload")
			.append((new UiWebphoneController(webphone)).structure)
	);

});

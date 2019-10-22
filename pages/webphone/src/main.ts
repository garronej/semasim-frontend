
import { UiWebphoneController } from "./UiWebphoneController";
import * as connection from "frontend-shared/dist/lib/toBackend/connection";
import * as remoteApiCaller from "frontend-shared/dist/lib/toBackend/remoteApiCaller";
import * as webApiCaller from "frontend-shared/dist/lib/webApiCaller";
import { dialogApi } from "frontend-shared/dist/tools/modal/dialog";
import * as backendEvents from "frontend-shared/dist/lib/toBackend/events";

import * as types from "frontend-shared/dist/lib/types/userSim";
import * as wd from "frontend-shared/dist/lib/types/webphoneData/logic";
import { AuthenticatedSessionDescriptorSharedData } from "frontend-shared/dist/lib/localStorage/AuthenticatedSessionDescriptorSharedData";
import * as availablePages from "frontend-shared/dist/lib/availablePages";
import * as observer from "frontend-shared/dist/tools/observer";
import * as setupEncryptorDecryptors from "frontend-shared/dist/lib/crypto/setupEncryptorDecryptors";


import * as overrideWebRTCImplementation from "frontend-shared/dist/tools/overrideWebRTCImplementation";

overrideWebRTCImplementation.testOverrideWebRTCImplementation();

observer.observeWebRTC();

$(document).ready(async () => {

	$("#logout").click(async () => {

		await webApiCaller.logoutUser();

		location.href = `/${availablePages.PageName.login}`;

	});

	//TODO: Do this in every page that require the user to be logged in.
	if( !(await AuthenticatedSessionDescriptorSharedData.isPresent()) ){
		//NOTE: User have deleted local storage but still have cookie.
        $("#logout").trigger("click");
        return;

	}

	await setupEncryptorDecryptors.globalSetup();

	connection.connect("REQUEST TURN CRED", undefined);

	$("#page-payload").html("");

	dialogApi.loading("Decrypting your conversation history 🔐", 0);

	const userSims = await remoteApiCaller.getUsableUserSims();

	if (userSims.length === 0) {

		window.location.href = "/manager";

	}

	const wdInstances = await (async () => {

		const out = new Map<types.UserSim, wd.Instance<"PLAIN">>();

		await Promise.all(
			userSims.map(
				userSim => remoteApiCaller.getOrCreateWdInstance(userSim)
					.then(wdInstance => out.set(userSim, wdInstance))
			)
		);

		return out;

	})();


	//NOTE: Sort user sims so we always have the most relevant at the top of the page.
	userSims
		.sort((s1, s2) => {

			if (!!s1.reachableSimState !== !!s2.reachableSimState) {
				return !!s1.reachableSimState ? 1 : -1;
			}

			const [c1, c2] = [s1, s2].map(userSim =>
				wd.getChatWithLatestActivity(
					wdInstances.get(userSim)!
				)
			);

			if (!c1 !== !c2) {
				return !!c1 ? 1 : -1;
			}

			if (!c1) {
				return 0;
			}

			return wd.compareChat(c1, c2!);

		})
		.reverse()
		.forEach(userSim => $("#page-payload").append(
			(
				new UiWebphoneController(
					userSim,
					wdInstances.get(userSim)!
				)
			).structure
		));


	dialogApi.dismissLoading();

	backendEvents.evtSimPermissionLost.attachOnce(
		userSim => {

			dialogApi.create("alert", {
				"message": `${userSim.ownership.ownerEmail} revoked your access to ${userSim.friendlyName}`
			});

			//TODO: Improve
			location.reload();

		}
	);

	backendEvents.evtUsableSim.attach(
		async userSim => $("#page-payload").append(
			(
				new UiWebphoneController(
					userSim,
					await remoteApiCaller.getOrCreateWdInstance(
						userSim
					)
				)
			).structure
		)
	);

});


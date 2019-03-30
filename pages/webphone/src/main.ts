declare const require: (path: string) => any;
require("es6-map/implement");
require("es6-weak-map/implement");
require("array.prototype.find").shim();

import { Ua } from "../../../shared/dist/lib/Ua";
import { UiWebphoneController } from "./UiWebphoneController";
import * as connection from "../../../shared/dist/lib/toBackend/connection";
import * as remoteApiCaller from "../../../shared/dist/lib/toBackend/remoteApiCaller";
import * as webApiCaller from "../../../shared/dist/lib/webApiCaller";
import * as bootbox_custom from "../../../shared/dist/lib/tools/bootbox_custom";
import * as localApiHandlers from "../../../shared/dist/lib/toBackend/localApiHandlers";
import * as types from "../../../shared/dist/lib/types";

$(document).ready(async () => {

	$("#logout").click(async () => {

		await webApiCaller.logoutUser();

		window.location.href = "/login";

	});


	connection.connect({ "requestTurnCred": true });

	$("#page-payload").html("");

	bootbox_custom.loading("Fetching contacts and SMS history", 0);

	const userSims = await remoteApiCaller.getUsableUserSims();

	if (userSims.length === 0) {

		window.location.href = "/manager";

	}

	const wdInstances = new Map<types.UserSim, types.webphoneData.Instance>();

	await Promise.all([
		remoteApiCaller.getUaInstanceId()
			.then(({ uaInstanceId, email }) => Ua.setUaInstanceId(uaInstanceId, email)),
		...userSims.map(
			userSim => remoteApiCaller.getOrCreateWdInstance(userSim)
				.then(wdInstance => { wdInstances.set(userSim, wdInstance) })
		),
	]);

	//NOTE: Sort user sims so we always have the most relevant at the top of the page.
	userSims
		.sort((s1, s2) => {

			if (s1.isOnline !== s2.isOnline) {
				return s1.isOnline ? 1 : -1;
			}

			const [c1, c2] = [s1, s2].map(userSim =>
				types.webphoneData.getChatWithLatestActivity(
					wdInstances.get(userSim)!
				)
			);

			if (!c1 !== !c2) {
				return !!c1 ? 1 : -1;
			}

			if (!c1) {
				return 0;
			}

			return types.webphoneData.compareChat(c1, c2!);

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


	bootbox_custom.dismissLoading();

	localApiHandlers.evtSimPermissionLost.attachOnce(
		userSim => {

			bootbox_custom.alert(
				`${userSim.ownership.ownerEmail} revoked your access to ${userSim.friendlyName}`
			);

			//TODO: Improve
			location.reload();

		}
	);

	remoteApiCaller.evtUsableSim.attach(
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


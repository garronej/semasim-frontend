declare const require: (path: string) => any;
require("es6-map/implement");
require("es6-weak-map/implement");
require("array.prototype.find").shim();

import { Ua } from "./Ua";
import { UiWebphoneController } from "./UiWebphoneController";
import * as connection from "../../../shared/dist/lib/toBackend/connection";
import * as remoteApiCaller from "../../../shared/dist/lib/toBackend/remoteApiCaller";
import * as webApiCaller from "../../../shared/dist/lib/webApiCaller";
import * as bootbox_custom from "../../../shared/dist/lib/tools/bootbox_custom";
import * as localApiHandlers from "../../../shared/dist/lib/toBackend/localApiHandlers";

//TODO: implement evtUp

$(document).ready(async () => {

	$("#logout").click(async () => {

		await webApiCaller.logoutUser();

		window.location.href = "/login";

	});

	connection.connect();

	$("#page-payload").html("");

	bootbox_custom.loading("Fetching contacts and SMS history", 0);

	await Ua.init();

	const userSims = await remoteApiCaller.getUsableUserSims();

	if (userSims.length === 0) {

		window.location.href = "/manager";

	}

	const wdInstances = await Promise.all(
		userSims.map(
			userSim => remoteApiCaller.getOrCreateWdInstance(userSim)
		)
	);

	for (const userSim of userSims.sort((a, b) => +b.isOnline - +a.isOnline)) {

		$("#page-payload").append(
			(
				new UiWebphoneController(
					userSim,
					wdInstances.find(({ imsi }) => userSim.sim.imsi === imsi)!
				)
			).structure
		);

	}

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

	remoteApiCaller.evtUsableSim.attach(async userSim => {

		$("#page-payload").append(
			(
				new UiWebphoneController(
					userSim,
					await remoteApiCaller.getOrCreateWdInstance(
						userSim
					)
				)
			).structure
		);


	});

});

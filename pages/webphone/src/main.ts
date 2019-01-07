
import { Ua } from "./Ua";
import { UiWebphoneController } from "./UiWebphoneController";
import * as connection from "../../../shared/dist/lib/toBackend/connection";
import * as remoteApiCaller from "../../../shared/dist/lib/toBackend/remoteApiCaller";
import * as webApiCaller from "../../../shared/dist/lib/webApiCaller";
import * as bootbox_custom from "../../../shared/dist/lib/tools/bootbox_custom";
//import * as types from "../../../shared/dist/lib/types";

//TODO: implement evtUp

$(document).ready(async () => {

	$("#logout").click(async () => {

		await webApiCaller.logoutUser();

		window.location.href = "/login";

	});

	connection.connect();

	bootbox_custom.loading("Initialization...");

	await Ua.init();

	const userSims = await remoteApiCaller.getUsableUserSims();

	if (userSims.length === 0) {

		window.location.href = "/manager";

	}

	await Promise.all(
		userSims.map(userSim =>
			UiWebphoneController
				.create(userSim)
				.then(uiWebphoneController => ({ userSim, uiWebphoneController }))
		)
	).then(
		arr => arr.sort((a, b) => +b.userSim.isOnline - +a.userSim.isOnline)
		.forEach(({ uiWebphoneController }) =>
			$("#page-payload").append(uiWebphoneController.structure)
		)
	);

	bootbox_custom.dismissLoading();

	$("#footer").hide();

	remoteApiCaller.evtUsableSim.attach(async userSim => {

		const uiWebphoneController = await UiWebphoneController.create(userSim)

		$("#page-payload").append(uiWebphoneController.structure);

	});

});

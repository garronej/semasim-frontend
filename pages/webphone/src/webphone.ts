
import { Ua } from "./Ua";
import { UiWebphoneController } from "./UiWebphoneController";
import { launch as backendSocket_launch } from "../../../shared/dist/lib/backendClientSideSocket/launch";
import * as remoteApiCaller from "../../../shared/dist/lib/backendClientSideSocket/remoteApiCaller";
import * as webApiCaller from "../../../shared/dist/lib/webApiCaller";
import * as bootbox_custom from "../../../shared/dist/lib/tools/bootbox_custom";
import * as types from "../../../shared/dist/lib/types";

//TODO: implement evtUp

$(document).ready(async () => {

	$("#logout").click(async () => {

		await webApiCaller.logoutUser();

		window.location.href = "/login";

	});

	backendSocket_launch();

	bootbox_custom.loading("Initialization...");

	await Ua.init();

	const userSims = await remoteApiCaller.getUsableUserSims();

	if (userSims.length === 0) {

		window.location.href = "/manager";

	}

	const addWebphone = async (userSim: types.UserSim.Usable) => {

		const uiWebphoneController = await UiWebphoneController.create(userSim)

		$(".page-content-inner").append(uiWebphoneController.structure);

	};

	const tasks: Promise<void>[] = [];

	for (const userSim of userSims) {

		tasks[tasks.length] = addWebphone(userSim);

	}

	await Promise.all(tasks);

	bootbox_custom.dismissLoading();

	$("#footer").hide();

	remoteApiCaller.evtUsableSim.attach(userSim => addWebphone(userSim));



});

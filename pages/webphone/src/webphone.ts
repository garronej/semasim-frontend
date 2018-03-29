import { apiClient as api } from "../../../api";
import { simRegistrationProcess, validateSimShareProcess } from "../../../shared";
import * as tools from "../../../tools";

import { Ua } from "./Ua";


import * as d from "./data";
import { UiWebphoneController } from "./UiWebphoneController";

async function loadPageContent() {

	await simRegistrationProcess.start();

	let useableUserSims = await validateSimShareProcess.start();

	if (!useableUserSims.length) {

		window.location.href = "/manager";

		return;

	}

    tools.bootbox_custom.loading("Initialization...");

	let wdRoot= await d.io.fetch(useableUserSims);

	Ua.init(wdRoot.email, wdRoot.uaInstanceId);

	tools.bootbox_custom.dismissLoading();

	let userSim= useableUserSims.pop()!;


	let wdInstance= wdRoot.instances.find(({ imsi })=> imsi === userSim.sim.imsi )!;

	let uiWebphone= new UiWebphoneController(userSim, wdInstance);

	$(".page-content-inner").append(uiWebphone.structure);

	/*
	(()=>{

		let footer = $("#footer").detach();

		setTimeout(()=> footer.insertAfter($("#wrapper")), 0);

	})();
	*/

	$("#footer").hide();

}

$(document).ready(() => {

	$("#logout").click(async () => {

		await api.logoutUser();

		window.location.href = "/login";

	});

	loadPageContent();

});

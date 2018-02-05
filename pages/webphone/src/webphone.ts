import { apiClient as api } from "../../../api";
import { simRegistrationProcess, validateSimShareProcess } from "../../../shared";
import * as tools from "../../../tools";

import * as wds from "./webphoneDataSync";
import { UiWebphone } from "./UiWebphone";

async function loadPageContent() {

	await simRegistrationProcess.start();

	let useableUserSims = await validateSimShareProcess.start();

	if (!useableUserSims.length) {

		window.location.href = "/manager";

		return;

	}

    tools.bootbox_custom.loading("Initialization...");

	let wdRoot= await wds.fetch(useableUserSims);

	tools.bootbox_custom.dismissLoading();

	console.log(wdRoot);

	let userSim= useableUserSims.pop()!;

	let wdInstance= wdRoot.instances.find(({ imsi })=> imsi === userSim.sim.imsi )!;

	let uiWebphone= new UiWebphone(userSim, wdInstance);

	$(".page-content-inner").append(uiWebphone.structure);


	//TODO
	//let footer= $("#footer").detach();
	//footer.insertAfter($("#wrapper"));

	$("#footer").hide();

}

$(document).ready(() => {

	$("#logout").click(async () => {

		await api.logoutUser();

		window.location.href = "/login";

	});

	loadPageContent();

});

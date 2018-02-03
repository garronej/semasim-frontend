import { apiClient as api, types } from "../../../api";
import { simRegistrationProcess, validateSimShareProcess } from "../../../shared";

import * as wds from "./webphoneDataSync";
import { UiWebphone } from "./UiWebphone";

declare const require: (path: string) => any;
const bootbox: any = window["bootbox"];

async function loadPageContent() {

	await simRegistrationProcess.start();

	let useableUserSims = await validateSimShareProcess.start();

	if (!useableUserSims.length) {

		window.location.href = "/manager";

		return;

	}

	let wdRoot= await wds.fetch(useableUserSims);

	console.log(wdRoot);

	let userSim= useableUserSims.pop()!;

	let wdInstance= wdRoot.instances.find(({ imsi })=> imsi === userSim.sim.imsi )!;

	let uiWebphone= new UiWebphone(userSim, wdInstance);

	$(".page-content-inner").append(uiWebphone.structure);

}

$(document).ready(() => {

	$("#logout").click(async () => {

		await api.logoutUser();

		window.location.href = "/login";

	});

	loadPageContent();

});

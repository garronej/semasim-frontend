import { apiClient as api } from "../../../api";
import { simRegistrationProcess, validateSimShareProcess } from "../../../shared";
import * as tools from "../../../tools";

import { Ua } from "./Ua";


import * as d from "./data";
import { UiWebphoneController } from "./UiWebphoneController";

$(document).ready(() => {

	$("#logout").click(async () => {

		await api.logoutUser();

		window.location.href = "/login";

	});

	(async function main() {

		await simRegistrationProcess.start();

		let useableUserSims = await validateSimShareProcess.start();

		if (!useableUserSims.length) {

			window.location.href = "/manager";

			return;

		}

		tools.bootbox_custom.loading("Initialization...");

		const wdRoot = await d.io.fetch(useableUserSims);

		tools.bootbox_custom.dismissLoading();

		Ua.init(wdRoot.email, wdRoot.uaInstanceId);

		for( const userSim of useableUserSims ){

			const wdInstance = wdRoot.instances.find(({ imsi }) => imsi === userSim.sim.imsi)!;

			const uiWebphone = new UiWebphoneController(userSim, wdInstance);

			$(".page-content-inner").append(uiWebphone.structure);

		}

		$("#footer").hide();


	})();


});

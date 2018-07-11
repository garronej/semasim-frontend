import { apiClient as api } from "../../../api";
import { simRegistrationProcess, validateSimShareProcess } from "../../../shared";
import { UiController } from "./UiController";

declare const require: (path: string) => any;

$(document).ready(() => {

    $("#logout").click(async () => {

        await api.logoutUser();

        window.location.href = "/login";

    });

    (async function main(previousState?: UiController.State) {

        await simRegistrationProcess.start();

		const useableUserSims = await validateSimShareProcess.start();
		
		const insertPagePayload= (structure: JQuery)=> 
			$("#page-payload").html("").append(structure);

        if (!useableUserSims.length) {

            const structure = $(require("../templates/welcome.html"));

			structure.find("#jumbotron-refresh").click(() => main());
			
			insertPagePayload(structure);

        } else {

            const uiController = new UiController(
                useableUserSims, previousState
            );

            uiController.evtRefresh.attach(state => {

                uiController.structure.remove();

                main(state);

			});
			
			insertPagePayload(uiController.structure);

        }

    })();

});
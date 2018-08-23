import { launch as backendSocket_launch } from "../../../shared/dist/lib/backendClientSideSocket/launch";
import * as webApiCaller from "../../../shared/dist/lib/webApiCaller";
import { UiController } from "./UiController";

$(document).ready(async () => {

    $("#logout").click(async () => {

        webApiCaller.logoutUser();

        window.location.href = "/login";

    });

    backendSocket_launch();

    const uiController = new UiController();

    $("#page-payload").html("").append(uiController.structure);

});
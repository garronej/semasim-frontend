declare const require: (path: string) => any;
require("es6-map/implement");
require("es6-weak-map/implement");
require("array.prototype.find").shim();

import * as webApiCaller from "../../../shared/dist/lib/webApiCaller";
import * as bootbox_custom from "../../../shared/dist/lib/tools/bootbox_custom";
import { UiController } from "./UiController";
import { getURLParameter } from "../../../shared/dist/lib/tools/getURLParameter";

$(document).ready(async () => {

    $("#logout").click(async () => {

        webApiCaller.logoutUser();

        window.location.href = "/login";

    });

    $("#footer").hide();

    bootbox_custom.loading("Loading subscription infos");

    const subscriptionInfos = await webApiCaller.getSubscriptionInfos();

    bootbox_custom.dismissLoading();

    console.log(JSON.stringify(subscriptionInfos, null, 2));

    //TODO: Add an extra parameter for android.
    //We might want to redirect to this page from the frontend.
    const redirectToAndroidApp = !!getURLParameter("email_as_hex");

    const uiController = new UiController(subscriptionInfos, redirectToAndroidApp);

    $("#page-payload").html("").append(uiController.structure);

});
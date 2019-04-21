declare const require: (path: string) => any;
require("es6-map/implement");
require("es6-weak-map/implement");
require("array.prototype.find").shim();
import "../../../shared/dist/lib/tools/standalonePolyfills";

import * as webApiCaller from "../../../shared/dist/lib/webApiCaller";
import * as bootbox_custom from "../../../shared/dist/lib/tools/bootbox_custom";
import { UiController } from "./UiController";

declare const androidEventHandlers: {
    onDone(email?: string, password?: string): void;
};

$(document).ready(async () => {

    $("#logout").click(async () => {

        webApiCaller.logoutUser();

        window.location.href = "/login";

    });

    bootbox_custom.loading("Loading subscription infos");

    const [
        subscriptionInfos, 
        { 
            location: countryIsoFromLocation, 
            language: countryIsoForLanguage 
        } 
    ] = await Promise.all([
        webApiCaller.getSubscriptionInfos(),
        webApiCaller.getCountryIso()
    ]);

    if (
        typeof androidEventHandlers !== "undefined" &&
        (subscriptionInfos.customerStatus === "EXEMPTED" || !!subscriptionInfos.subscription)
    ) {

        androidEventHandlers.onDone();

        return;

    }

    bootbox_custom.dismissLoading();

    const uiController = new UiController(
        subscriptionInfos,
        countryIsoFromLocation || countryIsoForLanguage
    );

    uiController.evtDone.attachOnce(() => {

        if (typeof androidEventHandlers !== "undefined") {

            androidEventHandlers.onDone();

        } else {

            location.reload();

        }

    });

    $("#page-payload").html("").append(uiController.structure);

});
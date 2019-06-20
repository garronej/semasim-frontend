declare const require: (path: string) => any;
require("es6-map/implement");
require("es6-weak-map/implement");
require("array.prototype.find").shim();
import "../../../shared/dist/tools/standalonePolyfills";

import * as webApiCaller from "../../../shared/dist/lib/webApiCaller";
import * as bootbox_custom from "../../../shared/dist/tools/bootbox_custom";
import { UiController } from "./UiController";
import * as availablePages from "../../../shared/dist/lib/availablePages";

declare const apiExposedByHost: {
    onDone(errorMessage: string | null): void;
};

if( typeof apiExposedByHost !== "undefined" ){

    window.onerror = (msg, url, lineNumber) => {
        apiExposedByHost.onDone(`${msg}\n'${url}:${lineNumber}`);
        return false;
    };

    if ("onPossiblyUnhandledRejection" in Promise) {

        (Promise as any).onPossiblyUnhandledRejection(error => {
            apiExposedByHost.onDone(error.message + " " + error.stack);
        });

    }

}

async function onLoggedIn() {

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
        typeof apiExposedByHost !== "undefined" &&
        (
            subscriptionInfos.customerStatus === "EXEMPTED" || 
            !!subscriptionInfos.subscription
        )
    ) {

        apiExposedByHost.onDone(null);

        return;

    }

    bootbox_custom.dismissLoading();

    const uiController = new UiController(
        subscriptionInfos,
        countryIsoFromLocation || countryIsoForLanguage
    );

    uiController.evtDone.attachOnce(() => {

        if (typeof apiExposedByHost !== "undefined") {

            apiExposedByHost.onDone(null);

        } else {

            location.reload();

        }

    });

    $("#page-payload").html("").append(uiController.structure);

}

window["apiExposedToHost"] = {
    "login": async (email: string, secret: string): Promise<void> => {

        const { status } = await webApiCaller.loginUser(email, secret);

        if (status !== "SUCCESS") {
            apiExposedByHost.onDone("Login failed");
            return;
        }

        onLoggedIn();

    }
};

$(document).ready(() => {

    if (typeof apiExposedByHost !== "undefined") {
        return;
    }

    $("#logout").click(async () => {

        await webApiCaller.logoutUser();

        location.href = `/${availablePages.PageName.login}`

    });

    onLoggedIn();

});

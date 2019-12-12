
import * as webApiCaller from "frontend-shared/dist/lib/webApiCaller";
import { dialogApi } from "frontend-shared/dist/tools/modal/dialog";
import { UiController } from "./UiController";
import * as availablePages from "frontend-shared/dist/lib/availablePages";
import "frontend-shared/dist/tools/polyfills/Object.assign";
import "minimal-polyfills/dist/lib/ArrayBuffer.isView";

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

    dialogApi.loading("Loading subscription infos");

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

    dialogApi.dismissLoading();

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


const apiExposedToHost: {
    login(email: string, secret: string): void;
} = {
    "login": (email,secret)=> {

        (async () => {

            const { status } = await webApiCaller.loginUser(email, secret, undefined);

            if (status !== "SUCCESS") {

                apiExposedByHost.onDone("Login failed");
                return;
            }

            onLoggedIn();


        })();

    }
};

Object.assign(window, { apiExposedToHost });

$(document).ready(() => {

    if (typeof apiExposedByHost !== "undefined") {
        return;
    }

    $("#logout").click(async () => {

        await webApiCaller.logoutUser();

        location.href = `/${availablePages.PageName.login}`;

    });

    onLoggedIn();

});

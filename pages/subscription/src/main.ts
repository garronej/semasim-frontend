
//TODO: Write a launcher
import { getWebApi } from "frontend-shared/dist/lib/webApiCaller";
import { AuthenticatedSessionDescriptorSharedData } from "frontend-shared/dist/lib/localStorage/AuthenticatedSessionDescriptorSharedData";
import * as networkStateMonitoring from "frontend-shared/dist/lib/networkStateMonitoring";
import { restartApp } from "frontend-shared/dist/lib/restartApp";

import { dialogApi } from "frontend-shared/dist/tools/modal/dialog";
import { UiController } from "./UiController";
import "minimal-polyfills/dist/lib/Object.assign";
import "minimal-polyfills/dist/lib/ArrayBuffer.isView";

const prWebApi = (async () => {

    const networkStateMonitoringApi = await networkStateMonitoring.getApi();

    return (() => {

        const { getLoginLogoutApi, ...rest } = getWebApi({
            AuthenticatedSessionDescriptorSharedData,
            networkStateMonitoringApi,
            restartApp
        });

        return {
            ...rest,
            ...getLoginLogoutApi({ "assertJsRuntimeEnv": "browser" })
        };

    })();


})();



declare const apiExposedByHost: {
    onDone(errorMessage: string | null): void;
};

if (typeof apiExposedByHost !== "undefined") {

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

    const webApi = await prWebApi;

    const [
        subscriptionInfos,
        {
            location: countryIsoFromLocation,
            language: countryIsoForLanguage
        }
    ] = await Promise.all([
        webApi.getSubscriptionInfos(),
        webApi.getCountryIso()
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

    const uiController = new UiController({
        webApi,
        subscriptionInfos,
        "guessedCountryIso": countryIsoFromLocation || countryIsoForLanguage
    });

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
    "login": (email, secret) => {

        (async () => {

            const webApi = await prWebApi;

            const { status } = await webApi.loginUser({ 
                "assertJsRuntimeEnv": "browser",
                email, 
                secret,
             });

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

        const webApi = await prWebApi;

        await webApi.logoutUser();

        restartApp("User logged out");

    });

    onLoggedIn();

});

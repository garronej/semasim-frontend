
//TODO: Write a launcher
import { getWebApi } from "frontend-shared/dist/lib/webApiCaller";
import { AuthenticatedSessionDescriptorSharedData } from "frontend-shared/dist/lib/localStorage/AuthenticatedSessionDescriptorSharedData";
import * as networkStateMonitoring from "frontend-shared/dist/lib/networkStateMonitoring";
import { restartApp } from "frontend-shared/dist/lib/restartApp";

import { UiController } from "./UiController";
import { convertFromEuro } from "frontend-shared/dist/tools/currency";

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

$(document).ready(async () => {

    $("#logout").click(async () => {

        const webApi = await prWebApi;

        await webApi.logoutUser();

        restartApp("User logged out");

    });

    const webApi = await prWebApi;

    const [ 
        changesRates, 
        { 
            location: countryIsoFromLocation, 
            language: countryIsoForLanguage 
        } 
    ] = await Promise.all([
        webApi.getChangesRates(),
        webApi.getCountryIso()
    ]);

    convertFromEuro.setChangeRates(changesRates);

    console.log({ countryIsoForLanguage, countryIsoFromLocation });

    const uiController = new UiController({
        "defaultCountryIso": countryIsoFromLocation || countryIsoForLanguage,
        webApi
    });

    $("#page-payload").html("").append(uiController.structure);

});
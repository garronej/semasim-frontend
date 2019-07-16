
import * as webApiCaller from "../../../shared/dist/lib/webApiCaller";
import { UiController } from "./UiController";
import { convertFromEuro } from "../../../shared/dist/tools/currency";
import * as availablePages from "../../../shared/dist/lib/availablePages";

$(document).ready(async () => {

    $("#logout").click(async () => {

        await webApiCaller.logoutUser();

        location.href = `/${availablePages.PageName.login}`

    });

    const [ 
        changesRates, 
        { 
            location: countryIsoFromLocation, 
            language: countryIsoForLanguage 
        } 
    ] = await Promise.all([
        webApiCaller.getChangesRates(),
        webApiCaller.getCountryIso()
    ]);

    convertFromEuro.setChangeRates(changesRates);

    console.log({ countryIsoForLanguage, countryIsoFromLocation });

    const uiController = new UiController(countryIsoFromLocation || countryIsoForLanguage);

    $("#page-payload").html("").append(uiController.structure);

});
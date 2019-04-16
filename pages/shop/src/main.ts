declare const require: (path: string) => any;
require("es6-map/implement");
require("es6-weak-map/implement");
require("array.prototype.find").shim();
import "../../../shared/dist/lib/tools/standalonePolyfills";

import * as webApiCaller from "../../../shared/dist/lib/webApiCaller";
import { UiController } from "./UiController";
import { convertFromEuro } from "../../../shared/dist/lib/tools/currency";

$(document).ready(async () => {

    $("#logout").click(async () => {

        webApiCaller.logoutUser();

        window.location.href = "/login";

    });

    const [ changesRates, guessedCountryIso ] = await Promise.all([
        webApiCaller.getChangesRates(),
        webApiCaller.guessCountryIso()
    ]);

    convertFromEuro.changeRates= changesRates;

    const uiController = new UiController(guessedCountryIso);

    $("#page-payload").html("").append(uiController.structure);

});

declare const require: (path: string) => any;

//Polyfill
require("es6-map/implement");
require("es6-weak-map/implement");
require("array.prototype.find").shim();
if (!Array.from) Array.from = require('array-from');

if (!ArrayBuffer.isView) {

    Object.defineProperty(
        ArrayBuffer,
        "isView", { "get": () => function isView() { return false; } }
    );

}

import * as connection from "../../../shared/dist/lib/toBackend/connection";
import * as webApiCaller from "../../../shared/dist/lib/webApiCaller";
import { UiController } from "./UiController";
import * as bootbox_custom from "../../../shared/dist/lib/tools/bootbox_custom";
import * as remoteApiCaller from "../../../shared/dist/lib/toBackend/remoteApiCaller";

$(document).ready(async () => {

    $("#logout").click(async () => {

        webApiCaller.logoutUser();

        window.location.href = "/login";

    });

    connection.connect();

    const uiController = new UiController(
        await remoteApiCaller.getUsableUserSims()
    );

    $("#page-payload").html("").append(uiController.structure);

    $("#register-new-sim")
    .removeClass("hidden")
    .click(
        () => bootbox_custom.alert([
            "Any new SIM should be automatically detected, you dont even need to refresh the page.",
            "No SIM found ? Make sure that:",
            "-This device and the Semasim gateway ( the Raspberry Pi ) are connected to the same local network. ( required only for pairing the SIM with the account ).",
            "-The SIM you are trying to register have not already been registered with an other account.",
            "-Your Semasim gateway is able to power all the GSM dongles connected to it.",
            "-The problem does not come from the USB hub you might be using."
        ].join("<br>"))
    );

});
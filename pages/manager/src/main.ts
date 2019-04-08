
declare const require: (path: string) => any;

//Polyfill
require("es6-map/implement");
require("es6-weak-map/implement");
require("array.prototype.find").shim();
if (!Array.from) Array.from = require('array-from');

import "../../../shared/dist/lib/tools/standalonePolyfills";

import * as connection from "../../../shared/dist/lib/toBackend/connection";
import * as webApiCaller from "../../../shared/dist/lib/webApiCaller";
import { UiController } from "./UiController";
import * as bootbox_custom from "../../../shared/dist/lib/tools/bootbox_custom";
import * as remoteApiCaller from "../../../shared/dist/lib/toBackend/remoteApiCaller";

declare const __dirname: any;

declare const androidEventHandlers: {
    onDone(errorMessage: string | null): void;
};

//TODO: See if defined
if( typeof androidEventHandlers !== "undefined" ){

    window.onerror = (msg, url, lineNumber) => {
        androidEventHandlers.onDone(`${msg}\n'${url}:${lineNumber}`);
        return false;
    };

    if ("onPossiblyUnhandledRejection" in Promise) {

        (Promise as any).onPossiblyUnhandledRejection(error => {
            androidEventHandlers.onDone(error.message + " " + error.stack);
        });

    }

}


let resolvePrUiController: (uiController: UiController) => void;

window["exposedToAndroid"] = (() => {

    const prUiController = new Promise<UiController>(resolve => resolvePrUiController = resolve);

    return {
        "createContact": async (imsi: string, number: string) => {

            await (await prUiController).interact_createContact(imsi, number);

            try{ androidEventHandlers.onDone(null); }catch{}

        },
        "updateContactName": async (number: string) => {

            await (await prUiController).interact_updateContactName(number);

            try{ androidEventHandlers.onDone(null); }catch{}

        },
        "deleteContact": async (number: string) => {

            await (await prUiController).interact_deleteContact(number);

            try{ androidEventHandlers.onDone(null); }catch{}

        }
    };

})();




$(document).ready(async () => {

    $("#logout").click(() => {

        webApiCaller.logoutUser();

        window.location.href = "/login";

    });

    connection.connect({ "requestTurnCred": false });

    const uiController = new UiController(
        await remoteApiCaller.getUsableUserSims()
    );

    resolvePrUiController(uiController);

    $("#page-payload").html("").append(uiController.structure);

    $("#register-new-sim")
        .removeClass("hidden")
        .click(
            () => bootbox_custom.alert(
                require("fs").readFileSync(__dirname + "/../res/1.txt", "utf8")
                    .replace(/\n/g, "<br>")
            )
        )
        ;

});
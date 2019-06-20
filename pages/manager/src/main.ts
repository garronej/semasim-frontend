
declare const require: (path: string) => any;

//Polyfill
require("es6-map/implement");
require("es6-weak-map/implement");
require("array.prototype.find").shim();
if (!Array.from) Array.from = require('array-from');

import "../../../shared/dist/tools/standalonePolyfills";

import * as connection from "../../../shared/dist/lib/toBackend/connection";
import * as webApiCaller from "../../../shared/dist/lib/webApiCaller";
import { UiController } from "./UiController";
import * as bootbox_custom from "../../../shared/dist/tools/bootbox_custom";
import * as remoteApiCaller from "../../../shared/dist/lib/toBackend/remoteApiCaller";
import * as availablePages from "../../../shared/dist/lib/availablePages";

declare const __dirname: any;

declare const apiExposedByHost: {
    onDone(errorMessage: string | null): void;
};

//TODO: See if defined
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

async function onLoggedIn(): Promise<UiController> {

    connection.connect({ 
        "connectionType": "MAIN",
        "requestTurnCred": false
    });

    const uiController = new UiController(
        await remoteApiCaller.getUsableUserSims()
    );

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

    return uiController;

}

window["apiExposedToHost"] = (() => {

    const loginAndGetUiController = async (email: string, secret: string): Promise<UiController> => {

        const { status } = await webApiCaller.loginUser(email, secret);

        if (status !== "SUCCESS") {
            apiExposedByHost.onDone("Login failed");
            await new Promise(resolve => { });
        }

        return onLoggedIn();

    };

    const onDone = () => {
        try {
            apiExposedByHost.onDone(null);
        } catch{ }
    };

    return {
        "createContact": (email: string, secret: string, imsi: string, number: string) =>
            loginAndGetUiController(email, secret)
                .then(uiController => uiController.interact_createContact(imsi, number))
                .then(() => onDone())
        ,
        "updateContactName": async (email: string, secret: string, number: string) =>
            loginAndGetUiController(email, secret)
                .then(uiController => uiController.interact_updateContactName(number))
                .then(() => onDone())
        ,
        "deleteContact": async (email: string, secret: string, number: string) =>
            loginAndGetUiController(email, secret)
                .then(uiController => uiController.interact_deleteContact(number))
                .then(() => onDone())
    };

})();


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
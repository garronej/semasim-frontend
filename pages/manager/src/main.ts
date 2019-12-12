
declare const require: Function;

import "minimal-polyfills/dist/lib/ArrayBuffer.isView";
import "minimal-polyfills/dist/lib/Array.from";
import "minimal-polyfills/dist/lib/String.prototype.startsWith";
import "frontend-shared/dist/tools/polyfills/Object.assign";
import * as connection from "frontend-shared/dist/lib/toBackend/connection";
import * as webApiCaller from "frontend-shared/dist/lib/webApiCaller";
import { UiController } from "./UiController";
import { dialogApi, startMultiDialogProcess } from "frontend-shared/dist/tools/modal/dialog";
import * as remoteCoreApiCaller from "frontend-shared/dist/lib/toBackend/remoteApiCaller/core";
import { registerInteractiveAppEvtHandlers } from "frontend-shared/dist/lib/interactiveAppEvtHandlers";
import { appEvts } from "frontend-shared/dist/lib/toBackend/appEvts";
import { restartApp } from "frontend-shared/dist/lib/restartApp";


declare const __dirname: any;

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

async function onLoggedIn(): Promise<UiController> {

    connection.connect(((): connection.ConnectParams => {

        const out: connection.ConnectParams.Browser = {
            "assertJsRuntimeEnv": "browser",
            "requestTurnCred": false
        };

        return out;

    })());

    registerInteractiveAppEvtHandlers(
        appEvts,
        remoteCoreApiCaller,
        dialogApi,
        startMultiDialogProcess,
        restartApp
    );

    const uiController = new UiController(
        await remoteCoreApiCaller.getUsableUserSims()
    );

    $("#page-payload").html("").append(uiController.structure);

    $("#register-new-sim")
        .removeClass("hidden")
        .click(
            () => dialogApi.create("alert", {
                "message":
                    require("fs").readFileSync(__dirname + "/../res/1.txt", "utf8")
                        .replace(/\n/g, "<br>")
            }))
        ;

    return uiController;

}

const apiExposedToHost = (() => {

    const loginAndGetUiController = async (email: string, secret: string): Promise<UiController> => {

        const { status } = await webApiCaller.loginUser(email, secret, undefined);

        if (status !== "SUCCESS") {
            apiExposedByHost.onDone("Login failed");
            await new Promise(() => { });
        }

        return onLoggedIn();

    };

    const onDone = () => {
        try {
            apiExposedByHost.onDone(null);
        } catch{ }
    };

    const START_ACTION = {
        "NO_ACTION": 0,
        "CREATE_CONTACT": 1,
        "UPDATE_CONTACT_NAME": 2,
        "DELETE_CONTACT": 3
    };

    function start(
        action: typeof START_ACTION.NO_ACTION,
        email: string, secret: string,
        _p4: null, _p5: null
    ): void;
    function start(
        action: typeof START_ACTION.CREATE_CONTACT,
        email: string, secret: string,
        number: string, imsi: string
    ): void;
    function start(
        action: typeof START_ACTION.UPDATE_CONTACT_NAME,
        email: string, secret: string,
        number: string, _p5: null
    ): void;
    function start(
        action: typeof START_ACTION.DELETE_CONTACT,
        email: string, secret: string,
        number: string, _p5: null
    ): void;
    function start(
        action: typeof START_ACTION[keyof typeof START_ACTION],
        email: string, secret: string,
        number: string | null, imsi: string | null
    ): void {

        (async () => {

            const uiController = await loginAndGetUiController(email, secret);

            switch (action) {
                case START_ACTION.NO_ACTION: return;
                case START_ACTION.CREATE_CONTACT: await uiController.interact_createContact(imsi!, number!); break;
                case START_ACTION.UPDATE_CONTACT_NAME: await uiController.interact_updateContactName(number!); break;
                case START_ACTION.DELETE_CONTACT: await uiController.interact_deleteContact(number!); break;
            }

            onDone();

        })();

    }

    return { start };


})();

Object.assign(window, { apiExposedToHost });

$(document).ready(() => {

    if (typeof apiExposedByHost !== "undefined") {
        return;
    }

	$("#logout").click(() => webApiCaller.logoutUser());

    onLoggedIn();

});
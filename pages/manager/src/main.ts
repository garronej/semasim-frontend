
declare const require: Function;

import "minimal-polyfills/dist/lib/ArrayBuffer.isView";
import "minimal-polyfills/dist/lib/Array.from";
import "minimal-polyfills/dist/lib/String.prototype.startsWith";
import "frontend-shared/dist/tools/polyfills/Object.assign";
import { uiControllerDependencyInjection } from "./UiController";
import { managerPageLaunch } from "frontend-shared/dist/lib/appLauncher/managerPageLaunch";
import { Deferred } from "frontend-shared/dist/tools/Deferred";

const dUiController = new Deferred<
    Pick<
        import("./UiController").UiController,
        "interact_createContact" |
        "interact_deleteContact" |
        "interact_updateContactName"
    >
>();
const dLoginUser = new Deferred<import("frontend-shared/dist/lib/webApiCaller").WebApi["loginUser"]>();

declare const __dirname: any;

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

const apiExposedToHost = (() => {

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

            const loginUser = await dLoginUser.pr;

            const loginResult = await loginUser({
                "assertJsRuntimeEnv": "browser",
                email,
                secret,
                "shouldThrowOnError": true
            }).catch(() => new Error());

            if (
                loginResult instanceof Error ||
                loginResult.status !== "SUCCESS"
            ) {

                apiExposedByHost.onDone("Login failed");
                return;

            }

            //const uiController = await prUiController;
            const uiController = await dUiController.pr;

            switch (action) {
                case START_ACTION.NO_ACTION: return;
                case START_ACTION.CREATE_CONTACT:
                    await uiController.interact_createContact(imsi!, number!); break;
                case START_ACTION.UPDATE_CONTACT_NAME:
                    await uiController.interact_updateContactName(number!); break;
                case START_ACTION.DELETE_CONTACT:
                    await uiController.interact_deleteContact(number!); break;
            }


            try {
                apiExposedByHost.onDone(null);
            } catch{ }

        })();

    }

    return { start };

})();

Object.assign(window, { apiExposedToHost });

$(document).ready(async () => {

    if (typeof apiExposedByHost !== "undefined") {
        return;
    }

    const dLogoutUser = new Deferred<import("frontend-shared/dist/lib/types").AccountManagementApi["webApi"]["logoutUser"]>();

    $("#logout").click(() => dLogoutUser.pr.then(logoutUser => logoutUser()));

    const {
        dialogApi,
        startMultiDialogProcess,
        createModal,
        prReadyToAuthenticateStep
    } = managerPageLaunch({ "assertJsRuntimeEnv": "browser" });

    const { UiController } = uiControllerDependencyInjection({
        dialogApi,
        startMultiDialogProcess,
        createModal
    });

    const { loginUser, prAccountManagementApi } = await prReadyToAuthenticateStep;

    dLoginUser.resolve(loginUser);

    const accountManagementApi = await prAccountManagementApi;

    dLogoutUser.resolve(accountManagementApi.webApi.logoutUser);

    const uiController = new UiController(accountManagementApi);

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

    dUiController.resolve(uiController);


});

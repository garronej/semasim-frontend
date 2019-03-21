
declare const require: (path: string) => any;

//Polyfill
require("es6-map/implement");
require("es6-weak-map/implement");
require("array.prototype.find").shim();
if (!Array.from) Array.from = require('array-from');

if (!ArrayBuffer.isView) {

    Object.defineProperty(
        ArrayBuffer,
        "isView", { "value": function isView() { return false; } }
    );

}

import * as connection from "../../../shared/dist/lib/toBackend/connection";
import * as webApiCaller from "../../../shared/dist/lib/webApiCaller";
import { UiController, Action } from "./UiController";
import * as bootbox_custom from "../../../shared/dist/lib/tools/bootbox_custom";
import * as remoteApiCaller from "../../../shared/dist/lib/toBackend/remoteApiCaller";
import { getURLParameter } from "../../../shared/dist/lib/tools/getURLParameter";

declare const __dirname: any;
declare const Buffer: any;

$(document).ready(async () => {

    $("#logout").click(() => {

        webApiCaller.logoutUser();

        window.location.href = "/login";

    });

    connection.connect({ 
        "sessionType": "MAIN", 
        "requestTurnCred": false 
    });

    const action: Action | undefined = (() => {

        const type = getURLParameter("action") as Action["type"] | undefined;

        if (!type) {
            return undefined;
        }

        const getNumber = () => Buffer.from(
            getURLParameter("number_as_hex")!,
            "hex"
        ).toString("utf8");

        switch (type) {
            case "UPDATE_CONTACT_NAME":
            case "DELETE_CONTACT":
                return {
                    type,
                    "number": getNumber()
                }
            case "CREATE_CONTACT": return {
                type,
                "number": getNumber(),
                "imsi": getURLParameter("imsi")!
            };
        }

    })();

    const uiController = new UiController(
        await remoteApiCaller.getUsableUserSims(),
        action
    );

    $("#page-payload").html("").append(uiController.structure);


    $("#register-new-sim")
        .removeClass("hidden")
        .click(
            () => bootbox_custom.alert(
                require("fs").readFileSync(__dirname + "/../res/1.txt", "utf8")
                    .replace(/\n/g, "<br>")
            )
        );

});
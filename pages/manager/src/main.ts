
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

declare const __dirname: any;

$(document).ready(async () => {

    $("#logout").click(() => {

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
            () => bootbox_custom.alert(
                require("fs").readFileSync(__dirname + "/../res/1.txt", "utf8")
                    .replace(/\n/g, "<br>")
            )
        );

});
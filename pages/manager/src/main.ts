
declare const require: (path: string) => any;
require("es6-map/implement");
require("es6-weak-map/implement");
require("array.prototype.find").shim();

import * as connection from "../../../shared/dist/lib/toBackend/connection";
import * as webApiCaller from "../../../shared/dist/lib/webApiCaller";
import { UiController } from "./UiController";

$(document).ready(async () => {

    $("#logout").click(async () => {

        webApiCaller.logoutUser();

        window.location.href = "/login";

    });

    connection.connect();

    const uiController = new UiController();

    $("#page-payload").html("").append(uiController.structure);

});
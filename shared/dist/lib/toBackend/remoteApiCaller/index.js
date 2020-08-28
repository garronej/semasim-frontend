"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.factory = void 0;
var core = require("./core");
var webphoneData = require("./webphoneData");
var getSendRequest_1 = require("./getSendRequest");
function factory(params) {
    var connectionApi = params.connectionApi, restartApp = params.restartApp;
    var sendRequest = getSendRequest_1.getSendRequest(connectionApi, restartApp);
    return {
        "getWdApiFactory": function (_a) {
            var encryptorDecryptor = _a.encryptorDecryptor, userEmail = _a.userEmail;
            return webphoneData.getWdApiFactory({
                sendRequest: sendRequest,
                "remoteNotifyEvts": connectionApi.remoteNotifyEvts,
                encryptorDecryptor: encryptorDecryptor,
                userEmail: userEmail
            });
        },
        "getCoreApi": function (_a) {
            var userEmail = _a.userEmail;
            return core.getCoreApi(sendRequest, connectionApi.remoteNotifyEvts, restartApp, userEmail);
        }
    };
}
exports.factory = factory;

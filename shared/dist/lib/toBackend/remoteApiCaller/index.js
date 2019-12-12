"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var core = require("./core");
exports.core = core;
var webphoneData = require("./webphoneData");
var sendRequest_1 = require("./sendRequest");
var appEvts_1 = require("../appEvts");
var getWdApiCallerForSpecificSimFactory = function (encryptorDecryptor, userEmail) {
    return webphoneData.getApiCallerForSpecificSimFactory(sendRequest_1.sendRequest, appEvts_1.appEvts, encryptorDecryptor, userEmail);
};
exports.getWdApiCallerForSpecificSimFactory = getWdApiCallerForSpecificSimFactory;

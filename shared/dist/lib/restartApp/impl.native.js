"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var RNRestart = require("react-native-restart").default;
var default_ = function (reason) {
    console.log("Restarting app, reason: " + reason);
    RNRestart.Restart();
    return new Promise(function () { });
};
exports.default = default_;

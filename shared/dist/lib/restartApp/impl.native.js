"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var RNRestart = require("react-native-restart").default;
var default_ = function () {
    console.log("Restarting app");
    RNRestart.Restart();
};
exports.default = default_;

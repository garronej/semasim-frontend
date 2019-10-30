"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
//const rn: typeof import("../../../../react-native-app/node_modules/@types/react-native") = require("react-native");
var rn = require("react-native");
var OS = rn.Platform.OS;
var isDevEnv = true;
var default_ = {
    "assetsRoot": "https://static.semasim.com/",
    isDevEnv: isDevEnv,
    "baseDomain": isDevEnv ? "dev.semasim.com" : "semasim.com",
    "jsRuntimeEnv": "react-native",
    "hostOs": (function () {
        switch (OS) {
            case "android": return "android";
            case "ios": return "iOS";
            default: throw new Error("never");
        }
    })()
};
exports.default = default_;

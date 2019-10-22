"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var jsRuntimeEnv_1 = require("./jsRuntimeEnv");
exports.jsRuntimeEnv = jsRuntimeEnv_1.jsRuntimeEnv;
//NOTE: For web Defined at ejs building in templates/head_common.ejs, must be defined for react-native.
exports.assetsRoot = jsRuntimeEnv_1.jsRuntimeEnv === "react-native" ? "https://static.semasim.com/" : window["assets_root"];
exports.isDevEnv = jsRuntimeEnv_1.jsRuntimeEnv === "react-native" ? true : window["isDevEnv"];
exports.baseDomain = jsRuntimeEnv_1.jsRuntimeEnv === "react-native" ?
    (exports.isDevEnv ? "dev.semasim.com" : "semasim.com") :
    window.location.href.match(/^https:\/\/web\.([^\/]+)/)[1];

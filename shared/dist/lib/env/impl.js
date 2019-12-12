"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
//NOTE: Defined at ejs building in templates/head_common.ejs
//NOTE: If windows is not defined it mean that we are running on node, performing some integration tests.
var default_ = typeof window !== "undefined" ? ({
    "assetsRoot": window["assets_root"],
    "isDevEnv": window["isDevEnv"],
    "baseDomain": window.location.href.match(/^https:\/\/web\.([^\/]+)/)[1],
    "jsRuntimeEnv": "browser",
    "hostOs": undefined
}) : ({
    "assetsRoot": "https://static.semasim.com/",
    "isDevEnv": false,
    "baseDomain": "dev.semasim.com",
    "jsRuntimeEnv": "browser",
    "hostOs": undefined
});
exports.default = default_;

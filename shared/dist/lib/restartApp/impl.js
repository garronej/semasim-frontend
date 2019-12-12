"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var env_1 = require("../env");
var default_ = function (reason) {
    if (env_1.env.isDevEnv) {
        alert("About to restart app, reason: " + reason);
    }
    location.reload();
    return new Promise(function () { });
};
exports.default = default_;

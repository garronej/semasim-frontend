"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var env_1 = require("../env");
var default_ = function () {
    if (env_1.env.isDevEnv) {
        throw new Error("In prod the app would have been restarted");
    }
    location.reload();
};
exports.default = default_;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var env = require("../env");
var default_ = function () {
    if (env.isDevEnv) {
        throw new Error("In prod the app would have been restarted");
    }
    location.reload();
};
exports.default = default_;

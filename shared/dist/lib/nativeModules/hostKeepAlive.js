"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.apiExposedToHost = {};
function start() {
    apiExposedByHost.startKeepAlive();
}
exports.start = start;
function stop() {
    apiExposedByHost.stopKeepAlive();
}
exports.stop = stop;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function notifyHostWhenPageIsReady() {
    $(document).ready(function () { return console.log("->__PAGE_READY__<-"); });
}
exports.notifyHostWhenPageIsReady = notifyHostWhenPageIsReady;

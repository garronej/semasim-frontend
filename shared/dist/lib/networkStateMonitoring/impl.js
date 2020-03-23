"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var evt_1 = require("evt");
var api = {
    "getIsOnline": function () { return navigator.onLine; },
    "evtStateChange": (function () {
        var out = new evt_1.VoidEvt();
        window.addEventListener("online", function () { return out.post(); });
        window.addEventListener("offline", function () { return out.post(); });
        return out;
    })()
};
exports.getApi = function () { return Promise.resolve(api); };

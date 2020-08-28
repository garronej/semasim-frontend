"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getApi = void 0;
var evt_1 = require("evt");
var api = {
    "getIsOnline": function () { return navigator.onLine; },
    "evtStateChange": (function () {
        var out = evt_1.Evt.create();
        window.addEventListener("online", function () { return out.post(); });
        window.addEventListener("offline", function () { return out.post(); });
        return out;
    })()
};
exports.getApi = function () { return Promise.resolve(api); };

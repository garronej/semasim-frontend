"use strict";
//TODO: Incorporate in EVT
Object.defineProperty(exports, "__esModule", { value: true });
var evt_1 = require("evt");
exports.evtFromPromise = function (pr) {
    var evt = new evt_1.Evt();
    pr.then(function (data) { return evt.post(data); });
    return evt;
};

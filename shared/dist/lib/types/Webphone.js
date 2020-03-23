"use strict";
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
Object.defineProperty(exports, "__esModule", { value: true });
var wd = require("./webphoneData");
var Webphone;
(function (Webphone) {
    function sortPuttingFirstTheOneThatWasLastUsed(webphone1, webphone2) {
        if (!!webphone1.userSim.reachableSimState !== !!webphone2.userSim.reachableSimState) {
            return !!webphone1.userSim.reachableSimState ? -1 : 1;
        }
        var _a = __read([webphone1, webphone2].map(function (_a) {
            var wdChats = _a.wdChats;
            return wd.Chat.findLastOpened(wdChats);
        }), 2), wdChat1 = _a[0], wdChat2 = _a[1];
        if (!wdChat1 !== !wdChat2) {
            return !!wdChat1 ? -1 : 1;
        }
        if (!wdChat1) {
            return 0;
        }
        switch (wd.Chat.compare(wdChat1, wdChat2)) {
            case -1: return 1;
            case 0: return 0;
            case 1: return -1;
        }
    }
    Webphone.sortPuttingFirstTheOneThatWasLastUsed = sortPuttingFirstTheOneThatWasLastUsed;
    ;
})(Webphone = exports.Webphone || (exports.Webphone = {}));

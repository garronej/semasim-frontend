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
exports.Webphone = void 0;
var wd = require("./webphoneData");
var lib_1 = require("phone-number/dist/lib");
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
    var canCall;
    (function (canCall) {
        function getValue(params) {
            var webphone = params.webphone, phoneNumber = params.phoneNumber;
            var reachableSimState = webphone.userSim.reachableSimState, evtIsSipRegistered = webphone.evtIsSipRegistered;
            return (lib_1.phoneNumber.isDialable(phoneNumber) &&
                evtIsSipRegistered.state &&
                !!(reachableSimState === null || reachableSimState === void 0 ? void 0 : reachableSimState.isGsmConnectivityOk) &&
                (reachableSimState.ongoingCall === undefined ||
                    reachableSimState.ongoingCall.number === phoneNumber &&
                        !reachableSimState.ongoingCall.isUserInCall));
        }
        canCall.getValue = getValue;
        function getAffectedByEvts(params) {
            var webphone = params.webphone;
            var userSimEvts = webphone.userSimEvts, evtIsSipRegistered = webphone.evtIsSipRegistered;
            return [
                userSimEvts.evtReachabilityStatusChange,
                userSimEvts.evtCellularConnectivityChange,
                userSimEvts.evtOngoingCall,
                evtIsSipRegistered.evtChange
            ];
        }
        canCall.getAffectedByEvts = getAffectedByEvts;
    })(canCall = Webphone.canCall || (Webphone.canCall = {}));
})(Webphone = exports.Webphone || (exports.Webphone = {}));

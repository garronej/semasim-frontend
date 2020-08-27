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
var lib_1 = require("phone-number/dist/lib");
var evt_1 = require("evt");
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
    function useEffectCanCall(canCallEffect, _a) {
        var evtWebphone = _a.evtWebphone, evtPhoneNumberRaw = _a.evtPhoneNumberRaw, _b = _a.ctx, ctx = _b === void 0 ? evt_1.Evt.newCtx() : _b;
        var ctx_ = evt_1.Evt.newCtx();
        ctx.evtDoneOrAborted.attachOnce(function () { return ctx_.done(); });
        evt_1.Evt.useEffect(function () {
            ctx_.done();
            var _a = evtWebphone.state, _b = _a.userSim, reachableSimState = _b.reachableSimState, country = _b.sim.country, userSimEvts = _a.userSimEvts, evtIsSipRegistered = _a.evtIsSipRegistered;
            var evtPhoneNumber = evtPhoneNumberRaw
                .toStateful(ctx_)
                .pipe(function () { return [
                lib_1.phoneNumber.build(evtPhoneNumberRaw.state, country === null || country === void 0 ? void 0 : country.iso)
            ]; });
            var evtIsPhoneNumberDialable = evtPhoneNumber.pipe(function (phoneNumber) { return [lib_1.phoneNumber.isDialable(phoneNumber)]; });
            evt_1.Evt.useEffect(function () { return canCallEffect(evtIsPhoneNumberDialable.state &&
                evtIsSipRegistered.state &&
                !!(reachableSimState === null || reachableSimState === void 0 ? void 0 : reachableSimState.isGsmConnectivityOk) &&
                (reachableSimState.ongoingCall === undefined ||
                    reachableSimState.ongoingCall.number === evtPhoneNumber.state &&
                        !reachableSimState.ongoingCall.isUserInCall)); }, evt_1.Evt.merge(ctx_, [
                evtIsPhoneNumberDialable.evtChange,
                userSimEvts.evtReachabilityStatusChange,
                userSimEvts.evtCellularConnectivityChange,
                userSimEvts.evtOngoingCall,
                evtIsSipRegistered.evtChange
            ]));
        }, evtWebphone.evtChange.pipe(ctx));
    }
    Webphone.useEffectCanCall = useEffectCanCall;
})(Webphone = exports.Webphone || (exports.Webphone = {}));

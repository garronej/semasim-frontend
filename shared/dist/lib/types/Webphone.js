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
    function canCallFactory(webphone) {
        var userSim = webphone.userSim, evtIsSipRegistered = webphone.evtIsSipRegistered;
        function canCall(number_raw) {
            var _a, _b;
            var number = lib_1.phoneNumber.build(number_raw, (_a = userSim.sim.country) === null || _a === void 0 ? void 0 : _a.iso);
            return (lib_1.phoneNumber.isDialable(number) &&
                evtIsSipRegistered.state &&
                !!((_b = userSim.reachableSimState) === null || _b === void 0 ? void 0 : _b.isGsmConnectivityOk) &&
                (userSim.reachableSimState.ongoingCall === undefined ||
                    userSim.reachableSimState.ongoingCall.number === number &&
                        !userSim.reachableSimState.ongoingCall.isUserInCall));
        }
        return { canCall: canCall };
    }
    Webphone.canCallFactory = canCallFactory;
    /*

    export function useEffect(
        canCallEffect: (canCall: boolean) => void,
        trkWebphone: Trackable<Webphone>,
        trkPhoneNumberRaw: Trackable<string>,
        ctx: import("evt").Ctx<any>
    ) {

        const obsPhoneNumber= Tracked.from(
            ctx,
            trkPhoneNumberRaw,
            number_raw => phoneNumberLib.build(
                number_raw,
                trkWebphone.val.userSim.sim.country?.iso
            )
        );

        const trkIsNumberDialable = Tracked.from(
            obsPhoneNumber,
            number=> phoneNumberLib.isDialable(number)
        );

        trkIsNumberDialable;

        



        Evt.useEffect(
            previousWebphone => {

                if (!!previousWebphone) {
                    Evt.getCtx(previousWebphone).done();
                }

                const webphone = trkWebphone.val;

                const { canCall } = canCallFactory(webphone);

                const webphoneCtx = Evt.getCtx(webphone);

                ctx.evtDoneOrAborted.attach(
                    webphoneCtx,
                    () => webphoneCtx.done()
                );

                Evt.useEffect(
                    () => canCallEffect(canCall(trkPhoneNumberRaw.val)),
                    Evt.merge(
                        webphoneCtx,
                        [
                            trkPhoneNumberRaw.evt,
                            webphone.trkIsSipRegistered.evt,
                            webphone.userSimEvts.evtReachabilityStatusChange,
                            webphone.userSimEvts.evtCellularConnectivityChange,
                            webphone.userSimEvts.evtOngoingCall
                        ]
                    )
                );

            },
            trkWebphone.evtDiff.pipe(
                ctx,
                ({ prevVal }) => [prevVal]
            )
        );

    }
    */
})(Webphone = exports.Webphone || (exports.Webphone = {}));

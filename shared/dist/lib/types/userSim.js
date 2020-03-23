"use strict";
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
var evt_1 = require("evt");
var id_1 = require("../../tools/typeSafety/id");
var assert_1 = require("../../tools/typeSafety/assert");
var UserSim;
(function (UserSim) {
    var Owned;
    (function (Owned) {
        function match(userSim) {
            return userSim.ownership.status === "OWNED";
        }
        Owned.match = match;
    })(Owned = UserSim.Owned || (UserSim.Owned = {}));
    var Shared;
    (function (Shared) {
        var Confirmed;
        (function (Confirmed) {
            function match(userSim) {
                return userSim.ownership.status === "SHARED CONFIRMED";
            }
            Confirmed.match = match;
        })(Confirmed = Shared.Confirmed || (Shared.Confirmed = {}));
        var NotConfirmed;
        (function (NotConfirmed) {
            function match(userSim) {
                return userSim.ownership.status === "SHARED NOT CONFIRMED";
            }
            NotConfirmed.match = match;
        })(NotConfirmed = Shared.NotConfirmed || (Shared.NotConfirmed = {}));
        function match(userSim) {
            return Confirmed.match(userSim) || NotConfirmed.match(userSim);
        }
        Shared.match = match;
    })(Shared = UserSim.Shared || (UserSim.Shared = {}));
    function assertIs(userSim) {
        var o = userSim;
        if (o instanceof Object &&
            o.sim instanceof Object &&
            typeof o.friendlyName === "string" &&
            typeof o.password === "string" &&
            typeof o.towardSimEncryptKeyStr === "string" &&
            o.dongle instanceof Object &&
            o.gatewayLocation instanceof Object &&
            o.ownership instanceof Object &&
            o.phonebook instanceof Array &&
            (o.reachableSimState === undefined ||
                o.reachableSimState instanceof Object)) {
            return;
        }
        throw new Error("Not a UserSim");
    }
    UserSim.assertIs = assertIs;
    var Evts;
    (function (Evts) {
        var ForSpecificSim;
        (function (ForSpecificSim) {
            var buildForSpecificSim = buildEvtsForSpecificSimFactory(function () { return ({
                "evtNowConfirmed": new evt_1.VoidEvt(),
                "evtDelete": new evt_1.Evt(),
                "evtReachabilityStatusChange": new evt_1.VoidEvt(),
                "evtSipPasswordRenewed": new evt_1.VoidEvt(),
                "evtCellularConnectivityChange": new evt_1.VoidEvt(),
                "evtCellularSignalStrengthChange": new evt_1.VoidEvt(),
                "evtOngoingCall": new evt_1.VoidEvt(),
                "evtNewUpdatedOrDeletedContact": new evt_1.Evt(),
                "evtSharedUserSetChange": new evt_1.Evt(),
                "evtFriendlyNameChange": new evt_1.VoidEvt()
            }); });
            function build(userSimEvts, userSim, keys) {
                return buildForSpecificSim(userSimEvts, userSim, keys);
            }
            ForSpecificSim.build = build;
        })(ForSpecificSim = Evts.ForSpecificSim || (Evts.ForSpecificSim = {}));
    })(Evts = UserSim.Evts || (UserSim.Evts = {}));
    ;
    var Usable;
    (function (Usable) {
        function match(userSim) {
            return Owned.match(userSim) || Shared.Confirmed.match(userSim);
        }
        Usable.match = match;
        var Evts;
        (function (Evts) {
            function build(params) {
                var userSims = params.userSims.filter(Usable.match);
                var userSimEvts = {
                    "evtNew": new evt_1.Evt(),
                    "evtDelete": new evt_1.Evt(),
                    "evtReachabilityStatusChange": new evt_1.Evt(),
                    "evtSipPasswordRenewed": new evt_1.Evt(),
                    "evtCellularConnectivityChange": new evt_1.Evt(),
                    "evtCellularSignalStrengthChange": new evt_1.Evt(),
                    "evtOngoingCall": new evt_1.Evt(),
                    "evtNewUpdatedOrDeletedContact": new evt_1.Evt(),
                    "evtSharedUserSetChange": new evt_1.Evt(),
                    "evtFriendlyNameChange": new evt_1.Evt()
                };
                var ctx = evt_1.Evt.newCtx();
                params.userSimEvts.evtNew.attach(ctx, function (eventData) {
                    if (eventData.cause === "SHARING REQUEST RECEIVED") {
                        return;
                    }
                    userSims.push(eventData.userSim);
                    userSimEvts.evtNew.post(eventData);
                });
                params.userSimEvts.evtNowConfirmed.attach(ctx, function (userSim) {
                    userSims.push(userSim);
                    userSimEvts.evtNew.post({
                        "cause": "SHARED SIM CONFIRMED",
                        userSim: userSim
                    });
                });
                params.userSimEvts.evtDelete.attach(ctx, function (eventData) {
                    var newEventData;
                    switch (eventData.cause) {
                        case "REJECT SHARING REQUEST":
                            return;
                        case "PERMISSION LOSS":
                            if (Shared.NotConfirmed.match(eventData.userSim)) {
                                return;
                            }
                            newEventData = {
                                "cause": eventData.cause,
                                "userSim": eventData.userSim
                            };
                            break;
                        case "USER UNREGISTER SIM":
                            newEventData = eventData;
                            break;
                    }
                    userSims.splice(userSims.indexOf(newEventData.userSim), 1);
                    userSimEvts.evtDelete.post(newEventData);
                });
                Object.keys(userSimEvts).forEach(function (eventName) {
                    var srcEvt = id_1.id(params.userSimEvts[eventName]);
                    if (!!srcEvt.getHandlers().find(function (handler) { return handler.ctx === ctx; })) {
                        return;
                    }
                    srcEvt.attach(function (eventData) {
                        var _a;
                        {
                            var userSim = (_a = eventData.userSim) !== null && _a !== void 0 ? _a : eventData;
                            UserSim.assertIs(userSim);
                            if (!Usable.match(userSim)) {
                                return;
                            }
                        }
                        userSimEvts[eventName].post(eventData);
                    });
                });
                return { userSims: userSims, userSimEvts: userSimEvts };
            }
            Evts.build = build;
            var ForSpecificSim;
            (function (ForSpecificSim) {
                /** NOTE: Hack on the types here to avoid copy pasting */
                var buildForSpecificSim = buildEvtsForSpecificSimFactory(function () { return id_1.id({
                    "evtDelete": new evt_1.Evt(),
                    "evtReachabilityStatusChange": new evt_1.VoidEvt(),
                    "evtSipPasswordRenewed": new evt_1.VoidEvt(),
                    "evtCellularConnectivityChange": new evt_1.VoidEvt(),
                    "evtCellularSignalStrengthChange": new evt_1.VoidEvt(),
                    "evtOngoingCall": new evt_1.VoidEvt(),
                    "evtNewUpdatedOrDeletedContact": new evt_1.Evt(),
                    "evtSharedUserSetChange": new evt_1.Evt(),
                    "evtFriendlyNameChange": new evt_1.VoidEvt()
                }); });
                function build(userSimEvts, userSim, keys) {
                    return buildForSpecificSim(userSimEvts, userSim, keys);
                }
                ForSpecificSim.build = build;
            })(ForSpecificSim = Evts.ForSpecificSim || (Evts.ForSpecificSim = {}));
        })(Evts = Usable.Evts || (Usable.Evts = {}));
        ;
    })(Usable = UserSim.Usable || (UserSim.Usable = {}));
})(UserSim = exports.UserSim || (exports.UserSim = {}));
//NOTE: Should work as well with the types restricted to usable userSim ( we avoid copy past )
//type UserSim_= UserSim.Usable;
//type Evts_ = UserSim.Usable.Evts;
//type EvtsForSpecificSim_ = UserSim.Usable.Evts.ForSpecificSim;
function buildEvtsForSpecificSimFactory(createNewInstance) {
    return function buildForSpecificSim(userSimEvts, userSim, keys) {
        var out = (function () {
            var out = createNewInstance();
            if (keys === undefined) {
                return out;
            }
            Object.keys(out)
                .filter(function (eventName) { return id_1.id(keys).indexOf(eventName) < 0; })
                .forEach(function (eventName) { return delete out[eventName]; });
            return out;
        })();
        Object.keys(out).forEach(function (eventName) {
            var evt = out[eventName];
            id_1.id(userSimEvts[eventName]).attach(evt instanceof evt_1.VoidEvt ? (function (eventData) {
                if (eventData !== userSim) {
                    return;
                }
                evt.post();
            }) : (function (eventData) {
                assert_1.assert(eventData instanceof Object);
                var userSim_ = eventData.userSim, rest = __rest(eventData, ["userSim"]);
                UserSim.assertIs(userSim_);
                if (userSim_ !== userSim) {
                    return;
                }
                evt.post(rest);
            }));
        });
        return out;
    };
}
//NOTE: Just to validate when we switch types to Usable
(function () {
    var buildForSpecificSim = null;
    function build(userSimEvts, userSim, keys) {
        return buildForSpecificSim(userSimEvts, userSim, keys);
    }
    build;
})();

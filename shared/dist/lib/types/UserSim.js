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
var typeGuard_1 = require("../../tools/typeSafety/typeGuard");
var objectKeys_1 = require("../../tools/typeSafety/objectKeys");
var exclude_1 = require("../../tools/typeSafety/exclude");
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
    function match(o) {
        return (typeGuard_1.typeGuard(o) &&
            !!o &&
            o instanceof Object &&
            o.sim instanceof Object &&
            typeof o.friendlyName === "string" &&
            typeof o.password === "string" &&
            typeof o.towardSimEncryptKeyStr === "string" &&
            o.dongle instanceof Object &&
            o.gatewayLocation instanceof Object &&
            o.ownership instanceof Object &&
            o.phonebook instanceof Array &&
            (o.reachableSimState === undefined ||
                o.reachableSimState instanceof Object));
    }
    UserSim.match = match;
    var Evts;
    (function (Evts) {
        var ForSpecificSim;
        (function (ForSpecificSim) {
            var buildForSpecificSim = buildEvtsForSpecificSimFactory({
                "createNewInstance": function () { return ({
                    "evtNowConfirmed": evt_1.Evt.create(),
                    "evtDelete": new evt_1.Evt(),
                    "evtReachabilityStatusChange": evt_1.Evt.create(),
                    "evtSipPasswordRenewed": evt_1.Evt.create(),
                    "evtCellularConnectivityChange": evt_1.Evt.create(),
                    "evtCellularSignalStrengthChange": evt_1.Evt.create(),
                    "evtOngoingCall": evt_1.Evt.create(),
                    "evtNewUpdatedOrDeletedContact": new evt_1.Evt(),
                    "evtSharedUserSetChange": new evt_1.Evt(),
                    "evtFriendlyNameChange": evt_1.Evt.create()
                }); }
            });
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
                    "evtNew": evt_1.Evt.merge([
                        params.userSimEvts.evtNew
                            .pipe(function (data) { return data.cause === "SHARING REQUEST RECEIVED" ? null : [data]; }),
                        params.userSimEvts.evtNowConfirmed
                            .pipe(function (userSim) { return [{ "cause": "SHARED SIM CONFIRMED", userSim: userSim }]; })
                    ]).pipe(function (_a) {
                        var userSim = _a.userSim;
                        userSims.push(userSim);
                        return true;
                    }),
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
                objectKeys_1.objectKeys(userSimEvts)
                    .filter(exclude_1.exclude("evtNew"))
                    .forEach(function (eventName) {
                    return evt_1.Evt.factorize(params.userSimEvts[eventName])
                        .attach(function (eventData) { return Usable.match("userSim" in eventData ?
                        eventData.userSim : eventData); }, function (eventData) { return evt_1.Evt.factorize(userSimEvts[eventName])
                        .post(eventData); });
                });
                userSimEvts.evtDelete = userSimEvts.evtDelete
                    .pipe(function (_a) {
                    var userSim = _a.userSim;
                    userSims.splice(userSims.indexOf(userSim), 1);
                    return true;
                });
                return { userSims: userSims, userSimEvts: userSimEvts };
            }
            Evts.build = build;
            var ForSpecificSim;
            (function (ForSpecificSim) {
                /** NOTE: Hack on the types here to avoid copy pasting */
                var buildForSpecificSim = buildEvtsForSpecificSimFactory({
                    "createNewInstance": function () { return id_1.id({
                        "evtDelete": new evt_1.Evt(),
                        "evtReachabilityStatusChange": evt_1.Evt.create(),
                        "evtSipPasswordRenewed": evt_1.Evt.create(),
                        "evtCellularConnectivityChange": evt_1.Evt.create(),
                        "evtCellularSignalStrengthChange": evt_1.Evt.create(),
                        "evtOngoingCall": evt_1.Evt.create(),
                        "evtNewUpdatedOrDeletedContact": new evt_1.Evt(),
                        "evtSharedUserSetChange": new evt_1.Evt(),
                        "evtFriendlyNameChange": evt_1.Evt.create()
                    }); }
                });
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
function buildEvtsForSpecificSimFactory(params) {
    var createNewInstance = params.createNewInstance;
    return function buildForSpecificSim(userSimEvts, userSim, keys) {
        var out = (function () {
            var out = createNewInstance();
            if (keys === undefined) {
                return out;
            }
            objectKeys_1.objectKeys(out)
                .filter(function (eventName) { return id_1.id(keys).indexOf(eventName) < 0; })
                .forEach(function (eventName) { return delete out[eventName]; });
            return out;
        })();
        objectKeys_1.objectKeys(out).forEach(function (eventName) {
            var evt = evt_1.Evt.factorize(out[eventName]);
            evt_1.Evt.factorize(userSimEvts[eventName]).attach(function (data) {
                if (UserSim.match(data)) {
                    if (data !== userSim) {
                        return;
                    }
                    assert_1.assert(typeGuard_1.typeGuard(evt));
                    evt.post();
                    return;
                }
                else {
                    var _a = id_1.id(data), userSim_ = _a.userSim, rest = __rest(_a, ["userSim"]);
                    assert_1.assert(UserSim.match(userSim_));
                    if (userSim_ !== userSim) {
                        return;
                    }
                    evt.post(rest);
                }
            });
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

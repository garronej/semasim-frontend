"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
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
var __spread = (this && this.__spread) || function () {
    for (var ar = [], i = 0; i < arguments.length; i++) ar = ar.concat(__read(arguments[i]));
    return ar;
};
Object.defineProperty(exports, "__esModule", { value: true });
var apiDeclaration = require("../../../sip_api_declarations/backendToUa");
var types = require("../../types");
var evt_1 = require("evt");
var assert_1 = require("../../../tools/typeSafety/assert");
var createObjectWithGivenRef_1 = require("../../../tools/createObjectWithGivenRef");
var id_1 = require("../../../tools/typeSafety/id");
var phone_number_1 = require("phone-number");
var _ = require("../../../tools/reducers");
function getCoreApi(sendRequest, remoteNotifyEvts, restartApp, userEmail) {
    var getUserSimEvts = getGetUserSimEvts({ remoteNotifyEvts: remoteNotifyEvts, restartApp: restartApp });
    return {
        "getUserSims": (function () {
            //TODO: This was before called as soon as the socket is was connected
            //make sure it is called early.
            var methodName = apiDeclaration.getUserSims.methodName;
            return function (_a) {
                var includeContacts = _a.includeContacts;
                return __awaiter(this, void 0, void 0, function () {
                    var userSims;
                    return __generator(this, function (_b) {
                        switch (_b.label) {
                            case 0: return [4 /*yield*/, sendRequest(methodName, { includeContacts: includeContacts })];
                            case 1:
                                userSims = _b.sent();
                                return [2 /*return*/, {
                                        userSims: userSims,
                                        "userSimEvts": getUserSimEvts(userSims)
                                    }];
                        }
                    });
                });
            };
        })(),
        "unlockSim": (function () {
            var methodName = apiDeclaration.unlockSim.methodName;
            return function (_a) {
                var lockedDongle = _a.lockedDongle, pin = _a.pin;
                return sendRequest(methodName, { "imei": lockedDongle.imei, pin: pin });
            };
        })(),
        "registerSim": (function () {
            var methodName = apiDeclaration.registerSim.methodName;
            return function (_a) {
                var dongle = _a.dongle, friendlyName = _a.friendlyName;
                return __awaiter(this, void 0, void 0, function () {
                    var imsi;
                    return __generator(this, function (_b) {
                        switch (_b.label) {
                            case 0:
                                imsi = dongle.sim.imsi;
                                return [4 /*yield*/, Promise.all([
                                        remoteNotifyEvts.evtUserSimChange.waitFor(function (eventData) { return (eventData.type === "NEW" &&
                                            types.UserSim.Owned.match(eventData.userSim) &&
                                            eventData.userSim.sim.imsi === imsi); }),
                                        sendRequest(methodName, {
                                            imsi: imsi,
                                            "imei": dongle.imei,
                                            friendlyName: friendlyName
                                        }),
                                    ])];
                            case 1:
                                _b.sent();
                                return [2 /*return*/];
                        }
                    });
                });
            };
        })(),
        "unregisterSim": (function () {
            var methodName = apiDeclaration.unregisterSim.methodName;
            return function (userSim) {
                return __awaiter(this, void 0, void 0, function () {
                    var imsi;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                imsi = userSim.sim.imsi;
                                return [4 /*yield*/, Promise.all([
                                        remoteNotifyEvts.evtUserSimChange.waitFor(function (eventData) { return (eventData.type === "DELETE" &&
                                            eventData.cause === "USER UNREGISTER SIM" &&
                                            eventData.imsi === imsi); }),
                                        sendRequest(methodName, { imsi: imsi })
                                    ])];
                            case 1:
                                _a.sent();
                                return [2 /*return*/];
                        }
                    });
                });
            };
        })(),
        /** Assert sim is reachable */
        "rebootDongle": (function () {
            var methodName = apiDeclaration.rebootDongle.methodName;
            return function (userSim) {
                assert_1.assert(!!userSim.reachableSimState);
                return sendRequest(methodName, { "imsi": userSim.sim.imsi });
            };
        })(),
        "shareSim": (function () {
            var methodName = apiDeclaration.shareSim.methodName;
            return function (_a) {
                var userSim = _a.userSim, emails = _a.emails, message = _a.message;
                return __awaiter(this, void 0, void 0, function () {
                    var imsi, sharedWith;
                    var _b;
                    return __generator(this, function (_c) {
                        switch (_c.label) {
                            case 0:
                                imsi = userSim.sim.imsi, sharedWith = userSim.ownership.sharedWith;
                                emails = (_b = emails
                                    .map(function (email) { return email.toLowerCase(); })
                                    .filter(function (email) { return email !== userEmail; })).reduce.apply(_b, __spread(_.removeDuplicates()));
                                if (emails.length === 0) {
                                    return [2 /*return*/];
                                }
                                return [4 /*yield*/, Promise.all(__spread(emails
                                        .filter(function (email) { return (sharedWith.notConfirmed.indexOf(email) < 0 &&
                                        sharedWith.confirmed.indexOf(email) < 0); })
                                        .map(function (email) { return remoteNotifyEvts.evtUserSimChange.waitFor(function (eventData) { return (eventData.type === "SHARED USER SET CHANGE" &&
                                        eventData.imsi === imsi &&
                                        eventData.action === "ADD" &&
                                        eventData.targetSet === "NOT CONFIRMED USERS" &&
                                        eventData.email === email); }); }), [
                                        sendRequest(methodName, { imsi: imsi, emails: emails, message: message })
                                    ]))];
                            case 1:
                                _c.sent();
                                return [2 /*return*/];
                        }
                    });
                });
            };
        })(),
        "stopSharingSim": (function () {
            var methodName = apiDeclaration.stopSharingSim.methodName;
            return function (_a) {
                var userSim = _a.userSim, emails = _a.emails;
                return __awaiter(this, void 0, void 0, function () {
                    var imsi, sharedWith;
                    var _b;
                    return __generator(this, function (_c) {
                        switch (_c.label) {
                            case 0:
                                imsi = userSim.sim.imsi, sharedWith = userSim.ownership.sharedWith;
                                emails = (_b = emails
                                    .map(function (email) { return email.toLowerCase(); })
                                    .filter(function (email) { return email !== userEmail; })).reduce.apply(_b, __spread(_.removeDuplicates()));
                                if (emails.length === 0) {
                                    return [2 /*return*/];
                                }
                                return [4 /*yield*/, Promise.all(__spread(emails
                                        .filter(function (email) { return (sharedWith.notConfirmed.indexOf(email) >= 0 &&
                                        sharedWith.confirmed.indexOf(email) >= 0); })
                                        .map(function (email) { return remoteNotifyEvts.evtUserSimChange.waitFor(function (eventData) { return (eventData.type === "SHARED USER SET CHANGE" &&
                                        eventData.imsi === imsi &&
                                        eventData.action === "REMOVE" &&
                                        eventData.email === email); }); }), [
                                        sendRequest(methodName, { imsi: imsi, emails: emails })
                                    ]))];
                            case 1:
                                _c.sent();
                                return [2 /*return*/];
                        }
                    });
                });
            };
        })(),
        "changeSimFriendlyName": (function () {
            var methodName = apiDeclaration.changeSimFriendlyName.methodName;
            return function (_a) {
                var userSim = _a.userSim, friendlyName = _a.friendlyName;
                return __awaiter(this, void 0, void 0, function () {
                    var imsi;
                    return __generator(this, function (_b) {
                        switch (_b.label) {
                            case 0:
                                imsi = userSim.sim.imsi;
                                return [4 /*yield*/, Promise.all([
                                        remoteNotifyEvts.evtUserSimChange.waitFor(function (eventData) { return (eventData.type === "FRIENDLY NAME CHANGE" &&
                                            eventData.imsi === imsi); }),
                                        sendRequest(methodName, { imsi: imsi, friendlyName: friendlyName })
                                    ])];
                            case 1:
                                _b.sent();
                                return [2 /*return*/];
                        }
                    });
                });
            };
        })(),
        "acceptSharingRequest": (function () {
            var methodName = apiDeclaration.acceptSharingRequest.methodName;
            return function (_a) {
                var notConfirmedUserSim = _a.notConfirmedUserSim, friendlyName = _a.friendlyName;
                return __awaiter(this, void 0, void 0, function () {
                    var imsi;
                    return __generator(this, function (_b) {
                        switch (_b.label) {
                            case 0:
                                imsi = notConfirmedUserSim.sim.imsi;
                                return [4 /*yield*/, Promise.all([
                                        remoteNotifyEvts.evtUserSimChange.waitFor(function (eventData) { return (eventData.type === "IS NOW CONFIRMED" &&
                                            eventData.imsi === imsi); }),
                                        sendRequest(methodName, { imsi: imsi, friendlyName: friendlyName })
                                    ])];
                            case 1:
                                _b.sent();
                                return [2 /*return*/];
                        }
                    });
                });
            };
        })(),
        "rejectSharingRequest": (function () {
            var methodName = apiDeclaration.rejectSharingRequest.methodName;
            return function (userSim) {
                return __awaiter(this, void 0, void 0, function () {
                    var imsi;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                imsi = userSim.sim.imsi;
                                return [4 /*yield*/, Promise.all([
                                        remoteNotifyEvts.evtUserSimChange.waitFor(function (eventData) { return (eventData.type === "DELETE" &&
                                            eventData.cause === "REJECT SHARING REQUEST" &&
                                            eventData.imsi === imsi); }),
                                        sendRequest(methodName, { imsi: imsi })
                                    ])];
                            case 1:
                                _a.sent();
                                return [2 /*return*/];
                        }
                    });
                });
            };
        })(),
        "createContact": (function () {
            var methodName = apiDeclaration.createContact.methodName;
            /** Assert there is not already a contact with this number in the phonebook */
            return function (_a) {
                var userSim = _a.userSim, name = _a.name, number_raw = _a.number_raw;
                return __awaiter(this, void 0, void 0, function () {
                    var isSameAsInput_1, imsi, contact;
                    return __generator(this, function (_b) {
                        switch (_b.label) {
                            case 0:
                                //NOTE: Test assertion
                                {
                                    isSameAsInput_1 = (function () {
                                        var _a;
                                        var formatedNumberInput = phone_number_1.phoneNumber.build(number_raw, (_a = userSim.sim.country) === null || _a === void 0 ? void 0 : _a.iso);
                                        return function (other_number_raw) { return phone_number_1.phoneNumber.areSame(formatedNumberInput, other_number_raw); };
                                    })();
                                    if (!!userSim.phonebook.find(function (_a) {
                                        var number_raw = _a.number_raw;
                                        return isSameAsInput_1(number_raw);
                                    })) {
                                        throw new Error("Already a contact with this number");
                                    }
                                }
                                imsi = userSim.sim.imsi;
                                return [4 /*yield*/, Promise.all([
                                        remoteNotifyEvts.evtUserSimChange.waitFor(function (eventData) { return (eventData.type === "CONTACT CREATED OR UPDATED" &&
                                            eventData.imsi === imsi &&
                                            eventData.number_raw === number_raw); }),
                                        sendRequest(methodName, { imsi: imsi, name: name, number_raw: number_raw })
                                    ])];
                            case 1:
                                _b.sent();
                                contact = userSim.phonebook
                                    .find(function (contact) { return contact.number_raw === number_raw; });
                                assert_1.assert(contact !== undefined);
                                return [2 /*return*/, contact];
                        }
                    });
                });
            };
        })(),
        "updateContactName": (function () {
            var methodName = apiDeclaration.updateContactName.methodName;
            return function (_a) {
                var userSim = _a.userSim, contact = _a.contact, newName = _a.newName;
                return __awaiter(this, void 0, void 0, function () {
                    var imsi, prDone;
                    return __generator(this, function (_b) {
                        switch (_b.label) {
                            case 0:
                                //NOTE: If formating is needed on newName apply it here.
                                newName = id_1.id(newName);
                                if (newName === contact.name) {
                                    return [2 /*return*/];
                                }
                                imsi = userSim.sim.imsi;
                                prDone = remoteNotifyEvts.evtUserSimChange.waitFor(function (eventData) { return (eventData.type === "CONTACT CREATED OR UPDATED" &&
                                    eventData.number_raw === contact.number_raw &&
                                    eventData.name === newName); });
                                if (!(contact.mem_index !== undefined)) return [3 /*break*/, 2];
                                return [4 /*yield*/, sendRequest(methodName, {
                                        imsi: imsi,
                                        "contactRef": { "mem_index": contact.mem_index },
                                        newName: newName
                                    })];
                            case 1:
                                _b.sent();
                                return [3 /*break*/, 4];
                            case 2: return [4 /*yield*/, sendRequest(methodName, {
                                    imsi: imsi,
                                    "contactRef": { "number": contact.number_raw },
                                    newName: newName
                                })];
                            case 3:
                                _b.sent();
                                _b.label = 4;
                            case 4: return [4 /*yield*/, prDone];
                            case 5:
                                _b.sent();
                                return [2 /*return*/];
                        }
                    });
                });
            };
        })(),
        "deleteContact": (function () {
            var methodName = apiDeclaration.deleteContact.methodName;
            return function (_a) {
                var userSim = _a.userSim, contact = _a.contact;
                return __awaiter(this, void 0, void 0, function () {
                    var imsi;
                    return __generator(this, function (_b) {
                        switch (_b.label) {
                            case 0:
                                imsi = userSim.sim.imsi;
                                return [4 /*yield*/, Promise.all([
                                        remoteNotifyEvts.evtUserSimChange.waitFor(function (eventData) { return (eventData.type === "CONTACT DELETED" &&
                                            eventData.imsi === imsi &&
                                            eventData.number_raw === contact.number_raw); }),
                                        sendRequest(methodName, {
                                            imsi: imsi,
                                            "contactRef": contact.mem_index === null ?
                                                ({ "mem_index": contact.mem_index }) :
                                                ({ "number": contact.number_raw })
                                        })
                                    ])];
                            case 1:
                                _b.sent();
                                return [2 /*return*/];
                        }
                    });
                });
            };
        })(),
        "shouldAppendPromotionalMessage": (function () {
            var methodName = apiDeclaration.shouldAppendPromotionalMessage.methodName;
            var cachedResponse = undefined;
            return function () {
                if (cachedResponse !== undefined) {
                    return cachedResponse;
                }
                return sendRequest(methodName, undefined).then(function (response) { return cachedResponse = response; });
            };
        })()
    };
}
exports.getCoreApi = getCoreApi;
function getGetUserSimEvts(params) {
    var remoteNotifyEvts = params.remoteNotifyEvts, restartApp = params.restartApp;
    return function getUserSimChangEvts(userSims) {
        var out = {
            "evtNew": new evt_1.Evt(),
            "evtNowConfirmed": new evt_1.Evt(),
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
        var findUserSim = function (imsi) {
            var userSim = userSims.find(function (_a) {
                var sim = _a.sim;
                return sim.imsi === imsi;
            });
            assert_1.assert(userSim !== undefined);
            return userSim;
        };
        remoteNotifyEvts.evtUserSimChange.attach(function (eventData) {
            switch (eventData.type) {
                case "NEW":
                    {
                        var userSim_1 = eventData.userSim;
                        userSims.push(userSim_1);
                        out.evtNew.post((function () {
                            if (types.UserSim.Owned.match(userSim_1)) {
                                return {
                                    "cause": "SIM REGISTERED FROM LAN",
                                    userSim: userSim_1
                                };
                            }
                            if (types.UserSim.Shared.NotConfirmed.match(userSim_1)) {
                                return {
                                    "cause": "SHARING REQUEST RECEIVED",
                                    userSim: userSim_1
                                };
                            }
                            throw new Error("never");
                        })());
                    }
                    return;
                case "IS NOW CONFIRMED":
                    {
                        var notConfirmedUserSim = findUserSim(eventData.imsi);
                        assert_1.assert(types.UserSim.Shared.NotConfirmed.match(notConfirmedUserSim));
                        out.evtNowConfirmed.post(createObjectWithGivenRef_1.createObjectWithGivenRef(notConfirmedUserSim, id_1.id(__assign(__assign({}, notConfirmedUserSim), { "friendlyName": eventData.friendlyName, "ownership": {
                                "status": "SHARED CONFIRMED",
                                "ownerEmail": notConfirmedUserSim.ownership.ownerEmail,
                                "otherUserEmails": notConfirmedUserSim.ownership.otherUserEmails
                            } }))));
                    }
                    return;
                case "DELETE":
                    {
                        var userSim_2 = findUserSim(eventData.imsi);
                        userSims.splice(userSims.indexOf(userSim_2), 1);
                        out.evtDelete.post((function () {
                            var cause = eventData.cause;
                            switch (cause) {
                                case "USER UNREGISTER SIM":
                                    assert_1.assert(types.UserSim.Usable.match(userSim_2));
                                    return { cause: cause, userSim: userSim_2 };
                                case "PERMISSION LOSS":
                                    assert_1.assert(types.UserSim.Shared.match(userSim_2));
                                    return { cause: cause, userSim: userSim_2 };
                                case "REJECT SHARING REQUEST":
                                    assert_1.assert(types.UserSim.Shared.NotConfirmed.match(userSim_2));
                                    return { cause: cause, userSim: userSim_2 };
                            }
                        })());
                    }
                    return;
                case "IS NOW UNREACHABLE":
                    {
                        var userSim = findUserSim(eventData.imsi);
                        var hadOngoingCall = (userSim.reachableSimState !== undefined &&
                            userSim.reachableSimState.isGsmConnectivityOk &&
                            userSim.reachableSimState.ongoingCall !== undefined);
                        userSim.reachableSimState = undefined;
                        if (hadOngoingCall) {
                            out.evtOngoingCall.post(userSim);
                        }
                        out.evtReachabilityStatusChange.post(userSim);
                    }
                    return;
                case "IS NOW REACHABLE":
                    {
                        var userSim = findUserSim(eventData.imsi);
                        var hasInternalSimStorageChanged = eventData.hasInternalSimStorageChanged, isGsmConnectivityOk = eventData.isGsmConnectivityOk, cellSignalStrength = eventData.cellSignalStrength, password = eventData.password, simDongle = eventData.simDongle, gatewayLocation = eventData.gatewayLocation;
                        if (hasInternalSimStorageChanged) {
                            //NOTE: RestartApp should not be used here but we do not refactor 
                            //as this is a hack to avoid having to write code for very unusual events.
                            restartApp("Sim internal storage has changed ( notifySimOnline )");
                            return;
                        }
                        //NOTE: True when password changed for example.
                        var wasAlreadyReachable = userSim.reachableSimState !== undefined;
                        userSim.reachableSimState = isGsmConnectivityOk ?
                            ({ "isGsmConnectivityOk": true, cellSignalStrength: cellSignalStrength, "ongoingCall": undefined }) :
                            ({ "isGsmConnectivityOk": false, cellSignalStrength: cellSignalStrength });
                        var hasPasswordChanged = userSim.password !== password;
                        userSim.password = password;
                        userSim.dongle = simDongle;
                        userSim.gatewayLocation = gatewayLocation;
                        if (wasAlreadyReachable && hasPasswordChanged) {
                            out.evtSipPasswordRenewed.post(userSim);
                            return;
                        }
                        if (wasAlreadyReachable) {
                            return;
                        }
                        out.evtReachabilityStatusChange.post(userSim);
                    }
                    return;
                case "CELLULAR CONNECTIVITY CHANGE":
                    {
                        var userSim = findUserSim(eventData.imsi);
                        var reachableSimState = userSim.reachableSimState;
                        assert_1.assert(reachableSimState !== undefined);
                        assert_1.assert(eventData.isGsmConnectivityOk !== reachableSimState.isGsmConnectivityOk);
                        if (reachableSimState.isGsmConnectivityOk) {
                            var hadOngoingCall = false;
                            if (reachableSimState.ongoingCall !== undefined) {
                                delete reachableSimState.ongoingCall;
                                hadOngoingCall = true;
                            }
                            reachableSimState.isGsmConnectivityOk = false;
                            if (hadOngoingCall) {
                                out.evtOngoingCall.post(userSim);
                            }
                        }
                        else {
                            reachableSimState.isGsmConnectivityOk = true;
                        }
                        out.evtCellularConnectivityChange.post(userSim);
                    }
                    return;
                case "CELLULAR SIGNAL STRENGTH CHANGE":
                    {
                        var userSim = findUserSim(eventData.imsi);
                        assert_1.assert(userSim.reachableSimState !== undefined, "sim should be reachable");
                        userSim.reachableSimState.cellSignalStrength = eventData.cellSignalStrength;
                        out.evtCellularSignalStrengthChange.post(userSim);
                    }
                    return;
                case "ONGOING CALL":
                    {
                        var userSim = findUserSim(eventData.imsi);
                        if (eventData.isTerminated) {
                            var ongoingCallId = eventData.ongoingCallId;
                            var reachableSimState = userSim.reachableSimState;
                            if (!reachableSimState) {
                                //NOTE: The event would have been posted in setSimOffline handler.
                                return;
                            }
                            if (!reachableSimState.isGsmConnectivityOk) {
                                //NOTE: If we have had event notifying connectivity lost
                                //before this event the evtOngoingCall will have been posted
                                //in notifyGsmConnectivityChange handler function.
                                return;
                            }
                            if (reachableSimState.ongoingCall === undefined ||
                                reachableSimState.ongoingCall.ongoingCallId !== ongoingCallId) {
                                return;
                            }
                            reachableSimState.ongoingCall = undefined;
                        }
                        else {
                            var ongoingCall = eventData.ongoingCall;
                            var reachableSimState = userSim.reachableSimState;
                            assert_1.assert(reachableSimState !== undefined);
                            assert_1.assert(reachableSimState.isGsmConnectivityOk);
                            if (reachableSimState.ongoingCall === undefined) {
                                reachableSimState.ongoingCall = ongoingCall;
                            }
                            else if (reachableSimState.ongoingCall.ongoingCallId !== ongoingCall.ongoingCallId) {
                                reachableSimState.ongoingCall === undefined;
                                out.evtOngoingCall.post(userSim);
                                reachableSimState.ongoingCall = ongoingCall;
                            }
                            else {
                                var ongoingCallId = ongoingCall.ongoingCallId, from = ongoingCall.from, number = ongoingCall.number, isUserInCall = ongoingCall.isUserInCall, otherUserInCallEmails = ongoingCall.otherUserInCallEmails;
                                var prevOngoingCall_1 = reachableSimState.ongoingCall;
                                Object.assign(prevOngoingCall_1, { ongoingCallId: ongoingCallId, from: from, number: number, isUserInCall: isUserInCall });
                                prevOngoingCall_1.otherUserInCallEmails.splice(0, prevOngoingCall_1.otherUserInCallEmails.length);
                                otherUserInCallEmails.forEach(function (email) { return prevOngoingCall_1.otherUserInCallEmails.push(email); });
                            }
                        }
                        out.evtOngoingCall.post(userSim);
                    }
                    return;
                case "CONTACT CREATED OR UPDATED":
                    {
                        var userSim = findUserSim(eventData.imsi);
                        var storage_1 = eventData.storage, number_raw_1 = eventData.number_raw, name_1 = eventData.name;
                        var contact = userSim.phonebook.find(function (contact) {
                            if (storage_1 !== undefined) {
                                return contact.mem_index === storage_1.mem_index;
                            }
                            return contact.number_raw === number_raw_1;
                        });
                        var eventType = void 0;
                        if (!!contact) {
                            eventType = "UPDATED";
                            contact.name = name_1;
                            if (!!storage_1) {
                                userSim.sim.storage.contacts
                                    .find(function (_a) {
                                    var index = _a.index;
                                    return index === storage_1.mem_index;
                                }).name =
                                    storage_1.name_as_stored;
                            }
                        }
                        else {
                            eventType = "NEW";
                            contact = { name: name_1, number_raw: number_raw_1 };
                            userSim.phonebook.push(contact);
                            if (!!storage_1) {
                                userSim.sim.storage.infos.storageLeft--;
                                contact.mem_index = storage_1.mem_index;
                                userSim.sim.storage.contacts.push({
                                    "index": contact.mem_index,
                                    name: name_1,
                                    "number": number_raw_1
                                });
                            }
                        }
                        if (!!storage_1) {
                            userSim.sim.storage.digest = storage_1.new_digest;
                        }
                        out.evtNewUpdatedOrDeletedContact.post({ eventType: eventType, contact: contact, userSim: userSim });
                    }
                    return;
                case "CONTACT DELETED":
                    {
                        var userSim = findUserSim(eventData.imsi);
                        var number_raw = eventData.number_raw, storage_2 = eventData.storage;
                        var contact = undefined;
                        for (var i = 0; i < userSim.phonebook.length; i++) {
                            contact = userSim.phonebook[i];
                            if (!!storage_2 ?
                                storage_2.mem_index === contact.mem_index :
                                contact.number_raw === number_raw) {
                                userSim.phonebook.splice(i, 1);
                                break;
                            }
                        }
                        assert_1.assert(contact !== undefined);
                        if (!!storage_2) {
                            userSim.sim.storage.digest = storage_2.new_digest;
                            userSim.sim.storage.infos.storageLeft--;
                            userSim.sim.storage.contacts.splice(userSim.sim.storage.contacts.indexOf(userSim.sim.storage.contacts.find(function (_a) {
                                var index = _a.index;
                                return index === storage_2.mem_index;
                            })), 1);
                        }
                        out.evtNewUpdatedOrDeletedContact.post({ "eventType": "DELETED", userSim: userSim, contact: contact });
                    }
                    return;
                case "SHARED USER SET CHANGE":
                    {
                        var userSim_3 = findUserSim(eventData.imsi);
                        var doChange = function (action, targetSet) {
                            var emails = (function (ownership) {
                                return ownership.status === "OWNED" ? (ownership.sharedWith[(function () {
                                    switch (targetSet) {
                                        case "CONFIRMED USERS": return "confirmed";
                                        case "NOT CONFIRMED USERS": return "notConfirmed";
                                    }
                                })()]) : (targetSet === "NOT CONFIRMED USERS" ?
                                    null :
                                    ownership.otherUserEmails);
                            })(userSim_3.ownership);
                            switch (action) {
                                case "ADD":
                                    emails === null || emails === void 0 ? void 0 : emails.push(eventData.email);
                                    break;
                                case "REMOVE":
                                    if (emails === null) {
                                        break;
                                    }
                                    emails.splice(emails.indexOf(eventData.email), 1);
                                    break;
                            }
                        };
                        if (eventData.action === "MOVE TO CONFIRMED") {
                            doChange("REMOVE", "NOT CONFIRMED USERS");
                            doChange("ADD", "CONFIRMED USERS");
                        }
                        else {
                            doChange(eventData.action, eventData.targetSet);
                        }
                        out.evtSharedUserSetChange.post(__assign(__assign({}, (function () {
                            var imsi = eventData.imsi, type = eventData.type, out = __rest(eventData, ["imsi", "type"]);
                            return out;
                        })()), { userSim: userSim_3 }));
                    }
                    return;
                case "FRIENDLY NAME CHANGE":
                    {
                        var userSim = findUserSim(eventData.imsi);
                        assert_1.assert(types.UserSim.Usable.match(userSim));
                        userSim.friendlyName = eventData.friendlyName;
                        out.evtFriendlyNameChange.post(userSim);
                    }
                    return;
            }
            throw new Error("never");
        });
        return out;
    };
}

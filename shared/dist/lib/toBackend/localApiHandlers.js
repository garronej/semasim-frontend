"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
var apiDeclaration = require("../../sip_api_declarations/uaToBackend");
var ts_events_extended_1 = require("ts-events-extended");
var dcTypes = require("chan-dongle-extended-client/dist/lib/types");
var appEvts_1 = require("./appEvts");
var restartApp_1 = require("../restartApp");
exports.handlers = {};
//NOTE: To avoid require cycles.
var getUsableUserSims = function () { return require("./remoteApiCaller").core.getUsableUserSims(); };
var getUsableUserSim = function (imsi) { return getUsableUserSims().then(function (userSims) { return userSims.find(function (_a) {
    var sim = _a.sim;
    return sim.imsi === imsi;
}); }); };
{
    var methodName = apiDeclaration.notifySimOffline.methodName;
    var handler = {
        "handler": function (_a) {
            var imsi = _a.imsi;
            return __awaiter(void 0, void 0, void 0, function () {
                var userSim, hadOngoingCall;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0: return [4 /*yield*/, getUsableUserSim(imsi)];
                        case 1:
                            userSim = _b.sent();
                            hadOngoingCall = (userSim.reachableSimState !== undefined &&
                                userSim.reachableSimState.isGsmConnectivityOk &&
                                userSim.reachableSimState.ongoingCall !== undefined);
                            userSim.reachableSimState = undefined;
                            if (hadOngoingCall) {
                                appEvts_1.appEvts.evtOngoingCall.post(userSim);
                            }
                            appEvts_1.appEvts.evtSimReachabilityStatusChange.post(userSim);
                            return [2 /*return*/, undefined];
                    }
                });
            });
        }
    };
    exports.handlers[methodName] = handler;
}
/**
 * Posted when a Dongle with an unlocked SIM goes online.
 * Used so we can display a loading between the moment
 * when the card have been unlocked and the card is ready
 * to use.
 */
var evtUsableDongle = new ts_events_extended_1.SyncEvent();
{
    var methodName = apiDeclaration.notifySimOnline.methodName;
    var handler = {
        "handler": function (_a) {
            var imsi = _a.imsi, hasInternalSimStorageChanged = _a.hasInternalSimStorageChanged, password = _a.password, simDongle = _a.simDongle, gatewayLocation = _a.gatewayLocation, isGsmConnectivityOk = _a.isGsmConnectivityOk, cellSignalStrength = _a.cellSignalStrength;
            return __awaiter(void 0, void 0, void 0, function () {
                var userSim, wasAlreadyReachable, hasPasswordChanged;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            evtUsableDongle.post({ "imei": simDongle.imei });
                            return [4 /*yield*/, getUsableUserSim(imsi)];
                        case 1:
                            userSim = _b.sent();
                            if (hasInternalSimStorageChanged) {
                                //NOTE: RestartApp should not be used here but we do not refactor 
                                //as this is a hack to avoid having to write code for very unusual events.
                                return [2 /*return*/, restartApp_1.restartApp("Sim internal storage has changed ( notifySimOnline )")];
                            }
                            wasAlreadyReachable = userSim.reachableSimState !== undefined;
                            userSim.reachableSimState = isGsmConnectivityOk ?
                                ({ "isGsmConnectivityOk": true, cellSignalStrength: cellSignalStrength, "ongoingCall": undefined }) :
                                ({ "isGsmConnectivityOk": false, cellSignalStrength: cellSignalStrength });
                            hasPasswordChanged = userSim.password !== password;
                            userSim.password = password;
                            userSim.dongle = simDongle;
                            userSim.gatewayLocation = gatewayLocation;
                            if (wasAlreadyReachable && hasPasswordChanged) {
                                appEvts_1.appEvts.evtSimPasswordChanged.post(userSim);
                                return [2 /*return*/, undefined];
                            }
                            if (wasAlreadyReachable) {
                                return [2 /*return*/, undefined];
                            }
                            appEvts_1.appEvts.evtSimReachabilityStatusChange.post(userSim);
                            return [2 /*return*/, undefined];
                    }
                });
            });
        }
    };
    exports.handlers[methodName] = handler;
}
{
    var methodName = apiDeclaration.notifyGsmConnectivityChange.methodName;
    var handler = {
        "handler": function (_a) {
            var imsi = _a.imsi, isGsmConnectivityOk = _a.isGsmConnectivityOk;
            return __awaiter(void 0, void 0, void 0, function () {
                var userSim, reachableSimState, hadOngoingCall;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0: return [4 /*yield*/, getUsableUserSim(imsi)];
                        case 1:
                            userSim = _b.sent();
                            reachableSimState = userSim.reachableSimState;
                            if (reachableSimState === undefined) {
                                throw new Error("assert");
                            }
                            if (isGsmConnectivityOk === reachableSimState.isGsmConnectivityOk) {
                                throw new Error("assert");
                            }
                            if (reachableSimState.isGsmConnectivityOk) {
                                hadOngoingCall = false;
                                if (reachableSimState.ongoingCall !== undefined) {
                                    delete reachableSimState.ongoingCall;
                                    hadOngoingCall = true;
                                }
                                reachableSimState.isGsmConnectivityOk = false;
                                if (hadOngoingCall) {
                                    appEvts_1.appEvts.evtOngoingCall.post(userSim);
                                }
                            }
                            else {
                                reachableSimState.isGsmConnectivityOk = true;
                            }
                            appEvts_1.appEvts.evtSimGsmConnectivityChange.post(userSim);
                            return [2 /*return*/, undefined];
                    }
                });
            });
        }
    };
    exports.handlers[methodName] = handler;
}
{
    var methodName = apiDeclaration.notifyCellSignalStrengthChange.methodName;
    var handler = {
        "handler": function (_a) {
            var imsi = _a.imsi, cellSignalStrength = _a.cellSignalStrength;
            return __awaiter(void 0, void 0, void 0, function () {
                var userSim;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0: return [4 /*yield*/, getUsableUserSim(imsi)];
                        case 1:
                            userSim = _b.sent();
                            if (userSim.reachableSimState === undefined) {
                                throw new Error("Sim should be reachable");
                            }
                            userSim.reachableSimState.cellSignalStrength = cellSignalStrength;
                            appEvts_1.appEvts.evtSimCellSignalStrengthChange.post(userSim);
                            return [2 /*return*/, undefined];
                    }
                });
            });
        }
    };
    exports.handlers[methodName] = handler;
}
{
    var methodName = apiDeclaration.notifyOngoingCall.methodName;
    var handler = {
        "handler": function (params) { return __awaiter(void 0, void 0, void 0, function () {
            var imsi, userSim, ongoingCallId, reachableSimState, ongoingCall, reachableSimState, ongoingCallId, from, number, isUserInCall, otherUserInCallEmails, prevOngoingCall_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        imsi = params.imsi;
                        return [4 /*yield*/, getUsableUserSim(imsi)];
                    case 1:
                        userSim = _a.sent();
                        if (params.isTerminated) {
                            ongoingCallId = params.ongoingCallId;
                            reachableSimState = userSim.reachableSimState;
                            if (!reachableSimState) {
                                //NOTE: The event would have been posted in setSimOffline handler.
                                return [2 /*return*/];
                            }
                            if (!reachableSimState.isGsmConnectivityOk) {
                                //NOTE: If we have had event notifying connectivity lost
                                //before this event the evtOngoingCall will have been posted
                                //in notifyGsmConnectivityChange handler function.
                                return [2 /*return*/];
                            }
                            if (reachableSimState.ongoingCall === undefined ||
                                reachableSimState.ongoingCall.ongoingCallId !== ongoingCallId) {
                                return [2 /*return*/];
                            }
                            reachableSimState.ongoingCall = undefined;
                        }
                        else {
                            ongoingCall = params.ongoingCall;
                            reachableSimState = userSim.reachableSimState;
                            if (reachableSimState === undefined) {
                                throw new Error("assert");
                            }
                            if (!reachableSimState.isGsmConnectivityOk) {
                                throw new Error("assert");
                            }
                            if (reachableSimState.ongoingCall === undefined) {
                                reachableSimState.ongoingCall = ongoingCall;
                            }
                            else if (reachableSimState.ongoingCall.ongoingCallId !== ongoingCall.ongoingCallId) {
                                reachableSimState.ongoingCall === undefined;
                                appEvts_1.appEvts.evtOngoingCall.post(userSim);
                                reachableSimState.ongoingCall = ongoingCall;
                            }
                            else {
                                ongoingCallId = ongoingCall.ongoingCallId, from = ongoingCall.from, number = ongoingCall.number, isUserInCall = ongoingCall.isUserInCall, otherUserInCallEmails = ongoingCall.otherUserInCallEmails;
                                prevOngoingCall_1 = reachableSimState.ongoingCall;
                                Object.assign(prevOngoingCall_1, { ongoingCallId: ongoingCallId, from: from, number: number, isUserInCall: isUserInCall });
                                prevOngoingCall_1.otherUserInCallEmails.splice(0, prevOngoingCall_1.otherUserInCallEmails.length);
                                otherUserInCallEmails.forEach(function (email) { return prevOngoingCall_1.otherUserInCallEmails.push(email); });
                            }
                        }
                        appEvts_1.appEvts.evtOngoingCall.post(userSim);
                        return [2 /*return*/, undefined];
                }
            });
        }); }
    };
    exports.handlers[methodName] = handler;
}
{
    var methodName = apiDeclaration.notifyContactCreatedOrUpdated.methodName;
    var handler = {
        "handler": function (_a) {
            var imsi = _a.imsi, name = _a.name, number_raw = _a.number_raw, storage = _a.storage;
            return __awaiter(void 0, void 0, void 0, function () {
                var userSim, contact;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0: return [4 /*yield*/, getUsableUserSim(imsi)];
                        case 1:
                            userSim = _b.sent();
                            contact = userSim.phonebook.find(function (contact) {
                                if (!!storage) {
                                    return contact.mem_index === storage.mem_index;
                                }
                                return contact.number_raw === number_raw;
                            });
                            if (!!contact) {
                                contact.name = name;
                                if (!!storage) {
                                    userSim.sim.storage.contacts
                                        .find(function (_a) {
                                        var index = _a.index;
                                        return index === storage.mem_index;
                                    }).name =
                                        storage.name_as_stored;
                                }
                            }
                            else {
                                contact = { name: name, number_raw: number_raw };
                                userSim.phonebook.push(contact);
                                if (!!storage) {
                                    userSim.sim.storage.infos.storageLeft--;
                                    contact.mem_index = storage.mem_index;
                                    userSim.sim.storage.contacts.push({
                                        "index": contact.mem_index,
                                        name: name,
                                        "number": number_raw
                                    });
                                }
                            }
                            if (!!storage) {
                                userSim.sim.storage.digest = storage.new_digest;
                            }
                            appEvts_1.appEvts.evtContactCreatedOrUpdated.post({ userSim: userSim, contact: contact });
                            return [2 /*return*/, undefined];
                    }
                });
            });
        }
    };
    exports.handlers[methodName] = handler;
}
{
    var methodName = apiDeclaration.notifyContactDeleted.methodName;
    var handler = {
        "handler": function (_a) {
            var imsi = _a.imsi, number_raw = _a.number_raw, storage = _a.storage;
            return __awaiter(void 0, void 0, void 0, function () {
                var userSim, contact, i;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0: return [4 /*yield*/, getUsableUserSim(imsi)];
                        case 1:
                            userSim = _b.sent();
                            for (i = 0; i < userSim.phonebook.length; i++) {
                                contact = userSim.phonebook[i];
                                if (!!storage ?
                                    storage.mem_index === contact.mem_index :
                                    contact.number_raw === number_raw) {
                                    userSim.phonebook.splice(i, 1);
                                    break;
                                }
                            }
                            if (!!storage) {
                                userSim.sim.storage.digest = storage.new_digest;
                                userSim.sim.storage.infos.storageLeft--;
                                userSim.sim.storage.contacts.splice(userSim.sim.storage.contacts.indexOf(userSim.sim.storage.contacts.find(function (_a) {
                                    var index = _a.index;
                                    return index === storage.mem_index;
                                })), 1);
                            }
                            appEvts_1.appEvts.evtContactDeleted.post({ userSim: userSim, "contact": contact });
                            return [2 /*return*/, undefined];
                    }
                });
            });
        }
    };
    exports.handlers[methodName] = handler;
}
{
    var methodName = apiDeclaration.notifyDongleOnLan.methodName;
    var handler = {
        "handler": function (dongle) { return __awaiter(void 0, void 0, void 0, function () {
            var data;
            return __generator(this, function (_a) {
                data = dcTypes.Dongle.Locked.match(dongle) ? ({
                    "type": "LOCKED",
                    dongle: dongle,
                    "prSimUnlocked": evtUsableDongle
                        .waitFor(function (_a) {
                        var imei = _a.imei;
                        return imei === dongle.imei;
                    })
                        .then(function () { return undefined; })
                }) : ({
                    "type": "USABLE",
                    dongle: dongle
                });
                if (data.type === "USABLE") {
                    evtUsableDongle.post({ "imei": dongle.imei });
                }
                appEvts_1.appEvts.evtDongleOnLan.post(data);
                return [2 /*return*/, undefined];
            });
        }); }
    };
    exports.handlers[methodName] = handler;
}
{
    var methodName = apiDeclaration.notifySimPermissionLost.methodName;
    var handler = {
        "handler": function (_a) {
            var imsi = _a.imsi;
            return __awaiter(void 0, void 0, void 0, function () {
                var userSims, userSim;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0: return [4 /*yield*/, getUsableUserSims()];
                        case 1:
                            userSims = _b.sent();
                            userSim = userSims.find(function (_a) {
                                var sim = _a.sim;
                                return sim.imsi === imsi;
                            });
                            userSims.splice(userSims.indexOf(userSim), 1);
                            appEvts_1.appEvts.evtSimPermissionLost.post(userSim);
                            return [2 /*return*/, undefined];
                    }
                });
            });
        }
    };
    exports.handlers[methodName] = handler;
}
{
    var methodName = apiDeclaration.notifySimSharingRequest.methodName;
    var handler = {
        "handler": function (params) {
            appEvts_1.appEvts.evtSimSharingRequest.post(params);
            return Promise.resolve(undefined);
        }
    };
    exports.handlers[methodName] = handler;
}
{
    var methodName = apiDeclaration.notifySharingRequestResponse.methodName;
    var handler = {
        "handler": function (_a) {
            var imsi = _a.imsi, email = _a.email, isAccepted = _a.isAccepted;
            return __awaiter(void 0, void 0, void 0, function () {
                var userSim;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0: return [4 /*yield*/, getUsableUserSim(imsi)];
                        case 1:
                            userSim = _b.sent();
                            switch (userSim.ownership.status) {
                                case "OWNED":
                                    userSim.ownership.sharedWith.notConfirmed.splice(userSim.ownership.sharedWith.notConfirmed.indexOf(email), 1);
                                    if (isAccepted) {
                                        userSim.ownership.sharedWith.confirmed.push(email);
                                    }
                                    break;
                                case "SHARED CONFIRMED":
                                    if (isAccepted) {
                                        userSim.ownership.otherUserEmails.push(email);
                                    }
                                    break;
                            }
                            appEvts_1.appEvts.evtSharingRequestResponse.post({
                                "userSim": userSim,
                                email: email,
                                isAccepted: isAccepted
                            });
                            return [2 /*return*/, undefined];
                    }
                });
            });
        }
    };
    exports.handlers[methodName] = handler;
}
{
    var methodName = apiDeclaration.notifyOtherSimUserUnregisteredSim.methodName;
    var handler = {
        "handler": function (_a) {
            var imsi = _a.imsi, email = _a.email;
            return __awaiter(void 0, void 0, void 0, function () {
                var userSim;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0: return [4 /*yield*/, getUsableUserSim(imsi)];
                        case 1:
                            userSim = _b.sent();
                            switch (userSim.ownership.status) {
                                case "OWNED":
                                    userSim.ownership.sharedWith.confirmed.splice(userSim.ownership.sharedWith.confirmed.indexOf(email), 1);
                                    break;
                                case "SHARED CONFIRMED":
                                    userSim.ownership.otherUserEmails.splice(userSim.ownership.otherUserEmails.indexOf(email), 1);
                                    break;
                            }
                            appEvts_1.appEvts.evtOtherSimUserUnregisteredSim.post({
                                "userSim": userSim,
                                email: email
                            });
                            return [2 /*return*/, undefined];
                    }
                });
            });
        }
    };
    exports.handlers[methodName] = handler;
}
{
    var methodName = apiDeclaration.notifyLoggedFromOtherTab.methodName;
    var handler = {
        "handler": function () {
            appEvts_1.appEvts.evtOpenElsewhere.post();
            return Promise.resolve(undefined);
        }
    };
    exports.handlers[methodName] = handler;
}
{
    var methodName = apiDeclaration.notifyIceServer.methodName;
    var handler = {
        "handler": function (params, fromSocket) {
            appEvts_1.appEvts.rtcIceEServer.evt.post({
                "rtcIceServer": params !== undefined ? params :
                    ({
                        "urls": [
                            "stun:stun1.l.google.com:19302",
                            "stun:stun2.l.google.com:19302",
                            "stun:stun3.l.google.com:19302",
                            "stun:stun4.l.google.com:19302"
                        ]
                    }),
                "socket": fromSocket
            });
            return Promise.resolve(undefined);
        }
    };
    exports.handlers[methodName] = handler;
}
{
    var methodName = apiDeclaration.wd_notifyActionFromOtherUa.methodName;
    var handler = {
        "handler": function (params) {
            appEvts_1.appEvts.evtWdActionFromOtherUa.post(params);
            return Promise.resolve(undefined);
        }
    };
    exports.handlers[methodName] = handler;
}

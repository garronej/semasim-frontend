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
var env_1 = require("../env");
var events_1 = require("./events");
//NOTE: Global JS deps.
var dialog_1 = require("../../tools/modal/dialog");
var restartApp_1 = require("../restartApp");
exports.handlers = {};
//NOTE: To avoid require cycles.
var getRemoteApiCaller = function () { return require("./remoteApiCaller"); };
var getUsableUserSim = function (imsi) { return getRemoteApiCaller()
    .getUsableUserSims()
    .then(function (userSims) { return userSims.find(function (_a) {
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
                                events_1.evtOngoingCall.post(userSim);
                            }
                            events_1.evtSimReachabilityStatusChange.post(userSim);
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
    var methodName_1 = apiDeclaration.notifySimOnline.methodName;
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
                                console.log(methodName_1 + " internal sim storage changed");
                                restartApp_1.restartApp();
                                return [2 /*return*/];
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
                                events_1.evtSimPasswordChanged.post(userSim);
                                return [2 /*return*/, undefined];
                            }
                            if (wasAlreadyReachable) {
                                return [2 /*return*/, undefined];
                            }
                            events_1.evtSimReachabilityStatusChange.post(userSim);
                            return [2 /*return*/, undefined];
                    }
                });
            });
        }
    };
    exports.handlers[methodName_1] = handler;
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
                                    events_1.evtOngoingCall.post(userSim);
                                }
                            }
                            else {
                                reachableSimState.isGsmConnectivityOk = true;
                            }
                            events_1.evtSimGsmConnectivityChange.post(userSim);
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
                            events_1.evtSimCellSignalStrengthChange.post(userSim);
                            return [2 /*return*/, undefined];
                    }
                });
            });
        }
    };
    exports.handlers[methodName] = handler;
}
/*
evtOngoingCall.attach(userSim => {

    const { reachableSimState } = userSim;

    if( !reachableSimState ){

        console.log("===> sim no longer reachable");

        return;
        
    }

    if( !reachableSimState.isGsmConnectivityOk ){

        console.log("=============> cell connectivity lost");

        return;

    }

    if( reachableSimState.ongoingCall === undefined ){

        console.log("=================> call terminated");

        return;

    }

    console.log("===========> ", JSON.stringify(reachableSimState.ongoingCall, null, 2));

});
*/
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
                                events_1.evtOngoingCall.post(userSim);
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
                        events_1.evtOngoingCall.post(userSim);
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
                            events_1.evtContactCreatedOrUpdated.post({ userSim: userSim, contact: contact });
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
                            events_1.evtContactDeleted.post({ userSim: userSim, "contact": contact });
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
            return __generator(this, function (_a) {
                (function () { return __awaiter(void 0, void 0, void 0, function () {
                    var _a, dialogApi, endMultiDialogProcess;
                    return __generator(this, function (_b) {
                        switch (_b.label) {
                            case 0:
                                _a = dialog_1.startMultiDialogProcess(), dialogApi = _a.dialogApi, endMultiDialogProcess = _a.endMultiDialogProcess;
                                if (!dcTypes.Dongle.Locked.match(dongle)) return [3 /*break*/, 2];
                                return [4 /*yield*/, interact_onLockedDongle_1(dongle, dialogApi)];
                            case 1:
                                _b.sent();
                                return [3 /*break*/, 4];
                            case 2:
                                evtUsableDongle.post({ "imei": dongle.imei });
                                return [4 /*yield*/, interact_onUsableDongle_1(dongle, dialogApi)];
                            case 3:
                                _b.sent();
                                _b.label = 4;
                            case 4:
                                endMultiDialogProcess();
                                return [2 /*return*/];
                        }
                    });
                }); })();
                return [2 /*return*/, undefined];
            });
        }); }
    };
    exports.handlers[methodName] = handler;
    var interact_onLockedDongle_1 = function (dongle, dialogApi) { return __awaiter(void 0, void 0, void 0, function () {
        var pin, unlockResult;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!(dongle.sim.pinState !== "SIM PIN")) return [3 /*break*/, 2];
                    return [4 /*yield*/, dialogApi.create("alert", { "message": dongle.sim.pinState + " require manual unlock" })];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
                case 2: return [4 /*yield*/, (function callee() {
                        return __awaiter(this, void 0, void 0, function () {
                            var pin, shouldContinue;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, new Promise(function (resolve) { return dialogApi.create("prompt", {
                                            "title": "PIN code for sim inside " + dongle.manufacturer + " " + dongle.model + " (" + dongle.sim.tryLeft + " tries left)",
                                            "inputType": "number",
                                            "callback": function (result) { return resolve(result); }
                                        }); })];
                                    case 1:
                                        pin = _a.sent();
                                        if (pin === null) {
                                            return [2 /*return*/, undefined];
                                        }
                                        if (!!pin.match(/^[0-9]{4}$/)) return [3 /*break*/, 3];
                                        return [4 /*yield*/, new Promise(function (resolve) { return dialogApi.create("confirm", {
                                                "title": "PIN malformed!",
                                                "message": "A pin code is composed of 4 digits, e.g. 0000",
                                                callback: function (result) { return resolve(result); }
                                            }); })];
                                    case 2:
                                        shouldContinue = _a.sent();
                                        if (!shouldContinue) {
                                            return [2 /*return*/, undefined];
                                        }
                                        return [2 /*return*/, callee()];
                                    case 3: return [2 /*return*/, pin];
                                }
                            });
                        });
                    })()];
                case 3:
                    pin = _a.sent();
                    if (pin === undefined) {
                        return [2 /*return*/];
                    }
                    dialogApi.loading("Your sim is being unlocked please wait...", 0);
                    return [4 /*yield*/, getRemoteApiCaller().unlockSim(dongle, pin)];
                case 4:
                    unlockResult = _a.sent();
                    dialogApi.dismissLoading();
                    if (!unlockResult) {
                        alert("Unlock failed for unknown reason");
                        return [2 /*return*/];
                    }
                    if (!unlockResult.success) {
                        //NOTE: Interact will be called again with an updated dongle.
                        return [2 /*return*/];
                    }
                    dialogApi.loading("Initialization of the sim...", 0);
                    return [4 /*yield*/, evtUsableDongle.waitFor(function (_a) {
                            var imei = _a.imei;
                            return imei === dongle.imei;
                        })];
                case 5:
                    _a.sent();
                    dialogApi.dismissLoading();
                    return [2 /*return*/];
            }
        });
    }); };
    var interact_onUsableDongle_1 = function (dongle, dialogApi) { return __awaiter(void 0, void 0, void 0, function () {
        var shouldAdd_message, shouldAdd, friendlyName, friendlyNameSubmitted;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    shouldAdd_message = [
                        "SIM inside:",
                        dongle.manufacturer + " " + dongle.model,
                        "Sim IMSI: " + dongle.sim.imsi,
                    ].join("<br>");
                    return [4 /*yield*/, new Promise(function (resolve) { return dialogApi.create("dialog", {
                            "title": "SIM ready to be registered",
                            "message": env_1.env.jsRuntimeEnv === "browser" ?
                                "<p class=\"text-center\">" + shouldAdd_message + "</p>" :
                                shouldAdd_message,
                            "buttons": {
                                "cancel": {
                                    "label": "Not now",
                                    "callback": function () { return resolve(false); }
                                },
                                "success": {
                                    "label": "Yes, register this sim",
                                    "className": "btn-success",
                                    "callback": function () { return resolve(true); }
                                }
                            },
                            "closeButton": false,
                            "onEscape": false
                        }); })];
                case 1:
                    shouldAdd = _a.sent();
                    if (!shouldAdd) {
                        return [2 /*return*/];
                    }
                    if (!(dongle.isVoiceEnabled === false)) return [3 /*break*/, 3];
                    //TODO: Improve message.
                    return [4 /*yield*/, new Promise(function (resolve) { return dialogApi.create("alert", {
                            "message": [
                                "You won't be able to make phone call with this device until it have been voice enabled",
                                "See: <a href='https://www.semasim.com/enable-voice'></a>"
                            ].join("<br>"),
                            "callback": function () { return resolve(); }
                        }); })];
                case 2:
                    //TODO: Improve message.
                    _a.sent();
                    _a.label = 3;
                case 3:
                    dialogApi.loading("Suggesting a suitable friendly name ...");
                    return [4 /*yield*/, getDefaultFriendlyName_1(dongle.sim)];
                case 4:
                    friendlyName = _a.sent();
                    return [4 /*yield*/, new Promise(function (resolve) { return dialogApi.create("prompt", {
                            "title": "Friendly name for this sim?",
                            "value": friendlyName,
                            "callback": function (result) { return resolve(result); },
                        }); })];
                case 5:
                    friendlyNameSubmitted = _a.sent();
                    if (!friendlyNameSubmitted) {
                        return [2 /*return*/];
                    }
                    friendlyName = friendlyNameSubmitted;
                    dialogApi.loading("Registering SIM...");
                    return [4 /*yield*/, getRemoteApiCaller().registerSim(dongle, friendlyName)];
                case 6:
                    _a.sent();
                    dialogApi.dismissLoading();
                    return [2 /*return*/];
            }
        });
    }); };
    var getDefaultFriendlyName_1 = function (sim) { return __awaiter(void 0, void 0, void 0, function () {
        var tag, num, build, i, userSims;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    tag = sim.serviceProvider.fromImsi || sim.serviceProvider.fromNetwork || "";
                    num = sim.storage.number;
                    if (!tag && num && num.length > 6) {
                        tag = num.slice(0, 4) + ".." + num.slice(-2);
                    }
                    tag = tag || "X";
                    build = function (i) { return "SIM " + tag + (i === 0 ? "" : " ( " + i + " )"); };
                    i = 0;
                    return [4 /*yield*/, getRemoteApiCaller().getUsableUserSims()];
                case 1:
                    userSims = _a.sent();
                    while (userSims.filter(function (_a) {
                        var friendlyName = _a.friendlyName;
                        return friendlyName === build(i);
                    }).length) {
                        i++;
                    }
                    return [2 /*return*/, build(i)];
            }
        });
    }); };
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
                        case 0: return [4 /*yield*/, getRemoteApiCaller().getUsableUserSims()];
                        case 1:
                            userSims = _b.sent();
                            userSim = userSims.find(function (_a) {
                                var sim = _a.sim;
                                return sim.imsi === imsi;
                            });
                            userSims.splice(userSims.indexOf(userSim), 1);
                            events_1.evtSimPermissionLost.post(userSim);
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
            var _a = dialog_1.startMultiDialogProcess(), endMultiDialogProcess = _a.endMultiDialogProcess, dialogApi = _a.dialogApi;
            interact_1(params, dialogApi).then(function () { return endMultiDialogProcess(); });
            return Promise.resolve(undefined);
            ;
        }
    };
    exports.handlers[methodName] = handler;
    //TODO: run exclusive
    var interact_1 = function (userSim, dialogApi) { return __awaiter(void 0, void 0, void 0, function () {
        var shouldProceed, friendlyNameSubmitted;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, new Promise(function (resolve) { return dialogApi.create("dialog", {
                        "title": userSim.ownership.ownerEmail + " would like to share a SIM with you, accept?",
                        "message": userSim.ownership.sharingRequestMessage ?
                            "\u00AB" + userSim.ownership.sharingRequestMessage.replace(/\n/g, "<br>") + "\u00BB" : "",
                        "buttons": {
                            "cancel": {
                                "label": "Refuse",
                                "callback": function () { return resolve("REFUSE"); }
                            },
                            "success": {
                                "label": "Yes, use this SIM",
                                "className": "btn-success",
                                "callback": function () { return resolve("ACCEPT"); }
                            }
                        },
                        "closeButton": true,
                        "onEscape": function () { return resolve("LATER"); }
                    }); })];
                case 1:
                    shouldProceed = _a.sent();
                    if (shouldProceed === "LATER") {
                        return [2 /*return*/, undefined];
                    }
                    if (!(shouldProceed === "REFUSE")) return [3 /*break*/, 3];
                    dialogApi.loading("Rejecting SIM sharing request...");
                    return [4 /*yield*/, getRemoteApiCaller().rejectSharingRequest(userSim)];
                case 2:
                    _a.sent();
                    dialogApi.dismissLoading();
                    return [2 /*return*/, undefined];
                case 3: return [4 /*yield*/, new Promise(function (resolve) { return dialogApi.create("prompt", {
                        "title": "Friendly name for this sim?",
                        "value": userSim.friendlyName,
                        "callback": function (result) { return resolve(result); },
                    }); })];
                case 4:
                    friendlyNameSubmitted = _a.sent();
                    if (!!friendlyNameSubmitted) return [3 /*break*/, 6];
                    dialogApi.loading("Rejecting SIM sharing request...");
                    return [4 /*yield*/, getRemoteApiCaller().rejectSharingRequest(userSim)];
                case 5:
                    _a.sent();
                    dialogApi.dismissLoading();
                    return [2 /*return*/, undefined];
                case 6:
                    userSim.friendlyName = friendlyNameSubmitted;
                    dialogApi.loading("Accepting SIM sharing request...");
                    return [4 /*yield*/, getRemoteApiCaller()];
                case 7: return [4 /*yield*/, (_a.sent()).acceptSharingRequest(userSim, userSim.friendlyName)];
                case 8:
                    _a.sent();
                    dialogApi.dismissLoading();
                    return [2 /*return*/];
            }
        });
    }); };
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
                            dialog_1.dialogApi.create("alert", {
                                "message": email + " " + (isAccepted ? "accepted" : "rejected") + " sharing request for " + userSim.friendlyName
                            });
                            //TODO: Study when this method is called.
                            events_1.evtSharingRequestResponse.post({
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
                            //TODO: Study this function.
                            events_1.evtOtherSimUserUnregisteredSim.post({
                                "userSim": userSim,
                                email: email
                            });
                            dialog_1.dialogApi.create("alert", { "message": email + " no longer share " + userSim.friendlyName });
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
        "handler": function () { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                events_1.evtOpenElsewhere.post();
                dialog_1.dialogApi.create("alert", {
                    "message": "You are connected somewhere else",
                    "callback": function () { return restartApp_1.restartApp(); }
                });
                return [2 /*return*/, undefined];
            });
        }); }
    };
    exports.handlers[methodName] = handler;
}
{
    var methodName = apiDeclaration.notifyIceServer.methodName;
    var handler = {
        "handler": function (params, fromSocket) { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                events_1.rtcIceEServer.evt.post({
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
                return [2 /*return*/, undefined];
            });
        }); }
    };
    exports.handlers[methodName] = handler;
}

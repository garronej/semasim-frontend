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
exports.registerInteractiveRemoteNotifyEvtHandlers = void 0;
var env_1 = require("./env");
function registerInteractiveRemoteNotifyEvtHandlers(params) {
    var _this = this;
    var getUsableSimFriendlyNames = params.getUsableSimFriendlyNames, userSimEvts = params.userSimEvts, prReadyToDisplayUnsolicitedDialogs = params.prReadyToDisplayUnsolicitedDialogs, remoteNotifyEvts = params.remoteNotifyEvts, coreApi = params.coreApi, dialogApi = params.dialogApi, startMultiDialogProcess = params.startMultiDialogProcess, restartApp = params.restartApp;
    var interactiveProcedures = getInteractiveProcedures({
        coreApi: coreApi,
        getUsableSimFriendlyNames: getUsableSimFriendlyNames
    });
    remoteNotifyEvts.evtDongleOnLan.attach(function (eventData) { return prReadyToDisplayUnsolicitedDialogs.then(function () { return __awaiter(_this, void 0, void 0, function () {
        var _a, dialogApi, endMultiDialogProcess;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _a = startMultiDialogProcess(), dialogApi = _a.dialogApi, endMultiDialogProcess = _a.endMultiDialogProcess;
                    return [4 /*yield*/, ((eventData.type === "LOCKED") ?
                            interactiveProcedures.onLockedDongleOnLan(eventData.dongle, eventData.prSimUnlocked, dialogApi) : interactiveProcedures.onUsableDongleOnLan(eventData.dongle, dialogApi))];
                case 1:
                    _b.sent();
                    endMultiDialogProcess();
                    return [2 /*return*/];
            }
        });
    }); }); });
    {
        var handler_1 = function (userSim) {
            return prReadyToDisplayUnsolicitedDialogs.then(function () { return __awaiter(_this, void 0, void 0, function () {
                var _a, endMultiDialogProcess, dialogApi;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            _a = startMultiDialogProcess(), endMultiDialogProcess = _a.endMultiDialogProcess, dialogApi = _a.dialogApi;
                            return [4 /*yield*/, interactiveProcedures.onSimSharingRequest(userSim, dialogApi)];
                        case 1:
                            _b.sent();
                            endMultiDialogProcess();
                            return [2 /*return*/];
                    }
                });
            }); });
        };
        userSimEvts.evtNew.attach(function (eventData) {
            if (eventData.cause !== "SHARING REQUEST RECEIVED") {
                return;
            }
            handler_1(eventData.userSim);
        });
        params.sharedNotConfirmedUserSims.forEach(handler_1);
    }
    userSimEvts.evtSharedUserSetChange.attach(function (_a) {
        var friendlyName = _a.userSim.friendlyName, action = _a.action, targetSet = _a.targetSet, email = _a.email;
        return prReadyToDisplayUnsolicitedDialogs.then(function () {
            var acceptedOrRejectedAlert = function (isAccepted) {
                return dialogApi.create("alert", { "message": email + " " + (isAccepted ? "accepted" : "rejected") + " the sharing request for " + friendlyName });
            };
            switch (action) {
                case "MOVE TO CONFIRMED":
                    acceptedOrRejectedAlert(true);
                    return;
                case "REMOVE":
                    switch (targetSet) {
                        case "NOT CONFIRMED USERS":
                            acceptedOrRejectedAlert(false);
                            return;
                        case "CONFIRMED USERS":
                            dialogApi.create("alert", { "message": email + " no longer share " + friendlyName });
                            return;
                    }
            }
        });
    });
    remoteNotifyEvts.evtOpenElsewhere.attachOnce(function () { return prReadyToDisplayUnsolicitedDialogs.then(function () {
        return dialogApi.create("alert", {
            "message": "You are connected somewhere else",
            "callback": function () { return restartApp("Connected somewhere else with uaInstanceId"); }
        });
    }); });
}
exports.registerInteractiveRemoteNotifyEvtHandlers = registerInteractiveRemoteNotifyEvtHandlers;
function getInteractiveProcedures(params) {
    var _this = this;
    var coreApi = params.coreApi, getUsableSimFriendlyNames = params.getUsableSimFriendlyNames;
    var getDefaultFriendlyName = function (sim) {
        var _a, _b;
        var tag = (_b = (_a = sim.serviceProvider.fromImsi) !== null && _a !== void 0 ? _a : sim.serviceProvider.fromNetwork) !== null && _b !== void 0 ? _b : "";
        var num = sim.storage.number;
        if (!tag && num && num.length > 6) {
            tag = num.slice(0, 4) + ".." + num.slice(-2);
        }
        tag = tag || "X";
        var build = function (i) { return "SIM " + tag + (i === 0 ? "" : " ( " + i + " )"); };
        var i = 0;
        while (getUsableSimFriendlyNames().filter(function (friendlyName) { return friendlyName === build(i); }).length) {
            i++;
        }
        return build(i);
    };
    return {
        "onLockedDongleOnLan": function (dongle, prSimUnlocked, dialogApi) { return __awaiter(_this, void 0, void 0, function () {
            var isPrSimUnlockedResolved, pin, unlockResult;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!(dongle.sim.pinState !== "SIM PIN")) return [3 /*break*/, 2];
                        return [4 /*yield*/, dialogApi.create("alert", { "message": dongle.sim.pinState + " require manual unlock" })];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                    case 2:
                        isPrSimUnlockedResolved = false;
                        prSimUnlocked.then(function () { return isPrSimUnlockedResolved = true; });
                        return [4 /*yield*/, (function callee() {
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
                        if (!isPrSimUnlockedResolved) return [3 /*break*/, 5];
                        return [4 /*yield*/, dialogApi.create("alert", { "message": "The Sim has already been unlocked" })];
                    case 4:
                        _a.sent();
                        return [2 /*return*/];
                    case 5:
                        dialogApi.loading("Your sim is being unlocked please wait...", 0);
                        return [4 /*yield*/, coreApi.unlockSim({
                                "lockedDongle": dongle,
                                pin: pin
                            })];
                    case 6:
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
                        return [4 /*yield*/, prSimUnlocked];
                    case 7:
                        _a.sent();
                        dialogApi.dismissLoading();
                        return [2 /*return*/];
                }
            });
        }); },
        "onUsableDongleOnLan": function (dongle, dialogApi) { return __awaiter(_this, void 0, void 0, function () {
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
                        return [4 /*yield*/, getDefaultFriendlyName(dongle.sim)];
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
                        return [4 /*yield*/, coreApi.registerSim({ dongle: dongle, friendlyName: friendlyName })];
                    case 6:
                        _a.sent();
                        dialogApi.dismissLoading();
                        return [2 /*return*/];
                }
            });
        }); },
        "onSimSharingRequest": function (userSim, dialogApi) { return __awaiter(_this, void 0, void 0, function () {
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
                        return [4 /*yield*/, coreApi.rejectSharingRequest(userSim)];
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
                        return [4 /*yield*/, coreApi.rejectSharingRequest(userSim)];
                    case 5:
                        _a.sent();
                        dialogApi.dismissLoading();
                        return [2 /*return*/, undefined];
                    case 6:
                        userSim.friendlyName = friendlyNameSubmitted;
                        dialogApi.loading("Accepting SIM sharing request...");
                        return [4 /*yield*/, coreApi.acceptSharingRequest({
                                "notConfirmedUserSim": userSim,
                                "friendlyName": userSim.friendlyName
                            })];
                    case 7:
                        _a.sent();
                        dialogApi.dismissLoading();
                        return [2 /*return*/];
                }
            });
        }); }
    };
}

"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
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
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var apiDeclaration = require("../../sip_api_declarations/uaToBackend");
var ts_events_extended_1 = require("ts-events-extended");
var dcTypes = require("chan-dongle-extended-client/dist/lib/types");
var remoteApiCaller = require("./remoteApiCaller");
//NOTE: Global JS deps.
var bootbox_custom = require("../tools/bootbox_custom");
exports.handlers = {};
exports.evtSimIsOnlineStatusChange = new ts_events_extended_1.SyncEvent();
{
    var methodName = apiDeclaration.notifySimOffline.methodName;
    var handler = {
        "handler": function (_a) {
            var imsi = _a.imsi;
            return __awaiter(_this, void 0, void 0, function () {
                var userSim;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0: return [4 /*yield*/, remoteApiCaller.getUsableUserSims()];
                        case 1:
                            userSim = (_b.sent())
                                .find(function (_a) {
                                var sim = _a.sim;
                                return sim.imsi === imsi;
                            });
                            userSim.isOnline = false;
                            exports.evtSimIsOnlineStatusChange.post(userSim);
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
            var imsi = _a.imsi, hasInternalSimStorageChanged = _a.hasInternalSimStorageChanged, password = _a.password, simDongle = _a.simDongle, gatewayLocation = _a.gatewayLocation;
            return __awaiter(_this, void 0, void 0, function () {
                var userSim;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            evtUsableDongle.post({ "imei": simDongle.imei });
                            return [4 /*yield*/, remoteApiCaller.getUsableUserSims()];
                        case 1:
                            userSim = (_b.sent())
                                .find(function (_a) {
                                var sim = _a.sim;
                                return sim.imsi === imsi;
                            });
                            if (hasInternalSimStorageChanged) {
                                location.reload();
                                return [2 /*return*/];
                            }
                            userSim.isOnline = true;
                            userSim.password = password;
                            userSim.dongle = simDongle;
                            userSim.gatewayLocation = gatewayLocation;
                            exports.evtSimIsOnlineStatusChange.post(userSim);
                            return [2 /*return*/, undefined];
                    }
                });
            });
        }
    };
    exports.handlers[methodName] = handler;
}
/** posted when a user that share the SIM created or updated a contact. */
exports.evtContactCreatedOrUpdated = new ts_events_extended_1.SyncEvent();
{
    var methodName = apiDeclaration.notifyContactCreatedOrUpdated.methodName;
    var handler = {
        "handler": function (_a) {
            var imsi = _a.imsi, name = _a.name, number_raw = _a.number_raw, storage = _a.storage;
            return __awaiter(_this, void 0, void 0, function () {
                var userSim, contact;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0: return [4 /*yield*/, remoteApiCaller.getUsableUserSims()];
                        case 1:
                            userSim = (_b.sent())
                                .find(function (_a) {
                                var sim = _a.sim;
                                return sim.imsi === imsi;
                            });
                            contact = userSim.phonebook.find(function (contact) {
                                if (!!storage) {
                                    return contact.mem_index === storage.mem_index;
                                }
                                return number_raw === number_raw;
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
                            exports.evtContactCreatedOrUpdated.post({ userSim: userSim, contact: contact });
                            return [2 /*return*/, undefined];
                    }
                });
            });
        }
    };
    exports.handlers[methodName] = handler;
}
exports.evtContactDeleted = new ts_events_extended_1.SyncEvent();
{
    var methodName = apiDeclaration.notifyContactDeleted.methodName;
    var handler = {
        "handler": function (_a) {
            var imsi = _a.imsi, number_raw = _a.number_raw, storage = _a.storage;
            return __awaiter(_this, void 0, void 0, function () {
                var userSim, contact, i;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0: return [4 /*yield*/, remoteApiCaller.getUsableUserSims()];
                        case 1:
                            userSim = (_b.sent())
                                .find(function (_a) {
                                var sim = _a.sim;
                                return sim.imsi === imsi;
                            });
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
                            exports.evtContactDeleted.post({ userSim: userSim, "contact": contact });
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
        "handler": function (params) { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                if (dcTypes.Dongle.Usable.match(params)) {
                    evtUsableDongle.post({ "imei": params.imei });
                }
                interact_1(params);
                return [2 /*return*/, undefined];
            });
        }); }
    };
    exports.handlers[methodName] = handler;
    var interact_1 = function (dongle) { return __awaiter(_this, void 0, void 0, function () {
        var _loop_1, state_1, shouldAdd_message_1, shouldAdd, friendlyName_1, friendlyNameSubmitted;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!dcTypes.Dongle.Locked.match(dongle)) return [3 /*break*/, 4];
                    _loop_1 = function () {
                        var tryLeft, pin, shouldContinue, unlockResult;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    if (dongle.sim.pinState !== "SIM PIN") {
                                        bootbox_custom.alert(dongle.sim.pinState + " require manual unlock");
                                        return [2 /*return*/, { value: void 0 }];
                                    }
                                    tryLeft = dongle.sim.tryLeft;
                                    return [4 /*yield*/, new Promise(function (resolve) { return bootbox_custom.prompt({
                                            "title": "PIN code for sim inside " + dongle.manufacturer + " " + dongle.model + " (" + tryLeft + " tries left)",
                                            "inputType": "number",
                                            "callback": function (result) { return resolve(result); }
                                        }); })];
                                case 1:
                                    pin = _a.sent();
                                    if (pin === null) {
                                        return [2 /*return*/, { value: void 0 }];
                                    }
                                    if (!!pin.match(/^[0-9]{4}$/)) return [3 /*break*/, 3];
                                    return [4 /*yield*/, new Promise(function (resolve) { return bootbox_custom.confirm({
                                            "title": "PIN malformed!",
                                            "message": "A pin code is composed of 4 digits, e.g. 0000",
                                            callback: function (result) { return resolve(result); }
                                        }); })];
                                case 2:
                                    shouldContinue = _a.sent();
                                    if (!shouldContinue) {
                                        return [2 /*return*/, { value: void 0 }];
                                    }
                                    return [2 /*return*/, "continue"];
                                case 3:
                                    bootbox_custom.loading("Your sim is being unlocked please wait...", 0);
                                    return [4 /*yield*/, remoteApiCaller.unlockSim(dongle, pin)];
                                case 4:
                                    unlockResult = _a.sent();
                                    bootbox_custom.dismissLoading();
                                    bootbox_custom.loading("Reading sim...", 0);
                                    return [4 /*yield*/, evtUsableDongle.waitFor(function (_a) {
                                            var imei = _a.imei;
                                            return imei === dongle.imei;
                                        })];
                                case 5:
                                    _a.sent();
                                    bootbox_custom.dismissLoading();
                                    setTimeout(function () { return bootbox_custom.dismissLoading(); }, 10000);
                                    if (!unlockResult) {
                                        //TODO: Improve
                                        alert("Unlock failed for unknown reason");
                                        return [2 /*return*/, { value: void 0 }];
                                    }
                                    if (!unlockResult.success) {
                                        dongle.sim.pinState = unlockResult.pinState;
                                        dongle.sim.tryLeft = unlockResult.tryLeft;
                                        return [2 /*return*/, "continue"];
                                    }
                                    return [2 /*return*/, "break"];
                            }
                        });
                    };
                    _a.label = 1;
                case 1:
                    if (!true) return [3 /*break*/, 3];
                    return [5 /*yield**/, _loop_1()];
                case 2:
                    state_1 = _a.sent();
                    if (typeof state_1 === "object")
                        return [2 /*return*/, state_1.value];
                    if (state_1 === "break")
                        return [3 /*break*/, 3];
                    return [3 /*break*/, 1];
                case 3: return [3 /*break*/, 11];
                case 4:
                    shouldAdd_message_1 = [
                        "SIM inside:",
                        dongle.manufacturer + " " + dongle.model,
                        "Sim IMSI: " + dongle.sim.imsi,
                    ].join("<br>");
                    return [4 /*yield*/, new Promise(function (resolve) { return bootbox_custom.dialog({
                            "title": "SIM ready to be registered",
                            "message": "<p class=\"text-center\">" + shouldAdd_message_1 + "</p>",
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
                            "closeButton": false
                        }); })];
                case 5:
                    shouldAdd = _a.sent();
                    if (!shouldAdd) {
                        return [2 /*return*/];
                    }
                    if (!(dongle.isVoiceEnabled === false)) return [3 /*break*/, 7];
                    //TODO: Improve message.
                    return [4 /*yield*/, new Promise(function (resolve) { return bootbox_custom.alert([
                            "You won't be able to make phone call with this device until it have been voice enabled",
                            "See: <a href='https://www.semasim.com/enable-voice'></a>"
                        ].join("<br>"), function () { return resolve(); }); })];
                case 6:
                    //TODO: Improve message.
                    _a.sent();
                    _a.label = 7;
                case 7:
                    bootbox_custom.loading("Suggesting a suitable friendly name ...");
                    return [4 /*yield*/, getDefaultFriendlyName_1(dongle.sim)];
                case 8:
                    friendlyName_1 = _a.sent();
                    return [4 /*yield*/, new Promise(function (resolve) { return bootbox_custom.prompt({
                            "title": "Friendly name for this sim?",
                            "value": friendlyName_1,
                            "callback": function (result) { return resolve(result); },
                        }); })];
                case 9:
                    friendlyNameSubmitted = _a.sent();
                    if (friendlyNameSubmitted) {
                        friendlyName_1 = friendlyNameSubmitted;
                    }
                    bootbox_custom.loading("Registering SIM...");
                    return [4 /*yield*/, remoteApiCaller.registerSim(dongle, friendlyName_1)];
                case 10:
                    _a.sent();
                    bootbox_custom.dismissLoading();
                    _a.label = 11;
                case 11: return [2 /*return*/];
            }
        });
    }); };
    var getDefaultFriendlyName_1 = function (sim) { return __awaiter(_this, void 0, void 0, function () {
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
                    return [4 /*yield*/, remoteApiCaller.getUsableUserSims()];
                case 1:
                    userSims = _a.sent();
                    while (userSims.filter(function (_a) {
                        var friendlyName = _a.friendlyName, sim = _a.sim;
                        return friendlyName === build(i);
                    }).length) {
                        i++;
                    }
                    return [2 /*return*/, build(i)];
            }
        });
    }); };
}
exports.evtSimPermissionLost = new ts_events_extended_1.SyncEvent();
{
    var methodName = apiDeclaration.notifySimPermissionLost.methodName;
    var handler = {
        "handler": function (_a) {
            var imsi = _a.imsi;
            return __awaiter(_this, void 0, void 0, function () {
                var userSims, userSim;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0: return [4 /*yield*/, remoteApiCaller.getUsableUserSims()];
                        case 1:
                            userSims = _b.sent();
                            userSim = userSims.find(function (_a) {
                                var sim = _a.sim;
                                return sim.imsi === imsi;
                            });
                            userSims.splice(userSims.indexOf(userSim), 1);
                            exports.evtSimPermissionLost.post(userSim);
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
        "handler": function (params) { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                interact_2(params);
                return [2 /*return*/, undefined];
            });
        }); }
    };
    exports.handlers[methodName] = handler;
    //TODO: run exclusive
    var interact_2 = function (userSim) { return __awaiter(_this, void 0, void 0, function () {
        var shouldProceed, friendlyNameSubmitted;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, new Promise(function (resolve) { return bootbox_custom.dialog({
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
                        "onEscape": function () { return resolve("LATER"); }
                    }); })];
                case 1:
                    shouldProceed = _a.sent();
                    if (shouldProceed === "LATER") {
                        return [2 /*return*/, undefined];
                    }
                    if (!(shouldProceed === "REFUSE")) return [3 /*break*/, 3];
                    bootbox_custom.loading("Rejecting SIM sharing request...");
                    return [4 /*yield*/, remoteApiCaller.rejectSharingRequest(userSim)];
                case 2:
                    _a.sent();
                    return [2 /*return*/, undefined];
                case 3: return [4 /*yield*/, new Promise(function (resolve) { return bootbox_custom.prompt({
                        "title": "Friendly name for this sim?",
                        "value": userSim.friendlyName,
                        "callback": function (result) { return resolve(result); },
                    }); })];
                case 4:
                    friendlyNameSubmitted = _a.sent();
                    if (friendlyNameSubmitted) {
                        userSim.friendlyName = friendlyNameSubmitted;
                    }
                    bootbox_custom.loading("Accepting SIM sharing request...");
                    return [4 /*yield*/, remoteApiCaller.acceptSharingRequest(userSim, userSim.friendlyName)];
                case 5:
                    _a.sent();
                    bootbox_custom.dismissLoading();
                    return [2 /*return*/];
            }
        });
    }); };
}
exports.evtSharingRequestResponse = new ts_events_extended_1.SyncEvent();
{
    var methodName = apiDeclaration.notifySharingRequestResponse.methodName;
    var handler = {
        "handler": function (_a) {
            var imsi = _a.imsi, email = _a.email, isAccepted = _a.isAccepted;
            return __awaiter(_this, void 0, void 0, function () {
                var userSim;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0: return [4 /*yield*/, remoteApiCaller.getUsableUserSims()];
                        case 1:
                            userSim = (_b.sent())
                                .find(function (_a) {
                                var sim = _a.sim;
                                return sim.imsi === imsi;
                            });
                            userSim.ownership.sharedWith.notConfirmed.splice(userSim.ownership.sharedWith.notConfirmed.indexOf(email), 1);
                            if (isAccepted) {
                                userSim.ownership.sharedWith.confirmed.push(email);
                            }
                            exports.evtSharingRequestResponse.post({ userSim: userSim, email: email, isAccepted: isAccepted });
                            bootbox_custom.alert(email + " " + (isAccepted ? "accepted" : "rejected") + " your sharing request for " + userSim.friendlyName);
                            return [2 /*return*/, undefined];
                    }
                });
            });
        }
    };
    exports.handlers[methodName] = handler;
}
exports.evtSharedSimUnregistered = new ts_events_extended_1.SyncEvent();
{
    var methodName = apiDeclaration.notifySharedSimUnregistered.methodName;
    var handler = {
        "handler": function (_a) {
            var imsi = _a.imsi, email = _a.email;
            return __awaiter(_this, void 0, void 0, function () {
                var userSim;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0: return [4 /*yield*/, remoteApiCaller.getUsableUserSims()];
                        case 1:
                            userSim = (_b.sent())
                                .find(function (_a) {
                                var sim = _a.sim;
                                return sim.imsi === imsi;
                            });
                            userSim.ownership.sharedWith.confirmed.splice(userSim.ownership.sharedWith.confirmed.indexOf(email), 1);
                            exports.evtSharedSimUnregistered.post({ userSim: userSim, email: email });
                            bootbox_custom.alert(email + " no longer share " + userSim.friendlyName);
                            return [2 /*return*/, undefined];
                    }
                });
            });
        }
    };
    exports.handlers[methodName] = handler;
}
exports.evtOpenElsewhere = new ts_events_extended_1.VoidSyncEvent();
{
    var methodName = apiDeclaration.notifyLoggedFromOtherTab.methodName;
    var handler = {
        "handler": function () { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                exports.evtOpenElsewhere.post();
                bootbox_custom.alert("This session is over, only one semasim web browser tab can be active.");
                return [2 /*return*/, undefined];
            });
        }); }
    };
    exports.handlers[methodName] = handler;
}
exports.iceServers = [
    {
        "urls": [
            "stun:stun1.l.google.com:19302",
            "stun:stun2.l.google.com:19302",
            "stun:stun3.l.google.com:19302",
            "stun:stun4.l.google.com:19302"
        ]
    }
];
{
    var methodName = apiDeclaration.notifyIceServer.methodName;
    var handler = {
        "handler": function (params) { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                exports.iceServers.pop();
                exports.iceServers.push(params);
                return [2 /*return*/, undefined];
            });
        }); }
    };
    exports.handlers[methodName] = handler;
}

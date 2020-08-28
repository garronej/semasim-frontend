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
var __values = (this && this.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createWebphoneFactory = void 0;
var types = require("./types");
var lib_1 = require("phone-number/dist/lib");
var env_1 = require("./env");
var id_1 = require("../tools/typeSafety/id");
function createWebphoneFactory(params) {
    var createSipUserAgent = params.createSipUserAgent, getWdApi = params.getWdApi, phoneCallUiCreate = params.phoneCallUiCreate, userSimEvts = params.userSimEvts, coreApi = params.coreApi;
    return function createWebphone(userSim) {
        return __awaiter(this, void 0, void 0, function () {
            var wdApi, _a, wdChats, wdEvts, sipUserAgent, phoneCallUi, webphone;
            var _this = this;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        wdApi = getWdApi({ "imsi": userSim.sim.imsi });
                        return [4 /*yield*/, wdApi.getUserSimChats({ "maxMessageCountByChat": 20 })];
                    case 1:
                        _a = _b.sent(), wdChats = _a.wdChats, wdEvts = _a.wdEvts;
                        return [4 /*yield*/, synchronizeUserSimAndWdInstance(userSim, wdChats, wdApi)];
                    case 2:
                        _b.sent();
                        sipUserAgent = createSipUserAgent(userSim);
                        phoneCallUi = phoneCallUiCreate((function () {
                            var _common = (function () {
                                var buildPhoneNumber = function (phoneNumberRaw) {
                                    var _a;
                                    return lib_1.phoneNumber.build(phoneNumberRaw, (_a = userSim.sim.country) === null || _a === void 0 ? void 0 : _a.iso);
                                };
                                return id_1.id({
                                    "imsi": userSim.sim.imsi,
                                    "getContactName": function (phoneNumberRaw) { var _a; return (_a = userSim.phonebook.find((function () {
                                        var validPhoneNumber = buildPhoneNumber(phoneNumberRaw);
                                        return function (_a) {
                                            var number_raw = _a.number_raw;
                                            return lib_1.phoneNumber.areSame(validPhoneNumber, number_raw);
                                        };
                                    })())) === null || _a === void 0 ? void 0 : _a.name; },
                                    "getPhoneNumberPrettyPrint": function (phoneNumberRaw) {
                                        var _a;
                                        return lib_1.phoneNumber.prettyPrint(buildPhoneNumber(phoneNumberRaw), (_a = userSim.sim.country) === null || _a === void 0 ? void 0 : _a.iso);
                                    }
                                });
                            })();
                            switch (env_1.env.jsRuntimeEnv) {
                                case "browser": {
                                    return id_1.id(__assign({ "assertJsRuntimeEnv": "browser" }, _common));
                                }
                                case "react-native": {
                                    return id_1.id(__assign({ "assertJsRuntimeEnv": "react-native", "evtIsSipRegistered": sipUserAgent.evtIsRegistered }, _common));
                                }
                            }
                        })());
                        webphone = {
                            userSim: userSim,
                            "userSimEvts": types.UserSim.Usable.Evts.ForSpecificSim.build(userSimEvts, userSim, [
                                "evtFriendlyNameChange",
                                "evtReachabilityStatusChange",
                                "evtCellularConnectivityChange",
                                "evtCellularSignalStrengthChange",
                                "evtOngoingCall",
                                "evtNewUpdatedOrDeletedContact"
                            ]),
                            wdChats: wdChats,
                            wdEvts: wdEvts,
                            "evtIsSipRegistered": sipUserAgent.evtIsRegistered,
                            "sendMessage": function (_a) {
                                var wdChat = _a.wdChat, text = _a.text;
                                return __awaiter(_this, void 0, void 0, function () {
                                    var bundledData, _b, _c, onUaFailedToSendMessage, error_1;
                                    return __generator(this, function (_d) {
                                        switch (_d.label) {
                                            case 0:
                                                _b = {
                                                    "type": "MESSAGE",
                                                    "text": text,
                                                    "exactSendDateTime": Date.now()
                                                };
                                                _c = "appendPromotionalMessage";
                                                return [4 /*yield*/, coreApi.shouldAppendPromotionalMessage()];
                                            case 1:
                                                bundledData = (_b[_c] = _d.sent(),
                                                    _b);
                                                return [4 /*yield*/, wdApi.newMessage({
                                                        wdChat: wdChat,
                                                        "type": "CLIENT TO SERVER",
                                                        bundledData: bundledData
                                                    })];
                                            case 2:
                                                onUaFailedToSendMessage = (_d.sent()).onUaFailedToSendMessage;
                                                _d.label = 3;
                                            case 3:
                                                _d.trys.push([3, 5, , 7]);
                                                return [4 /*yield*/, sipUserAgent.sendMessage(wdChat.contactNumber, bundledData)];
                                            case 4:
                                                _d.sent();
                                                return [3 /*break*/, 7];
                                            case 5:
                                                error_1 = _d.sent();
                                                console.log("ua send message error", error_1);
                                                return [4 /*yield*/, onUaFailedToSendMessage()];
                                            case 6:
                                                _d.sent();
                                                return [3 /*break*/, 7];
                                            case 7: return [2 /*return*/];
                                        }
                                    });
                                });
                            },
                            "placeOutgoingCall": function (wdChat) { return phoneCallUi.openUiForOutgoingCall(wdChat.contactNumber); },
                            "fetchOlderWdMessages": wdApi.fetchOlderMessages,
                            "updateWdChatLastMessageSeen": wdApi.updateChatLastMessageSeen,
                            "getOrCreateWdChat": function (_a) {
                                var number_raw = _a.number_raw;
                                return __awaiter(_this, void 0, void 0, function () {
                                    var wdChat_1, contactNumber, contact, wdChat;
                                    var _b, _c, _d;
                                    return __generator(this, function (_e) {
                                        switch (_e.label) {
                                            case 0:
                                                {
                                                    wdChat_1 = wdChats.find(function (_a) {
                                                        var contactNumber = _a.contactNumber;
                                                        return lib_1.phoneNumber.areSame(contactNumber, number_raw);
                                                    });
                                                    if (wdChat_1 !== undefined) {
                                                        return [2 /*return*/, wdChat_1];
                                                    }
                                                }
                                                contactNumber = lib_1.phoneNumber.build(number_raw, (_b = userSim.sim.country) === null || _b === void 0 ? void 0 : _b.iso);
                                                contact = userSim.phonebook.find(function (_a) {
                                                    var number_raw = _a.number_raw;
                                                    return lib_1.phoneNumber.areSame(contactNumber, number_raw);
                                                });
                                                wdApi.newChat({
                                                    wdChats: wdChats,
                                                    contactNumber: contactNumber,
                                                    "contactName": (_c = contact === null || contact === void 0 ? void 0 : contact.name) !== null && _c !== void 0 ? _c : "",
                                                    "contactIndexInSim": (_d = contact === null || contact === void 0 ? void 0 : contact.mem_index) !== null && _d !== void 0 ? _d : null
                                                });
                                                return [4 /*yield*/, wdEvts.evtWdChat.waitFor(function (_a) {
                                                        var wdChat = _a.wdChat, eventType = _a.eventType;
                                                        return (eventType === "NEW" &&
                                                            wdChat.contactNumber === contactNumber);
                                                    })];
                                            case 1:
                                                wdChat = (_e.sent()).wdChat;
                                                return [2 /*return*/, wdChat];
                                        }
                                    });
                                });
                            },
                            "updateWdChatContactName": function (_a) {
                                var wdChat = _a.wdChat, contactName = _a.contactName;
                                return __awaiter(_this, void 0, void 0, function () {
                                    var contact;
                                    return __generator(this, function (_b) {
                                        switch (_b.label) {
                                            case 0:
                                                if (wdChat.contactName === contactName) {
                                                    return [2 /*return*/];
                                                }
                                                contact = userSim.phonebook.find(function (_a) {
                                                    var mem_index = _a.mem_index, number_raw = _a.number_raw;
                                                    return wdChat.contactIndexInSim !== null ?
                                                        mem_index === wdChat.contactIndexInSim
                                                        :
                                                            lib_1.phoneNumber.areSame(wdChat.contactNumber, number_raw);
                                                });
                                                if (contact !== undefined) {
                                                    coreApi.updateContactName({ userSim: userSim, contact: contact, "newName": contactName });
                                                }
                                                else {
                                                    coreApi.createContact({
                                                        userSim: userSim,
                                                        "name": contactName,
                                                        "number_raw": wdChat.contactNumber
                                                    });
                                                }
                                                return [4 /*yield*/, wdEvts.evtWdChat.waitFor(function (data) { return (data.eventType === "UPDATED" &&
                                                        data.changes.contactInfos &&
                                                        data.wdChat === wdChat); })];
                                            case 1:
                                                _b.sent();
                                                return [2 /*return*/];
                                        }
                                    });
                                });
                            },
                            "deleteWdChat": function (wdChat) { return __awaiter(_this, void 0, void 0, function () {
                                var contact;
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0: return [4 /*yield*/, wdApi.destroyWdChat({
                                                wdChats: wdChats,
                                                "refOfTheChatToDelete": wdChat.ref
                                            })];
                                        case 1:
                                            _a.sent();
                                            contact = userSim.phonebook.find(function (_a) {
                                                var number_raw = _a.number_raw;
                                                return lib_1.phoneNumber.areSame(wdChat.contactNumber, number_raw);
                                            });
                                            if (contact === undefined) {
                                                return [2 /*return*/];
                                            }
                                            return [4 /*yield*/, webphone.getOrCreateWdChat({ "number_raw": contact.number_raw })];
                                        case 2:
                                            _a.sent();
                                            return [2 /*return*/];
                                    }
                                });
                            }); }
                        };
                        sipUserAgent.evtIncomingMessage.attach(function (_a) {
                            var fromNumber = _a.fromNumber, bundledData = _a.bundledData, handlerCb = _a.handlerCb;
                            return __awaiter(_this, void 0, void 0, function () {
                                var wdChat;
                                return __generator(this, function (_b) {
                                    switch (_b.label) {
                                        case 0: return [4 /*yield*/, webphone.getOrCreateWdChat({ "number_raw": fromNumber })];
                                        case 1:
                                            wdChat = _b.sent();
                                            return [4 /*yield*/, (function () {
                                                    switch (bundledData.type) {
                                                        case "MESSAGE":
                                                        case "CALL ANSWERED BY":
                                                        case "FROM SIP CALL SUMMARY":
                                                        case "MISSED CALL":
                                                        case "MMS NOTIFICATION":
                                                            return wdApi.newMessage({
                                                                wdChat: wdChat,
                                                                "type": "SERVER TO CLIENT",
                                                                bundledData: bundledData
                                                            });
                                                        case "SEND REPORT":
                                                            return wdApi.notifySendReportReceived({
                                                                wdChat: wdChat,
                                                                bundledData: bundledData
                                                            });
                                                        case "STATUS REPORT":
                                                            return wdApi.notifyStatusReportReceived({
                                                                wdChat: wdChat,
                                                                bundledData: bundledData
                                                            });
                                                    }
                                                })()];
                                        case 2:
                                            _b.sent();
                                            handlerCb();
                                            return [2 /*return*/];
                                    }
                                });
                            });
                        });
                        sipUserAgent.evtIncomingCall.attach(function (evtData) { return __awaiter(_this, void 0, void 0, function () {
                            var fromNumber, logic_terminate, logic_prTerminated, logic_onAccepted, _a, ui_onTerminated, ui_prUserInput;
                            return __generator(this, function (_b) {
                                fromNumber = evtData.fromNumber, logic_terminate = evtData.terminate, logic_prTerminated = evtData.prTerminated, logic_onAccepted = evtData.onAccepted;
                                _a = phoneCallUi.openUiForIncomingCall(fromNumber), ui_onTerminated = _a.onTerminated, ui_prUserInput = _a.prUserInput;
                                logic_prTerminated.then(function () { return ui_onTerminated("Call ended"); });
                                ui_prUserInput.then(function (ui_userInput) {
                                    if (ui_userInput.userAction === "REJECT") {
                                        logic_terminate();
                                        return;
                                    }
                                    var ui_onEstablished = ui_userInput.onEstablished;
                                    logic_onAccepted().then(function (_a) {
                                        var logic_sendDtmf = _a.sendDtmf;
                                        var ui_evtUserInput = ui_onEstablished().evtUserInput;
                                        ui_evtUserInput.attach(function (eventData) {
                                            return eventData.userAction === "DTMF";
                                        }, function (_a) {
                                            var signal = _a.signal, duration = _a.duration;
                                            return logic_sendDtmf(signal, duration);
                                        });
                                        ui_evtUserInput.attachOnce(function (_a) {
                                            var userAction = _a.userAction;
                                            return userAction === "HANGUP";
                                        }, function () { return logic_terminate(); });
                                    });
                                });
                                return [2 /*return*/];
                            });
                        }); });
                        phoneCallUi.evtUiOpenedForOutgoingCall.attach(function (eventData) { return __awaiter(_this, void 0, void 0, function () {
                            var phoneNumberRaw, ui_onTerminated, ui_prUserInput, ui_onRingback, _a, logic_prNextState, logic_prTerminated, logic_terminate;
                            var _b;
                            return __generator(this, function (_c) {
                                switch (_c.label) {
                                    case 0:
                                        phoneNumberRaw = eventData.phoneNumberRaw, ui_onTerminated = eventData.onTerminated, ui_prUserInput = eventData.prUserInput, ui_onRingback = eventData.onRingback;
                                        return [4 /*yield*/, sipUserAgent.placeOutgoingCall(lib_1.phoneNumber.build(phoneNumberRaw, (_b = userSim.sim.country) === null || _b === void 0 ? void 0 : _b.iso))];
                                    case 1:
                                        _a = _c.sent(), logic_prNextState = _a.prNextState, logic_prTerminated = _a.prTerminated, logic_terminate = _a.terminate;
                                        logic_prTerminated.then(function () { return ui_onTerminated("Call terminated"); });
                                        ui_prUserInput.then(function () { return logic_terminate(); });
                                        logic_prNextState.then(function (_a) {
                                            var logic_prNextState = _a.prNextState;
                                            var _b = ui_onRingback(), ui_onEstablished = _b.onEstablished, ui_prUserInput = _b.prUserInput;
                                            ui_prUserInput.then(function () { return logic_terminate(); });
                                            logic_prNextState.then(function (_a) {
                                                var logic_sendDtmf = _a.sendDtmf;
                                                var ui_evtUserInput = ui_onEstablished().evtUserInput;
                                                ui_evtUserInput.attach(function (eventData) {
                                                    return eventData.userAction === "DTMF";
                                                }, function (_a) {
                                                    var signal = _a.signal, duration = _a.duration;
                                                    return logic_sendDtmf(signal, duration);
                                                });
                                                ui_evtUserInput.attachOnce(function (_a) {
                                                    var userAction = _a.userAction;
                                                    return userAction === "HANGUP";
                                                }, function () { return logic_terminate(); });
                                            });
                                        });
                                        return [2 /*return*/];
                                }
                            });
                        }); });
                        webphone.userSimEvts.evtNewUpdatedOrDeletedContact.attach(function (_a) {
                            var eventType = _a.eventType, contact = _a.contact;
                            return __awaiter(_this, void 0, void 0, function () {
                                var wdChat;
                                return __generator(this, function (_b) {
                                    switch (_b.label) {
                                        case 0: return [4 /*yield*/, webphone.getOrCreateWdChat({ "number_raw": contact.number_raw })];
                                        case 1:
                                            wdChat = _b.sent();
                                            if (eventType === "NEW") {
                                                return [2 /*return*/];
                                            }
                                            wdApi.updateChatContactInfos(__assign({ wdChat: wdChat }, ((function () {
                                                var _a;
                                                switch (eventType) {
                                                    case "UPDATED":
                                                        return {
                                                            "contactName": contact.name,
                                                            "contactIndexInSim": (_a = contact.mem_index) !== null && _a !== void 0 ? _a : null
                                                        };
                                                    case "DELETED":
                                                        return {
                                                            "contactName": "",
                                                            "contactIndexInSim": null
                                                        };
                                                }
                                            })())));
                                            return [2 /*return*/];
                                    }
                                });
                            });
                        });
                        return [2 /*return*/, webphone];
                }
            });
        });
    };
}
exports.createWebphoneFactory = createWebphoneFactory;
function synchronizeUserSimAndWdInstance(userSim, wdChats, wdApi) {
    var e_1, _a, e_2, _b;
    var _c, _d, _e;
    var tasks = [];
    var wdChatWhoseContactNoLongerInPhonebook = new Set(wdChats);
    var _loop_1 = function (contact) {
        var wdChat = wdChats.find(function (_a) {
            var contactNumber = _a.contactNumber;
            return lib_1.phoneNumber.areSame(contactNumber, contact.number_raw);
        });
        if (!!wdChat) {
            wdChatWhoseContactNoLongerInPhonebook.delete(wdChat);
            tasks[tasks.length] = wdApi.updateChatContactInfos({
                wdChat: wdChat,
                "contactName": contact.name,
                "contactIndexInSim": (_c = contact.mem_index) !== null && _c !== void 0 ? _c : null
            });
        }
        else {
            tasks[tasks.length] = wdApi.newChat({
                wdChats: wdChats,
                "contactNumber": lib_1.phoneNumber.build(contact.number_raw, (_d = userSim.sim.country) === null || _d === void 0 ? void 0 : _d.iso),
                "contactName": contact.name,
                "contactIndexInSim": (_e = contact.mem_index) !== null && _e !== void 0 ? _e : null
            });
        }
    };
    try {
        for (var _f = __values(userSim.phonebook), _g = _f.next(); !_g.done; _g = _f.next()) {
            var contact = _g.value;
            _loop_1(contact);
        }
    }
    catch (e_1_1) { e_1 = { error: e_1_1 }; }
    finally {
        try {
            if (_g && !_g.done && (_a = _f.return)) _a.call(_f);
        }
        finally { if (e_1) throw e_1.error; }
    }
    try {
        for (var wdChatWhoseContactNoLongerInPhonebook_1 = __values(wdChatWhoseContactNoLongerInPhonebook), wdChatWhoseContactNoLongerInPhonebook_1_1 = wdChatWhoseContactNoLongerInPhonebook_1.next(); !wdChatWhoseContactNoLongerInPhonebook_1_1.done; wdChatWhoseContactNoLongerInPhonebook_1_1 = wdChatWhoseContactNoLongerInPhonebook_1.next()) {
            var wdChat = wdChatWhoseContactNoLongerInPhonebook_1_1.value;
            tasks[tasks.length] = wdApi.updateChatContactInfos({
                wdChat: wdChat,
                "contactName": "",
                "contactIndexInSim": null
            });
        }
    }
    catch (e_2_1) { e_2 = { error: e_2_1 }; }
    finally {
        try {
            if (wdChatWhoseContactNoLongerInPhonebook_1_1 && !wdChatWhoseContactNoLongerInPhonebook_1_1.done && (_b = wdChatWhoseContactNoLongerInPhonebook_1.return)) _b.call(wdChatWhoseContactNoLongerInPhonebook_1);
        }
        finally { if (e_2) throw e_2.error; }
    }
    return Promise.all(tasks).then(function () { });
}

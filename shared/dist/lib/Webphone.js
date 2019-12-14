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
var ts_events_extended_1 = require("ts-events-extended");
var wd = require("./types/webphoneData/logic");
var lib_1 = require("phone-number/dist/lib");
var Observable_1 = require("../tools/Observable");
var env_1 = require("./env");
var id_1 = require("../tools/id");
var Webphone;
(function (Webphone) {
    function createFactory(params) {
        return __awaiter(this, void 0, void 0, function () {
            var sipUserAgentCreate, appEvts, getWdApiCallerForSpecificSim, coreApiCaller, phoneCallUiCreateFactory, obsSipRegistrationCount, phoneCallUiCreate;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        sipUserAgentCreate = params.sipUserAgentCreate, appEvts = params.appEvts, getWdApiCallerForSpecificSim = params.getWdApiCallerForSpecificSim, coreApiCaller = params.coreApiCaller, phoneCallUiCreateFactory = params.phoneCallUiCreateFactory;
                        obsSipRegistrationCount = new Observable_1.ObservableImpl(0);
                        return [4 /*yield*/, phoneCallUiCreateFactory((function () {
                                switch (env_1.env.jsRuntimeEnv) {
                                    case "browser": {
                                        return id_1.id({
                                            "assertJsRuntimeEnv": "browser"
                                        });
                                    }
                                    case "react-native": {
                                        return id_1.id({
                                            "assertJsRuntimeEnv": "react-native",
                                            "obsIsAtLeastOneSipRegistration": (function () {
                                                var getIsAtLeastOneSipRegistration = function () { return obsSipRegistrationCount.value !== 0; };
                                                var out = new Observable_1.ObservableImpl(getIsAtLeastOneSipRegistration());
                                                obsSipRegistrationCount.evtChange.attach(function () { return out.onPotentialChange(getIsAtLeastOneSipRegistration()); });
                                                return out;
                                            })()
                                        });
                                    }
                                }
                            })())];
                    case 1:
                        phoneCallUiCreate = _a.sent();
                        return [2 /*return*/, function create(userSim) {
                                return __awaiter(this, void 0, void 0, function () {
                                    var phoneCallUi, sipUserAgent, wdApiCallerForSpecificSim, _a, wdChats, wdEvts, obsIsSipRegistered, webphone;
                                    var _this = this;
                                    return __generator(this, function (_b) {
                                        switch (_b.label) {
                                            case 0:
                                                phoneCallUi = phoneCallUiCreate(userSim);
                                                sipUserAgent = sipUserAgentCreate(userSim);
                                                wdApiCallerForSpecificSim = getWdApiCallerForSpecificSim(userSim.sim.imsi);
                                                return [4 /*yield*/, wdApiCallerForSpecificSim.getUserSimChats(20)];
                                            case 1:
                                                _a = _b.sent(), wdChats = _a.wdChats, wdEvts = _a.wdEvts;
                                                return [4 /*yield*/, synchronizeUserSimAndWdInstance(userSim, wdChats, wdApiCallerForSpecificSim)];
                                            case 2:
                                                _b.sent();
                                                obsIsSipRegistered = new Observable_1.ObservableImpl(sipUserAgent.isRegistered);
                                                obsIsSipRegistered.evtChange.attach(function (isRegistered) {
                                                    return obsSipRegistrationCount.onPotentialChange(obsSipRegistrationCount.value + (isRegistered ? 1 : -1));
                                                });
                                                webphone = {
                                                    userSim: userSim,
                                                    "evtUserSimUpdated": new ts_events_extended_1.SyncEvent(),
                                                    wdChats: wdChats,
                                                    wdEvts: wdEvts,
                                                    obsIsSipRegistered: obsIsSipRegistered,
                                                    "sendMessage": function (wdChat, text) { return __awaiter(_this, void 0, void 0, function () {
                                                        var bundledData, _a, _b, onUaFailedToSendMessage, error_1;
                                                        return __generator(this, function (_c) {
                                                            switch (_c.label) {
                                                                case 0:
                                                                    _a = {
                                                                        "type": "MESSAGE",
                                                                        "text": text,
                                                                        "exactSendDateTime": Date.now()
                                                                    };
                                                                    _b = "appendPromotionalMessage";
                                                                    return [4 /*yield*/, coreApiCaller.shouldAppendPromotionalMessage()];
                                                                case 1:
                                                                    bundledData = (_a[_b] = _c.sent(),
                                                                        _a);
                                                                    return [4 /*yield*/, wdApiCallerForSpecificSim.newMessage(wdChat, {
                                                                            "type": "CLIENT TO SERVER",
                                                                            bundledData: bundledData
                                                                        })];
                                                                case 2:
                                                                    onUaFailedToSendMessage = (_c.sent()).onUaFailedToSendMessage;
                                                                    _c.label = 3;
                                                                case 3:
                                                                    _c.trys.push([3, 5, , 7]);
                                                                    return [4 /*yield*/, sipUserAgent.sendMessage(wdChat.contactNumber, bundledData)];
                                                                case 4:
                                                                    _c.sent();
                                                                    return [3 /*break*/, 7];
                                                                case 5:
                                                                    error_1 = _c.sent();
                                                                    console.log("ua send message error", error_1);
                                                                    return [4 /*yield*/, onUaFailedToSendMessage()];
                                                                case 6:
                                                                    _c.sent();
                                                                    return [3 /*break*/, 7];
                                                                case 7: return [2 /*return*/];
                                                            }
                                                        });
                                                    }); },
                                                    "placeOutgoingCall": function (wdChat) { return __awaiter(_this, void 0, void 0, function () {
                                                        var _a, logic_prNextState, logic_prTerminated, logic_terminate, _b, ui_onTerminated, ui_prUserInput, ui_onRingback;
                                                        return __generator(this, function (_c) {
                                                            switch (_c.label) {
                                                                case 0: return [4 /*yield*/, sipUserAgent.placeOutgoingCall(wdChat.contactNumber)];
                                                                case 1:
                                                                    _a = _c.sent(), logic_prNextState = _a.prNextState, logic_prTerminated = _a.prTerminated, logic_terminate = _a.terminate;
                                                                    _b = phoneCallUi.onOutgoing(wdChat), ui_onTerminated = _b.onTerminated, ui_prUserInput = _b.prUserInput, ui_onRingback = _b.onRingback;
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
                                                    }); },
                                                    "fetchOlderWdMessages": wdApiCallerForSpecificSim.fetchOlderMessages,
                                                    "updateWdChatLastMessageSeen": wdApiCallerForSpecificSim.updateChatLastMessageSeen,
                                                    "getAndOrCreateAndOrUpdateWdChat": function (number, contactName, contactIndexInSim) { return __awaiter(_this, void 0, void 0, function () {
                                                        var wdChat, contactNumber_1;
                                                        return __generator(this, function (_a) {
                                                            switch (_a.label) {
                                                                case 0:
                                                                    wdChat = wdChats.find(function (_a) {
                                                                        var contactNumber = _a.contactNumber;
                                                                        return lib_1.phoneNumber.areSame(contactNumber, number);
                                                                    });
                                                                    if (!!wdChat) return [3 /*break*/, 2];
                                                                    contactNumber_1 = lib_1.phoneNumber.build(number, userSim.sim.country ? userSim.sim.country.iso : undefined);
                                                                    wdApiCallerForSpecificSim.newChat(wdChats, contactNumber_1, contactName === undefined ? "" : contactName, contactIndexInSim === undefined ? null : contactIndexInSim);
                                                                    return [4 /*yield*/, wdEvts.evtNewUpdatedOrDeletedWdChat.waitFor(function (_a) {
                                                                            var wdChat = _a.wdChat, eventType = _a.eventType;
                                                                            return (eventType === "NEW" &&
                                                                                wdChat.contactNumber === contactNumber_1);
                                                                        })];
                                                                case 1:
                                                                    wdChat = (_a.sent()).wdChat;
                                                                    return [3 /*break*/, 4];
                                                                case 2: return [4 /*yield*/, wdApiCallerForSpecificSim.updateChatContactInfos(wdChat, contactName !== undefined ? contactName : wdChat.contactName, contactIndexInSim !== undefined ? contactIndexInSim : wdChat.contactIndexInSim)];
                                                                case 3:
                                                                    _a.sent();
                                                                    _a.label = 4;
                                                                case 4: return [2 /*return*/, wdChat];
                                                            }
                                                        });
                                                    }); },
                                                    "updateNameOfWdChatAndCreateOrUpdateCorespondingContactInSim": function (wdChat, name) { return __awaiter(_this, void 0, void 0, function () {
                                                        var contact;
                                                        return __generator(this, function (_a) {
                                                            switch (_a.label) {
                                                                case 0:
                                                                    contact = findCorrespondingContactInUserSim(userSim, wdChat);
                                                                    if (!!!contact) return [3 /*break*/, 2];
                                                                    return [4 /*yield*/, coreApiCaller.updateContactName(userSim, contact, name)];
                                                                case 1:
                                                                    _a.sent();
                                                                    return [3 /*break*/, 4];
                                                                case 2: return [4 /*yield*/, coreApiCaller.createContact(userSim, name, wdChat.contactNumber)];
                                                                case 3:
                                                                    contact = _a.sent();
                                                                    _a.label = 4;
                                                                case 4: return [4 /*yield*/, webphone.getAndOrCreateAndOrUpdateWdChat(wdChat.contactNumber, name, contact.mem_index !== undefined ? contact.mem_index : null)];
                                                                case 5:
                                                                    _a.sent();
                                                                    return [2 /*return*/];
                                                            }
                                                        });
                                                    }); },
                                                    "deleteWdChatAndCorrespondingContactInSim": function (wdChat) { return __awaiter(_this, void 0, void 0, function () {
                                                        var contact;
                                                        return __generator(this, function (_a) {
                                                            switch (_a.label) {
                                                                case 0:
                                                                    contact = findCorrespondingContactInUserSim(userSim, wdChat);
                                                                    if (!!!contact) return [3 /*break*/, 2];
                                                                    return [4 /*yield*/, coreApiCaller.deleteContact(userSim, contact)];
                                                                case 1:
                                                                    _a.sent();
                                                                    _a.label = 2;
                                                                case 2: return [4 /*yield*/, wdApiCallerForSpecificSim.destroyWdChat(wdChats, wdChat.ref)];
                                                                case 3:
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
                                                                case 0: return [4 /*yield*/, webphone.getAndOrCreateAndOrUpdateWdChat(fromNumber)];
                                                                case 1:
                                                                    wdChat = _b.sent();
                                                                    return [4 /*yield*/, (function () {
                                                                            switch (bundledData.type) {
                                                                                case "MESSAGE":
                                                                                case "CALL ANSWERED BY":
                                                                                case "FROM SIP CALL SUMMARY":
                                                                                case "MISSED CALL":
                                                                                case "MMS NOTIFICATION":
                                                                                    return wdApiCallerForSpecificSim.newMessage(wdChat, { "type": "SERVER TO CLIENT", bundledData: bundledData });
                                                                                case "SEND REPORT":
                                                                                    return wdApiCallerForSpecificSim.notifySendReportReceived(wdChat, bundledData);
                                                                                case "STATUS REPORT":
                                                                                    return wdApiCallerForSpecificSim.notifyStatusReportReceived(wdChat, bundledData);
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
                                                    var fromNumber, logic_terminate, logic_prTerminated, logic_onAccepted, _a, ui_onTerminated, ui_prUserInput, _b, _c;
                                                    return __generator(this, function (_d) {
                                                        switch (_d.label) {
                                                            case 0:
                                                                fromNumber = evtData.fromNumber, logic_terminate = evtData.terminate, logic_prTerminated = evtData.prTerminated, logic_onAccepted = evtData.onAccepted;
                                                                _c = (_b = phoneCallUi).onIncoming;
                                                                return [4 /*yield*/, webphone.getAndOrCreateAndOrUpdateWdChat(fromNumber)];
                                                            case 1:
                                                                _a = _c.apply(_b, [_d.sent()]), ui_onTerminated = _a.onTerminated, ui_prUserInput = _a.prUserInput;
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
                                                        }
                                                    });
                                                }); });
                                                sipUserAgent.evtRegistrationStateChange.attach(function () { return obsIsSipRegistered.onPotentialChange(sipUserAgent.isRegistered); });
                                                appEvts.evtContactCreatedOrUpdated.attach(function (_a) {
                                                    var userSim = _a.userSim;
                                                    return userSim === webphone.userSim;
                                                }, function (_a) {
                                                    var contact = _a.contact;
                                                    return webphone.getAndOrCreateAndOrUpdateWdChat(contact.number_raw, contact.name, contact.mem_index !== undefined ? contact.mem_index : null);
                                                });
                                                appEvts.evtContactDeleted.attach(function (_a) {
                                                    var userSim = _a.userSim;
                                                    return userSim === webphone.userSim;
                                                }, function (_a) {
                                                    var contact = _a.contact;
                                                    return webphone.getAndOrCreateAndOrUpdateWdChat(contact.number_raw, "", null);
                                                });
                                                appEvts.evtSimReachabilityStatusChange.attach(function (userSim) { return userSim === webphone.userSim; }, function () {
                                                    if (!!userSim.reachableSimState) {
                                                        sipUserAgent.register();
                                                    }
                                                    webphone.evtUserSimUpdated.post("reachabilityStatusChange");
                                                });
                                                appEvts.evtSimGsmConnectivityChange.attach(function (userSim) { return userSim === webphone.userSim; }, function () { return webphone.evtUserSimUpdated.post("gsmConnectivityChange"); });
                                                appEvts.evtSimCellSignalStrengthChange.attach(function (userSim) { return userSim === webphone.userSim; }, function () { return webphone.evtUserSimUpdated.post("cellSignalStrengthChange"); });
                                                appEvts.evtOngoingCall.attach(function (userSim) { return userSim === webphone.userSim; }, function () { return webphone.evtUserSimUpdated.post("ongoingCall"); });
                                                if (!!userSim.reachableSimState) {
                                                    sipUserAgent.register();
                                                }
                                                return [2 /*return*/, webphone];
                                        }
                                    });
                                });
                            }];
                }
            });
        });
    }
    Webphone.createFactory = createFactory;
    function sortPutingFirstTheOnesWithMoreRecentActivity(webphone1, webphone2) {
        if (!!webphone1.userSim.reachableSimState !== !!webphone2.userSim.reachableSimState) {
            return !!webphone1.userSim.reachableSimState ? -1 : 1;
        }
        var _a = __read([webphone1, webphone2].map(function (_a) {
            var wdChats = _a.wdChats;
            return wd.getChatWithLatestActivity(wdChats);
        }), 2), wdChat1 = _a[0], wdChat2 = _a[1];
        if (!wdChat1 !== !wdChat2) {
            return !!wdChat1 ? -1 : 1;
        }
        if (!wdChat1) {
            return 0;
        }
        switch (wd.compareChat(wdChat1, wdChat2)) {
            case -1: return 1;
            case 0: return 0;
            case 1: return -1;
        }
    }
    Webphone.sortPutingFirstTheOnesWithMoreRecentActivity = sortPutingFirstTheOnesWithMoreRecentActivity;
    ;
})(Webphone = exports.Webphone || (exports.Webphone = {}));
function findCorrespondingContactInUserSim(userSim, wdChat) {
    return userSim.phonebook.find(function (_a) {
        var mem_index = _a.mem_index, number_raw = _a.number_raw;
        if (wdChat.contactIndexInSim !== null) {
            return mem_index === wdChat.contactIndexInSim;
        }
        return lib_1.phoneNumber.areSame(wdChat.contactNumber, number_raw);
    });
}
function synchronizeUserSimAndWdInstance(userSim, wdChats, wdApiCallerForSpecificSim) {
    return __awaiter(this, void 0, void 0, function () {
        var wdChatWhoseContactNoLongerInPhonebook, _loop_1, _a, _b, contact, e_1_1, wdChatWhoseContactNoLongerInPhonebook_1, wdChatWhoseContactNoLongerInPhonebook_1_1, wdChat, e_2_1;
        var e_1, _c, e_2, _d;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0:
                    wdChatWhoseContactNoLongerInPhonebook = new Set(wdChats);
                    _loop_1 = function (contact) {
                        var wdChat;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    wdChat = wdChats.find(function (_a) {
                                        var contactNumber = _a.contactNumber;
                                        return lib_1.phoneNumber.areSame(contactNumber, contact.number_raw);
                                    });
                                    if (!!!wdChat) return [3 /*break*/, 2];
                                    wdChatWhoseContactNoLongerInPhonebook.delete(wdChat);
                                    return [4 /*yield*/, wdApiCallerForSpecificSim.updateChatContactInfos(wdChat, contact.name, contact.mem_index !== undefined ? contact.mem_index : null)];
                                case 1:
                                    _a.sent();
                                    return [3 /*break*/, 4];
                                case 2: return [4 /*yield*/, wdApiCallerForSpecificSim.newChat(wdChats, lib_1.phoneNumber.build(contact.number_raw, userSim.sim.country ? userSim.sim.country.iso : undefined), contact.name, contact.mem_index !== undefined ? contact.mem_index : null)];
                                case 3:
                                    _a.sent();
                                    _a.label = 4;
                                case 4: return [2 /*return*/];
                            }
                        });
                    };
                    _e.label = 1;
                case 1:
                    _e.trys.push([1, 6, 7, 8]);
                    _a = __values(userSim.phonebook), _b = _a.next();
                    _e.label = 2;
                case 2:
                    if (!!_b.done) return [3 /*break*/, 5];
                    contact = _b.value;
                    return [5 /*yield**/, _loop_1(contact)];
                case 3:
                    _e.sent();
                    _e.label = 4;
                case 4:
                    _b = _a.next();
                    return [3 /*break*/, 2];
                case 5: return [3 /*break*/, 8];
                case 6:
                    e_1_1 = _e.sent();
                    e_1 = { error: e_1_1 };
                    return [3 /*break*/, 8];
                case 7:
                    try {
                        if (_b && !_b.done && (_c = _a.return)) _c.call(_a);
                    }
                    finally { if (e_1) throw e_1.error; }
                    return [7 /*endfinally*/];
                case 8:
                    _e.trys.push([8, 13, 14, 15]);
                    wdChatWhoseContactNoLongerInPhonebook_1 = __values(wdChatWhoseContactNoLongerInPhonebook), wdChatWhoseContactNoLongerInPhonebook_1_1 = wdChatWhoseContactNoLongerInPhonebook_1.next();
                    _e.label = 9;
                case 9:
                    if (!!wdChatWhoseContactNoLongerInPhonebook_1_1.done) return [3 /*break*/, 12];
                    wdChat = wdChatWhoseContactNoLongerInPhonebook_1_1.value;
                    return [4 /*yield*/, wdApiCallerForSpecificSim.updateChatContactInfos(wdChat, "", null)];
                case 10:
                    _e.sent();
                    _e.label = 11;
                case 11:
                    wdChatWhoseContactNoLongerInPhonebook_1_1 = wdChatWhoseContactNoLongerInPhonebook_1.next();
                    return [3 /*break*/, 9];
                case 12: return [3 /*break*/, 15];
                case 13:
                    e_2_1 = _e.sent();
                    e_2 = { error: e_2_1 };
                    return [3 /*break*/, 15];
                case 14:
                    try {
                        if (wdChatWhoseContactNoLongerInPhonebook_1_1 && !wdChatWhoseContactNoLongerInPhonebook_1_1.done && (_d = wdChatWhoseContactNoLongerInPhonebook_1.return)) _d.call(wdChatWhoseContactNoLongerInPhonebook_1);
                    }
                    finally { if (e_2) throw e_2.error; }
                    return [7 /*endfinally*/];
                case 15: return [2 /*return*/];
            }
        });
    });
}

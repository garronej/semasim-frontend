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
var __values = (this && this.__values) || function (o) {
    var m = typeof Symbol === "function" && o[Symbol.iterator], i = 0;
    if (m) return m.call(o);
    return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
};
Object.defineProperty(exports, "__esModule", { value: true });
var ts_events_extended_1 = require("ts-events-extended");
var UiQuickAction_1 = require("./UiQuickAction");
var UiHeader_1 = require("./UiHeader");
var UiPhonebook_1 = require("./UiPhonebook");
var UiConversation_1 = require("./UiConversation");
var UiVoiceCall_1 = require("./UiVoiceCall");
var Ua_1 = require("./Ua");
var loadUiClassHtml_1 = require("../../../shared/dist/lib/tools/loadUiClassHtml");
var remoteApiCaller = require("../../../shared/dist/lib/toBackend/remoteApiCaller");
var localApiHandlers = require("../../../shared/dist/lib/toBackend/localApiHandlers");
var phone_number_1 = require("phone-number");
var bootbox_custom = require("../../../shared/dist/lib/tools/bootbox_custom");
var html = loadUiClassHtml_1.loadUiClassHtml(require("../templates/UiWebphoneController.html"), "UiWebphoneController");
var UiWebphoneController = /** @class */ (function () {
    function UiWebphoneController(userSim, wdInstance) {
        var e_1, _a;
        var _this = this;
        this.userSim = userSim;
        this.wdInstance = wdInstance;
        this.structure = html.structure.clone();
        this.evtUp = new ts_events_extended_1.VoidSyncEvent();
        this.uiConversations = new Map();
        this.ua = new Ua_1.Ua(userSim);
        this.uiVoiceCall = new UiVoiceCall_1.UiVoiceCall(userSim);
        this.uiHeader = new UiHeader_1.UiHeader(userSim);
        this.uiQuickAction = new UiQuickAction_1.UiQuickAction(userSim);
        this.uiPhonebook = new UiPhonebook_1.UiPhonebook(userSim, wdInstance);
        this.registerRemoteNotifyHandlers();
        this.initUa();
        this.initUiHeader();
        this.initUiQuickAction();
        this.initUiPhonebook();
        try {
            for (var _b = __values(this.wdInstance.chats), _c = _b.next(); !_c.done; _c = _b.next()) {
                var wdChat = _c.value;
                this.initUiConversation(wdChat);
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_1) throw e_1.error; }
        }
        $("body").data("dynamic").panels();
        setTimeout(function () { return _this.uiPhonebook.triggerClickOnLastSeenChat(); }, 0);
    }
    UiWebphoneController.create = function (userSim) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        localApiHandlers.evtSimPermissionLost.attachOnce(function (userSim_) { return userSim_ === userSim; }, function () {
                            //TODO: Implement behavior on permission lost.
                            location.reload();
                        });
                        _a = this.bind;
                        _b = [void 0, userSim];
                        return [4 /*yield*/, remoteApiCaller.getOrCreateWdInstance(userSim)];
                    case 1: return [2 /*return*/, new (_a.apply(this, _b.concat([_c.sent()])))()];
                }
            });
        });
    };
    UiWebphoneController.prototype.registerRemoteNotifyHandlers = function () {
        var _this = this;
        localApiHandlers.evtSharedSimUnregistered.attachOnce(function (_a) {
            var userSim = _a.userSim;
            return userSim === _this.userSim;
        }, function () {
            //TODO: Terminate UA.
            _this.structure.remove();
        });
        localApiHandlers.evtContactCreatedOrUpdated.attach(function (_a) {
            var userSim = _a.userSim;
            return userSim === _this.userSim;
        }, function (_a) {
            var contact = _a.contact;
            return __awaiter(_this, void 0, void 0, function () {
                var wdChat, isUpdated, uiConversation;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            wdChat = this.wdInstance.chats.find(function (_a) {
                                var contactNumber = _a.contactNumber;
                                return phone_number_1.phoneNumber.areSame(contactNumber, contact.number_raw);
                            });
                            if (!!wdChat) return [3 /*break*/, 2];
                            return [4 /*yield*/, remoteApiCaller.newWdChat(this.wdInstance, phone_number_1.phoneNumber.build(contact.number_raw, this.userSim.sim.country ? this.userSim.sim.country.iso : undefined), contact.name, contact.mem_index !== undefined ? contact.mem_index : null)];
                        case 1:
                            wdChat = _b.sent();
                            this.initUiConversation(wdChat);
                            return [3 /*break*/, 4];
                        case 2: return [4 /*yield*/, remoteApiCaller.updateWdChatContactInfos(wdChat, contact.name, contact.mem_index !== undefined ? contact.mem_index : null)];
                        case 3:
                            isUpdated = _b.sent();
                            if (!isUpdated) {
                                return [2 /*return*/];
                            }
                            uiConversation = this.uiConversations.get(wdChat);
                            this.uiPhonebook.notifyContactChanged(wdChat);
                            uiConversation.notifyContactNameUpdated();
                            _b.label = 4;
                        case 4: return [2 /*return*/];
                    }
                });
            });
        });
        localApiHandlers.evtContactDeleted.attach(function (_a) {
            var userSim = _a.userSim;
            return userSim === _this.userSim;
        }, function (_a) {
            var contact = _a.contact;
            return __awaiter(_this, void 0, void 0, function () {
                var wdChat, isUpdated, uiConversation;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            wdChat = this.wdInstance.chats.find(function (_a) {
                                var contactNumber = _a.contactNumber;
                                return phone_number_1.phoneNumber.areSame(contactNumber, contact.number_raw);
                            });
                            return [4 /*yield*/, remoteApiCaller.updateWdChatContactInfos(wdChat, "", null)];
                        case 1:
                            isUpdated = _b.sent();
                            if (!isUpdated) {
                                return [2 /*return*/];
                            }
                            uiConversation = this.uiConversations.get(wdChat);
                            this.uiPhonebook.notifyContactChanged(wdChat);
                            uiConversation.notifyContactNameUpdated();
                            return [2 /*return*/];
                    }
                });
            });
        });
        localApiHandlers.evtSimIsOnlineStatusChange.attach(function (userSim) { return userSim === _this.userSim; }, function () { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                if (!this.userSim.isOnline) {
                    if (this.ua.isRegistered) {
                        this.ua.unregister();
                    }
                }
                else {
                    //TODO: reload ui header.
                    this.ua.register();
                }
                return [2 /*return*/];
            });
        }); });
    };
    UiWebphoneController.prototype.initUa = function () {
        var _this = this;
        //TODO: improve
        this.ua.evtRegistrationStateChanged.attach(function (isRegistered) {
            var e_2, _a;
            try {
                for (var _b = __values(_this.uiConversations.values()), _c = _b.next(); !_c.done; _c = _b.next()) {
                    var uiConversation = _c.value;
                    uiConversation.setReadonly(!isRegistered);
                }
            }
            catch (e_2_1) { e_2 = { error: e_2_1 }; }
            finally {
                try {
                    if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
                }
                finally { if (e_2) throw e_2.error; }
            }
        });
        this.ua.evtIncomingMessage.attach(function (_a) {
            var fromNumber = _a.fromNumber, bundledData = _a.bundledData, text = _a.text, onProcessed = _a.onProcessed;
            return __awaiter(_this, void 0, void 0, function () {
                var wdChat, prWdMessage, wdMessage;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0: return [4 /*yield*/, this.getOrCreateChatByPhoneNumber(fromNumber)];
                        case 1:
                            wdChat = _b.sent();
                            prWdMessage = (function () {
                                switch (bundledData.type) {
                                    case "MESSAGE": {
                                        var message = {
                                            "direction": "INCOMING",
                                            "isNotification": false,
                                            "time": bundledData.pduDate.getTime(),
                                            text: text
                                        };
                                        return remoteApiCaller.newWdMessage(wdChat, message);
                                    }
                                    case "SEND REPORT": {
                                        return remoteApiCaller.notifySendReportReceived(wdChat, bundledData);
                                    }
                                    case "STATUS REPORT": {
                                        if (bundledData.messageTowardGsm.uaSim.ua.instance === Ua_1.Ua.instanceId) {
                                            return remoteApiCaller.notifyStatusReportReceived(wdChat, bundledData);
                                        }
                                        else {
                                            var message = {
                                                "time": bundledData.messageTowardGsm.date.getTime(),
                                                "direction": "OUTGOING",
                                                "text": bundledData.messageTowardGsm.text,
                                                "sentBy": (function () {
                                                    if (bundledData.messageTowardGsm.uaSim.ua.userEmail === Ua_1.Ua.email) {
                                                        return { "who": "USER" };
                                                    }
                                                    else {
                                                        return { "who": "OTHER", "email": bundledData.messageTowardGsm.uaSim.ua.userEmail };
                                                    }
                                                })(),
                                                "status": "STATUS REPORT RECEIVED",
                                                "deliveredTime": bundledData.statusReport.isDelivered ?
                                                    bundledData.statusReport.dischargeDate.getTime() : null
                                            };
                                            return remoteApiCaller.newWdMessage(wdChat, message);
                                        }
                                    }
                                    case "CALL ANSWERED BY":
                                    case "MISSED CALL": {
                                        var message = {
                                            "direction": "INCOMING",
                                            "isNotification": true,
                                            "time": bundledData.date.getTime(),
                                            text: text
                                        };
                                        return remoteApiCaller.newWdMessage(wdChat, message);
                                    }
                                }
                            })();
                            return [4 /*yield*/, prWdMessage];
                        case 2:
                            wdMessage = _b.sent();
                            onProcessed();
                            if (!!wdMessage) {
                                this.uiConversations.get(wdChat).newMessage(wdMessage);
                                this.uiPhonebook.notifyContactChanged(wdChat);
                            }
                            return [2 /*return*/];
                    }
                });
            });
        });
        this.ua.evtIncomingCall.attach(function (_a) {
            var fromNumber = _a.fromNumber, terminate = _a.terminate, prTerminated = _a.prTerminated, onAccepted = _a.onAccepted;
            return __awaiter(_this, void 0, void 0, function () {
                var wdChat, _b, onTerminated, prUserInput;
                return __generator(this, function (_c) {
                    switch (_c.label) {
                        case 0: return [4 /*yield*/, this.getOrCreateChatByPhoneNumber(fromNumber)];
                        case 1:
                            wdChat = _c.sent();
                            this.uiPhonebook.triggerContactClick(wdChat);
                            _b = this.uiVoiceCall.onIncoming(wdChat), onTerminated = _b.onTerminated, prUserInput = _b.prUserInput;
                            prTerminated.then(function () { return onTerminated("Call ended"); });
                            prUserInput.then(function (ua) {
                                if (ua.userAction === "REJECT") {
                                    terminate();
                                }
                            });
                            prUserInput.then(function (ua) {
                                if (ua.userAction === "ANSWER") {
                                    var onEstablished_1 = ua.onEstablished;
                                    onAccepted().then(function (_a) {
                                        var sendDtmf = _a.sendDtmf;
                                        var evtUserInput = onEstablished_1().evtUserInput;
                                        evtUserInput.attach(function (eventData) {
                                            return eventData.userAction === "DTMF";
                                        }, function (_a) {
                                            var signal = _a.signal, duration = _a.duration;
                                            return sendDtmf(signal, duration);
                                        });
                                        evtUserInput.attachOnce(function (_a) {
                                            var userAction = _a.userAction;
                                            return userAction === "HANGUP";
                                        }, function () { return terminate(); });
                                    });
                                }
                            });
                            return [2 /*return*/];
                    }
                });
            });
        });
        if (this.userSim.isOnline) {
            this.ua.register();
        }
    };
    UiWebphoneController.prototype.initUiHeader = function () {
        var _this = this;
        this.structure
            .find("div.id_header")
            .append(this.uiHeader.structure);
        this.uiHeader.evtUp.attach(function () { return _this.evtUp.post(); });
    };
    UiWebphoneController.prototype.initUiQuickAction = function () {
        var _this = this;
        this.structure
            .find("div.id_colLeft")
            .append(this.uiQuickAction.structure);
        var onEvt = function (action, number) { return __awaiter(_this, void 0, void 0, function () {
            var wdChat, uiConversation;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getOrCreateChatByPhoneNumber(number)];
                    case 1:
                        wdChat = _a.sent();
                        this.uiPhonebook.triggerContactClick(wdChat);
                        if (action === "SMS") {
                            return [2 /*return*/];
                        }
                        uiConversation = this.uiConversations.get(wdChat);
                        switch (action) {
                            case "CALL":
                                uiConversation.evtVoiceCall.post();
                                break;
                            case "CONTACT":
                                uiConversation.evtUpdateContact.post();
                                break;
                        }
                        return [2 /*return*/];
                }
            });
        }); };
        this.uiQuickAction.evtSms.attach(function (number) { return onEvt("SMS", number); });
        this.uiQuickAction.evtVoiceCall.attach(function (number) { return onEvt("CALL", number); });
        this.uiQuickAction.evtNewContact.attach(function (number) { return onEvt("CONTACT", number); });
    };
    UiWebphoneController.prototype.initUiPhonebook = function () {
        var _this = this;
        this.structure
            .find("div.id_colLeft")
            .append(this.uiPhonebook.structure);
        this.uiPhonebook.evtContactSelected.attach(function (_a) {
            var wdChatPrev = _a.wdChatPrev, wdChat = _a.wdChat;
            if (wdChatPrev) {
                _this.uiConversations.get(wdChatPrev).unselect();
            }
            _this.uiConversations.get(wdChat).setSelected();
        });
    };
    UiWebphoneController.prototype.initUiConversation = function (wdChat) {
        var _this = this;
        var uiConversation = new UiConversation_1.UiConversation(this.userSim, wdChat);
        if (this.ua.isRegistered) {
            uiConversation.setReadonly(false);
        }
        this.uiConversations.set(wdChat, uiConversation);
        this.structure.find("div.id_colRight").append(uiConversation.structure);
        uiConversation.evtChecked.attach(function () { return __awaiter(_this, void 0, void 0, function () {
            var isUpdated;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, remoteApiCaller.updateWdChatIdOfLastMessageSeen(wdChat)];
                    case 1:
                        isUpdated = _a.sent();
                        if (!isUpdated) {
                            return [2 /*return*/];
                        }
                        this.uiPhonebook.notifyContactChanged(wdChat);
                        return [2 /*return*/];
                }
            });
        }); });
        uiConversation.evtSendText.attach(function (text) { return __awaiter(_this, void 0, void 0, function () {
            var exactSendDate, wdMessage, error_1, wdMessageUpdated;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        exactSendDate = new Date();
                        return [4 /*yield*/, remoteApiCaller.newWdMessage(uiConversation.wdChat, (function () {
                                var message = {
                                    "time": exactSendDate.getTime(),
                                    "direction": "OUTGOING",
                                    "status": "PENDING",
                                    text: text,
                                };
                                return message;
                            })())];
                    case 1:
                        wdMessage = _a.sent();
                        uiConversation.newMessage(wdMessage);
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 4, , 6]);
                        return [4 /*yield*/, this.ua.sendMessage(uiConversation.wdChat.contactNumber, text, exactSendDate)];
                    case 3:
                        _a.sent();
                        return [3 /*break*/, 6];
                    case 4:
                        error_1 = _a.sent();
                        console.log("ua send message error", error_1);
                        return [4 /*yield*/, remoteApiCaller.notifyUaFailedToSendMessage(uiConversation.wdChat, wdMessage)];
                    case 5:
                        wdMessageUpdated = _a.sent();
                        uiConversation.newMessage(wdMessageUpdated);
                        return [3 /*break*/, 6];
                    case 6: return [2 /*return*/];
                }
            });
        }); });
        uiConversation.evtVoiceCall.attach(function () {
            var _a = _this.ua.placeOutgoingCall(wdChat.contactNumber), terminate = _a.terminate, prTerminated = _a.prTerminated, prNextState = _a.prNextState;
            var _b = _this.uiVoiceCall.onOutgoing(wdChat), onTerminated = _b.onTerminated, onRingback = _b.onRingback, prUserInput = _b.prUserInput;
            prTerminated.then(function () { return onTerminated("Call terminated"); });
            prUserInput.then(function () { return terminate(); });
            prNextState.then(function (_a) {
                var prNextState = _a.prNextState;
                var _b = onRingback(), onEstablished = _b.onEstablished, prUserInput = _b.prUserInput;
                prUserInput.then(function () { return terminate(); });
                prNextState.then(function (_a) {
                    var sendDtmf = _a.sendDtmf;
                    var evtUserInput = onEstablished().evtUserInput;
                    evtUserInput.attach(function (eventData) {
                        return eventData.userAction === "DTMF";
                    }, function (_a) {
                        var signal = _a.signal, duration = _a.duration;
                        return sendDtmf(signal, duration);
                    });
                    evtUserInput.attachOnce(function (_a) {
                        var userAction = _a.userAction;
                        return userAction === "HANGUP";
                    }, function () { return terminate(); });
                });
            });
        });
        uiConversation.evtUpdateContact.attach(function () { return __awaiter(_this, void 0, void 0, function () {
            var name, contact, isUpdated;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, new Promise(function (resolve) { return bootbox_custom.prompt({
                            "title": "Contact name for " + wdChat.contactNumber,
                            "value": wdChat.contactName || "",
                            "callback": function (result) { return resolve(result); },
                        }); })];
                    case 1:
                        name = _a.sent();
                        if (!name) {
                            return [2 /*return*/, undefined];
                        }
                        bootbox_custom.loading("Create or update contact");
                        contact = this.userSim.phonebook.find(function (_a) {
                            var mem_index = _a.mem_index, number_raw = _a.number_raw;
                            if (wdChat.contactIndexInSim !== null) {
                                return mem_index === wdChat.contactIndexInSim;
                            }
                            return phone_number_1.phoneNumber.areSame(wdChat.contactNumber, number_raw);
                        });
                        if (!!!contact) return [3 /*break*/, 3];
                        return [4 /*yield*/, remoteApiCaller.updateContactName(this.userSim, contact, name)];
                    case 2:
                        _a.sent();
                        return [3 /*break*/, 5];
                    case 3: return [4 /*yield*/, remoteApiCaller.createContact(this.userSim, name, wdChat.contactNumber)];
                    case 4:
                        contact = _a.sent();
                        _a.label = 5;
                    case 5: return [4 /*yield*/, remoteApiCaller.updateWdChatContactInfos(wdChat, name, contact.mem_index !== undefined ? contact.mem_index : null)];
                    case 6:
                        isUpdated = _a.sent();
                        bootbox_custom.dismissLoading();
                        if (!isUpdated) {
                            return [2 /*return*/];
                        }
                        this.uiPhonebook.notifyContactChanged(wdChat);
                        uiConversation.notifyContactNameUpdated();
                        return [2 /*return*/];
                }
            });
        }); });
        uiConversation.evtDelete.attach(function () { return __awaiter(_this, void 0, void 0, function () {
            var shouldProceed, contact;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, new Promise(function (resolve) { return bootbox_custom.confirm({
                            "title": "Delete chat",
                            "message": "Delete contact and conversation ?",
                            callback: function (result) { return resolve(result); }
                        }); })];
                    case 1:
                        shouldProceed = _a.sent();
                        if (!shouldProceed) {
                            return [2 /*return*/];
                        }
                        bootbox_custom.loading("Deleting contact and conversation");
                        contact = this.userSim.phonebook.find(function (_a) {
                            var mem_index = _a.mem_index, number_raw = _a.number_raw;
                            if (wdChat.contactIndexInSim !== null) {
                                return mem_index === wdChat.contactIndexInSim;
                            }
                            return phone_number_1.phoneNumber.areSame(wdChat.contactNumber, number_raw);
                        });
                        if (!!!contact) return [3 /*break*/, 3];
                        return [4 /*yield*/, remoteApiCaller.deleteContact(this.userSim, contact)];
                    case 2:
                        _a.sent();
                        _a.label = 3;
                    case 3: return [4 /*yield*/, remoteApiCaller.destroyWdChat(this.wdInstance, wdChat)];
                    case 4:
                        _a.sent();
                        bootbox_custom.dismissLoading();
                        this.uiPhonebook.notifyContactChanged(wdChat);
                        uiConversation.structure.detach();
                        this.uiConversations.delete(wdChat);
                        this.uiPhonebook.triggerClickOnLastSeenChat();
                        return [2 /*return*/];
                }
            });
        }); });
        uiConversation.evtLoadMore.attach(function (_a) {
            var onLoaded = _a.onLoaded;
            return remoteApiCaller.fetchOlderWdMessages(wdChat)
                .then(function (wdMessages) { return onLoaded(wdMessages); });
        });
    };
    UiWebphoneController.prototype.getOrCreateChatByPhoneNumber = function (number) {
        return __awaiter(this, void 0, void 0, function () {
            var wdChat;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        wdChat = this.wdInstance.chats.find(function (_a) {
                            var contactNumber = _a.contactNumber;
                            return contactNumber === number;
                        });
                        if (!!wdChat) return [3 /*break*/, 2];
                        return [4 /*yield*/, remoteApiCaller.newWdChat(this.wdInstance, number, "", null)];
                    case 1:
                        wdChat = _a.sent();
                        this.uiPhonebook.insertContact(wdChat);
                        this.initUiConversation(wdChat);
                        $('body').data('dynamic').panels();
                        _a.label = 2;
                    case 2: return [2 /*return*/, wdChat];
                }
            });
        });
    };
    return UiWebphoneController;
}());
exports.UiWebphoneController = UiWebphoneController;

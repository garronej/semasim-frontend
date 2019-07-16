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
Object.defineProperty(exports, "__esModule", { value: true });
var sendRequest_1 = require("./sendRequest");
var apiDeclaration = require("../../../sip_api_declarations/backendToUa");
var phone_number_1 = require("phone-number");
var wd = require("../../types/webphoneData/logic");
var cryptoLib = require("crypto-lib");
//WebData sync things :
var wdCrypto;
/** Must be called prior any wd related API call */
function setWebDataEncryptorDescriptor(encryptorDecryptor) {
    var buildWdCrypto = setWebDataEncryptorDescriptor.buildWdCrypto;
    wdCrypto = buildWdCrypto(encryptorDecryptor);
}
exports.setWebDataEncryptorDescriptor = setWebDataEncryptorDescriptor;
(function (setWebDataEncryptorDescriptor) {
    setWebDataEncryptorDescriptor.buildWdCrypto = function (encryptorDecryptor) { return ({
        encryptorDecryptor: encryptorDecryptor,
        "stringifyThenEncrypt": cryptoLib.stringifyThenEncryptFactory(encryptorDecryptor),
        "decryptThenParse": cryptoLib.decryptThenParseFactory(encryptorDecryptor)
    }); };
})(setWebDataEncryptorDescriptor = exports.setWebDataEncryptorDescriptor || (exports.setWebDataEncryptorDescriptor = {}));
exports.getOrCreateWdInstance = (function () {
    var methodName = apiDeclaration.getOrCreateInstance.methodName;
    function synchronizeUserSimAndWdInstance(userSim, wdInstance) {
        return __awaiter(this, void 0, void 0, function () {
            var wdChatWhoseContactNoLongerInPhonebook, _loop_1, _a, _b, contact, e_1_1, wdChatWhoseContactNoLongerInPhonebook_1, wdChatWhoseContactNoLongerInPhonebook_1_1, wdChat, e_2_1;
            var e_1, _c, e_2, _d;
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0:
                        wdChatWhoseContactNoLongerInPhonebook = new Set(wdInstance.chats);
                        _loop_1 = function (contact) {
                            var wdChat;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        wdChat = wdInstance.chats.find(function (_a) {
                                            var contactNumber = _a.contactNumber;
                                            return phone_number_1.phoneNumber.areSame(contactNumber, contact.number_raw);
                                        });
                                        if (!!!wdChat) return [3 /*break*/, 2];
                                        wdChatWhoseContactNoLongerInPhonebook.delete(wdChat);
                                        return [4 /*yield*/, updateWdChatContactInfos(wdChat, contact.name, contact.mem_index !== undefined ? contact.mem_index : null)];
                                    case 1:
                                        _a.sent();
                                        return [3 /*break*/, 4];
                                    case 2: return [4 /*yield*/, exports.newWdChat(wdInstance, phone_number_1.phoneNumber.build(contact.number_raw, userSim.sim.country ? userSim.sim.country.iso : undefined), contact.name, contact.mem_index !== undefined ? contact.mem_index : null)];
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
                        return [4 /*yield*/, updateWdChatContactInfos(wdChat, "", null)];
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
    return function (userSim) {
        return __awaiter(this, void 0, void 0, function () {
            var imsi, _a, instance_id, chats, wdInstance, _b, _c;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        imsi = userSim.sim.imsi;
                        return [4 /*yield*/, sendRequest_1.sendRequest(methodName, { imsi: imsi })];
                    case 1:
                        _a = _d.sent(), instance_id = _a.instance_id, chats = _a.chats;
                        _b = {
                            "id_": instance_id,
                            imsi: imsi
                        };
                        _c = "chats";
                        return [4 /*yield*/, Promise.all(chats.map(function (chat) { return wd.decryptChat(wdCrypto.encryptorDecryptor, chat); }))];
                    case 2:
                        wdInstance = (_b[_c] = _d.sent(),
                            _b);
                        return [4 /*yield*/, synchronizeUserSimAndWdInstance(userSim, wdInstance)];
                    case 3:
                        _d.sent();
                        return [2 /*return*/, wdInstance];
                }
            });
        });
    };
})();
exports.newWdChat = (function () {
    var methodName = apiDeclaration.newChat.methodName;
    return function (wdInstance, contactNumber, contactName, contactIndexInSim) {
        return __awaiter(this, void 0, void 0, function () {
            var chat_id, _a, _b, wdChat;
            var _this = this;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _a = sendRequest_1.sendRequest;
                        _b = [methodName];
                        return [4 /*yield*/, (function () { return __awaiter(_this, void 0, void 0, function () {
                                var _a, encryptedContactNumber, encryptedContactName, encryptedContactIndexInSim;
                                return __generator(this, function (_b) {
                                    switch (_b.label) {
                                        case 0: return [4 /*yield*/, Promise.all([contactNumber, contactName, contactIndexInSim]
                                                .map(function (v) { return wdCrypto.stringifyThenEncrypt(v); }))];
                                        case 1:
                                            _a = __read.apply(void 0, [_b.sent(), 3]), encryptedContactNumber = _a[0], encryptedContactName = _a[1], encryptedContactIndexInSim = _a[2];
                                            return [2 /*return*/, {
                                                    "instance_id": wdInstance.id_,
                                                    "contactNumber": { "encrypted_string": encryptedContactNumber },
                                                    "contactName": { "encrypted_string": encryptedContactName },
                                                    "contactIndexInSim": { "encrypted_number_or_null": encryptedContactIndexInSim }
                                                }];
                                    }
                                });
                            }); })()];
                    case 1: return [4 /*yield*/, _a.apply(void 0, _b.concat([_c.sent()]))];
                    case 2:
                        chat_id = (_c.sent()).chat_id;
                        wdChat = {
                            "id_": chat_id,
                            contactNumber: contactNumber,
                            contactName: contactName,
                            contactIndexInSim: contactIndexInSim,
                            "idOfLastMessageSeen": null,
                            "messages": []
                        };
                        wdInstance.chats.push(wdChat);
                        return [2 /*return*/, wdChat];
                }
            });
        });
    };
})();
exports.fetchOlderWdMessages = (function () {
    var methodName = apiDeclaration.fetchOlderMessages.methodName;
    return function (wdChat) {
        return __awaiter(this, void 0, void 0, function () {
            var lastMessage, olderThanMessageId, olderWdMessages, _a, _b, set, i, message, _c, _d, message;
            var e_3, _e;
            return __generator(this, function (_f) {
                switch (_f.label) {
                    case 0:
                        lastMessage = wdChat.messages.slice(-1).pop();
                        if (!lastMessage) {
                            return [2 /*return*/, []];
                        }
                        olderThanMessageId = wdChat.messages[0].id_;
                        _b = (_a = Promise).all;
                        return [4 /*yield*/, sendRequest_1.sendRequest(methodName, {
                                "chat_id": wdChat.id_,
                                olderThanMessageId: olderThanMessageId
                            })];
                    case 1: return [4 /*yield*/, _b.apply(_a, [(_f.sent()).map(function (encryptedOlderMessage) {
                                return wd.decryptMessage(wdCrypto.encryptorDecryptor, encryptedOlderMessage);
                            })])];
                    case 2:
                        olderWdMessages = _f.sent();
                        set = new Set(wdChat.messages.map(function (_a) {
                            var id_ = _a.id_;
                            return id_;
                        }));
                        for (i = olderWdMessages.length - 1; i >= 0; i--) {
                            message = olderWdMessages[i];
                            if (set.has(message.id_)) {
                                continue;
                            }
                            wdChat.messages.unshift(message);
                        }
                        wdChat.messages.sort(wd.compareMessage);
                        olderWdMessages = [];
                        try {
                            for (_c = __values(wdChat.messages), _d = _c.next(); !_d.done; _d = _c.next()) {
                                message = _d.value;
                                if (message.id_ === olderThanMessageId) {
                                    break;
                                }
                                olderWdMessages.push(message);
                            }
                        }
                        catch (e_3_1) { e_3 = { error: e_3_1 }; }
                        finally {
                            try {
                                if (_d && !_d.done && (_e = _c.return)) _e.call(_c);
                            }
                            finally { if (e_3) throw e_3.error; }
                        }
                        return [2 /*return*/, olderWdMessages];
                }
            });
        });
    };
})();
/**
 *
 * If same as before the request won't be sent
 *
 * return true if update was performed
 *
 * */
function updateWdChatIdOfLastMessageSeen(wdChat) {
    return __awaiter(this, void 0, void 0, function () {
        var message_id, i, message;
        return __generator(this, function (_a) {
            message_id = undefined;
            for (i = wdChat.messages.length - 1; i >= 0; i--) {
                message = wdChat.messages[i];
                if (message.direction === "INCOMING" ||
                    (message.status === "STATUS REPORT RECEIVED" &&
                        message.sentBy.who === "OTHER")) {
                    message_id = message.id_;
                    break;
                }
            }
            return [2 /*return*/, updateWdChat(wdChat, { "idOfLastMessageSeen": message_id })];
        });
    });
}
exports.updateWdChatIdOfLastMessageSeen = updateWdChatIdOfLastMessageSeen;
/**
 *
 * If same as before the request won't be sent
 *
 * return true if update was performed
 *
 * */
function updateWdChatContactInfos(wdChat, contactName, contactIndexInSim) {
    return updateWdChat(wdChat, {
        contactName: contactName,
        contactIndexInSim: contactIndexInSim
    });
}
exports.updateWdChatContactInfos = updateWdChatContactInfos;
var updateWdChat = (function () {
    var methodName = apiDeclaration.updateChat.methodName;
    /**
     *
     * If same as before the request won't be sent
     *
     * return true if update performed
     *
     * */
    return function (wdChat, fields) {
        return __awaiter(this, void 0, void 0, function () {
            var params, _a, _b, key, value, _c, _d, _e, _f, _g, _h, _j, _k, _l, e_4_1, key;
            var e_4, _m;
            return __generator(this, function (_o) {
                switch (_o.label) {
                    case 0:
                        params = { "chat_id": wdChat.id_ };
                        _o.label = 1;
                    case 1:
                        _o.trys.push([1, 10, 11, 12]);
                        _a = __values(Object.keys(fields)), _b = _a.next();
                        _o.label = 2;
                    case 2:
                        if (!!_b.done) return [3 /*break*/, 9];
                        key = _b.value;
                        value = fields[key];
                        if (value === undefined || wdChat[key] === value) {
                            return [3 /*break*/, 8];
                        }
                        _c = key;
                        switch (_c) {
                            case "contactName": return [3 /*break*/, 3];
                            case "contactIndexInSim": return [3 /*break*/, 5];
                            case "idOfLastMessageSeen": return [3 /*break*/, 7];
                        }
                        return [3 /*break*/, 8];
                    case 3:
                        _d = params;
                        _e = key;
                        _f = {};
                        _g = "encrypted_string";
                        return [4 /*yield*/, wdCrypto.stringifyThenEncrypt(value)];
                    case 4:
                        _d[_e] = (_f[_g] = _o.sent(),
                            _f);
                        return [3 /*break*/, 8];
                    case 5:
                        _h = params;
                        _j = key;
                        _k = {};
                        _l = "encrypted_number_or_null";
                        return [4 /*yield*/, wdCrypto.stringifyThenEncrypt(value)];
                    case 6:
                        _h[_j] = (_k[_l] = _o.sent(),
                            _k);
                        return [3 /*break*/, 8];
                    case 7:
                        params[key] = value;
                        return [3 /*break*/, 8];
                    case 8:
                        _b = _a.next();
                        return [3 /*break*/, 2];
                    case 9: return [3 /*break*/, 12];
                    case 10:
                        e_4_1 = _o.sent();
                        e_4 = { error: e_4_1 };
                        return [3 /*break*/, 12];
                    case 11:
                        try {
                            if (_b && !_b.done && (_m = _a.return)) _m.call(_a);
                        }
                        finally { if (e_4) throw e_4.error; }
                        return [7 /*endfinally*/];
                    case 12:
                        if (Object.keys(params).length === 1) {
                            return [2 /*return*/, false];
                        }
                        return [4 /*yield*/, sendRequest_1.sendRequest(methodName, params)];
                    case 13:
                        _o.sent();
                        for (key in fields) {
                            wdChat[key] = fields[key];
                        }
                        return [2 /*return*/, true];
                }
            });
        });
    };
})();
exports.destroyWdChat = (function () {
    var methodName = apiDeclaration.destroyChat.methodName;
    return function (wdInstance, wdChat) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, sendRequest_1.sendRequest(methodName, { "chat_id": wdChat.id_ })];
                    case 1:
                        _a.sent();
                        wdInstance.chats.splice(wdInstance.chats.indexOf(wdChat), 1);
                        return [2 /*return*/];
                }
            });
        });
    };
})();
function newWdMessage(wdChat, message_) {
    return __awaiter(this, void 0, void 0, function () {
        var message, isSameWdMessage, methodName, message_id, _a, _b, _c, _d, wdMessage;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0:
                    message = message_;
                    isSameWdMessage = function (wdMessage) {
                        var areSame = function (o1, o2) {
                            for (var key in o1) {
                                var value = o1[key];
                                if (value instanceof Object) {
                                    if (!areSame(value, o2[key])) {
                                        return false;
                                    }
                                }
                                else {
                                    if (value !== o2[key]) {
                                        return false;
                                    }
                                }
                            }
                            return true;
                        };
                        return areSame(wdMessage, message_);
                    };
                    if (!!wdChat.messages.find(isSameWdMessage)) {
                        return [2 /*return*/, undefined];
                    }
                    methodName = apiDeclaration.newMessage.methodName;
                    _a = sendRequest_1.sendRequest;
                    _b = [methodName];
                    _c = {
                        "chat_id": wdChat.id_
                    };
                    _d = "message";
                    return [4 /*yield*/, wd.encryptMessage(wdCrypto.encryptorDecryptor, message)];
                case 1: return [4 /*yield*/, _a.apply(void 0, _b.concat([(_c[_d] = (_e.sent()),
                            _c)]))];
                case 2:
                    message_id = (_e.sent()).message_id;
                    wdMessage = (__assign({}, message, { "id_": message_id }));
                    wdChat.messages.push(wdMessage);
                    wdChat.messages.sort(wd.compareMessage);
                    return [2 /*return*/, wdMessage];
            }
        });
    });
}
exports.newWdMessage = newWdMessage;
function notifyUaFailedToSendMessage(wdChat, wdMessage) {
    return _notifySendReportReceived(wdChat, wdMessage, false);
}
exports.notifyUaFailedToSendMessage = notifyUaFailedToSendMessage;
function notifySendReportReceived(wdChat, sendReportBundledData) {
    var wdMessage = (function () {
        for (var i = wdChat.messages.length - 1; i >= 0; i--) {
            var message = wdChat.messages[i];
            if (message.direction === "OUTGOING" &&
                message.status === "PENDING" &&
                message.time === sendReportBundledData.messageTowardGsm.dateTime) {
                return message;
            }
        }
        return undefined;
    })();
    if (!wdMessage) {
        return Promise.resolve(undefined);
    }
    var isSentSuccessfully = sendReportBundledData.sendDateTime !== null;
    return _notifySendReportReceived(wdChat, wdMessage, isSentSuccessfully);
}
exports.notifySendReportReceived = notifySendReportReceived;
var _notifySendReportReceived = (function () {
    var methodName = apiDeclaration.notifySendReportReceived.methodName;
    return function (wdChat, wdMessage, isSentSuccessfully) {
        return __awaiter(this, void 0, void 0, function () {
            var updatedWdMessage;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, sendRequest_1.sendRequest(methodName, {
                            "message_id": wdMessage.id_,
                            isSentSuccessfully: isSentSuccessfully
                        })];
                    case 1:
                        _a.sent();
                        updatedWdMessage = {
                            "id_": wdMessage.id_,
                            "time": wdMessage.time,
                            "direction": "OUTGOING",
                            "text": wdMessage.text,
                            "status": "SEND REPORT RECEIVED",
                            isSentSuccessfully: isSentSuccessfully
                        };
                        wdChat.messages[wdChat.messages.indexOf(wdMessage)] = updatedWdMessage;
                        wdChat.messages.sort(wd.compareMessage);
                        return [2 /*return*/, updatedWdMessage];
                }
            });
        });
    };
})();
exports.notifyStatusReportReceived = (function () {
    var methodName = apiDeclaration.notifyStatusReportReceived.methodName;
    /** Assert the status report state that the message was sent from this device. */
    return function (wdChat, statusReportBundledData) {
        return __awaiter(this, void 0, void 0, function () {
            var wdMessage, deliveredTime, updatedWdMessage;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        wdMessage = (function () {
                            for (var i = wdChat.messages.length - 1; i >= 0; i--) {
                                var message = wdChat.messages[i];
                                if (message.direction === "OUTGOING" &&
                                    message.status === "SEND REPORT RECEIVED" &&
                                    message.time === statusReportBundledData.messageTowardGsm.dateTime) {
                                    return message;
                                }
                            }
                            return undefined;
                        })();
                        if (!wdMessage) {
                            return [2 /*return*/, undefined];
                        }
                        deliveredTime = statusReportBundledData.statusReport.isDelivered ?
                            statusReportBundledData.statusReport.dischargeDateTime : null;
                        return [4 /*yield*/, sendRequest_1.sendRequest(methodName, {
                                "message_id": wdMessage.id_,
                                deliveredTime: deliveredTime
                            })];
                    case 1:
                        _a.sent();
                        updatedWdMessage = {
                            "id_": wdMessage.id_,
                            "time": wdMessage.time,
                            "direction": "OUTGOING",
                            "text": wdMessage.text,
                            "sentBy": { "who": "USER" },
                            "status": "STATUS REPORT RECEIVED",
                            deliveredTime: deliveredTime
                        };
                        wdChat.messages[wdChat.messages.indexOf(wdMessage)] = updatedWdMessage;
                        wdChat.messages.sort(wd.compareMessage);
                        return [2 /*return*/, updatedWdMessage];
                }
            });
        });
    };
})();

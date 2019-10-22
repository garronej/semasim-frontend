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
var serializer_1 = require("crypto-lib/dist/async/serializer");
var isAscendingAlphabeticalOrder_1 = require("../../../tools/isAscendingAlphabeticalOrder");
function decryptChat(decryptor, chat) {
    return __awaiter(this, void 0, void 0, function () {
        var decryptThenParse, _a, contactNumber, contactName, contactIndexInSim, messages;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    decryptThenParse = serializer_1.decryptThenParseFactory(decryptor);
                    return [4 /*yield*/, Promise.all([
                            decryptThenParse(chat.contactNumber.encrypted_string),
                            decryptThenParse(chat.contactName.encrypted_string),
                            decryptThenParse(chat.contactIndexInSim.encrypted_number_or_null),
                            Promise.all(chat.messages.map(function (message) { return decryptMessage(decryptor, message); }))
                        ])];
                case 1:
                    _a = __read.apply(void 0, [_b.sent(), 4]), contactNumber = _a[0], contactName = _a[1], contactIndexInSim = _a[2], messages = _a[3];
                    return [2 /*return*/, __assign(__assign({}, chat), { contactNumber: contactNumber, contactName: contactName, contactIndexInSim: contactIndexInSim, messages: messages })];
            }
        });
    });
}
exports.decryptChat = decryptChat;
/** If input message have no id so will the output message */
function encryptMessage(encryptor, message) {
    return __awaiter(this, void 0, void 0, function () {
        var stringifyThenEncrypt, encryptedMessage, _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
        return __generator(this, function (_m) {
            switch (_m.label) {
                case 0:
                    stringifyThenEncrypt = serializer_1.stringifyThenEncryptFactory(encryptor);
                    _a = [__assign({}, message)];
                    _b = {};
                    _c = "text";
                    _d = {};
                    _e = "encrypted_string";
                    return [4 /*yield*/, stringifyThenEncrypt(message.text)];
                case 1:
                    encryptedMessage = __assign.apply(void 0, _a.concat([(_b[_c] = (_d[_e] = _m.sent(), _d), _b)]));
                    if (!("sentBy" in message && message.sentBy.who === "OTHER")) return [3 /*break*/, 3];
                    _f = encryptedMessage;
                    _g = [__assign({}, message.sentBy)];
                    _h = {};
                    _j = "email";
                    _k = {};
                    _l = "encrypted_string";
                    return [4 /*yield*/, stringifyThenEncrypt(message.sentBy.email)];
                case 2:
                    _f.sentBy = __assign.apply(void 0, _g.concat([(_h[_j] = (_k[_l] = _m.sent(), _k), _h)]));
                    _m.label = 3;
                case 3: return [2 /*return*/, encryptedMessage];
            }
        });
    });
}
exports.encryptMessage = encryptMessage;
function decryptMessage(decryptor, encryptedMessage) {
    return __awaiter(this, void 0, void 0, function () {
        var decryptThenParse, message, _a, _b, _c, _d, _e, _f, _g;
        return __generator(this, function (_h) {
            switch (_h.label) {
                case 0:
                    decryptThenParse = serializer_1.decryptThenParseFactory(decryptor);
                    _a = [__assign({}, encryptedMessage)];
                    _b = {};
                    _c = "text";
                    return [4 /*yield*/, decryptThenParse(encryptedMessage.text.encrypted_string)];
                case 1:
                    message = __assign.apply(void 0, _a.concat([(_b[_c] = _h.sent(), _b)]));
                    if (!("sentBy" in encryptedMessage && encryptedMessage.sentBy.who === "OTHER")) return [3 /*break*/, 3];
                    _d = message;
                    _e = [__assign({}, encryptedMessage.sentBy)];
                    _f = {};
                    _g = "email";
                    return [4 /*yield*/, decryptThenParse(encryptedMessage.sentBy.email.encrypted_string)];
                case 2:
                    _d.sentBy = __assign.apply(void 0, _e.concat([(_f[_g] = _h.sent(), _f)]));
                    _h.label = 3;
                case 3: return [2 /*return*/, message];
            }
        });
    });
}
exports.decryptMessage = decryptMessage;
/** Best guess on previously opened chat: */
function getChatWithLatestActivity(wdInstance) {
    var e_1, _a;
    //TODO: what if last seen message not loaded.
    var findMessageByIdAndGetTime = function (wdChat, message_id) {
        if (message_id === null) {
            return 0;
        }
        for (var i = wdChat.messages.length - 1; i >= 0; i--) {
            var message = wdChat.messages[i];
            if (message.id_ === message_id) {
                return message.time;
            }
        }
        return 0;
    };
    var findLastMessageSentByUserAndGetTime = function (chat) {
        for (var i = chat.messages.length - 1; i >= 0; i--) {
            var message = chat.messages[i];
            if (message.direction === "OUTGOING" &&
                (message.status !== "STATUS REPORT RECEIVED" ||
                    message.sentBy.who === "USER")) {
                return message.time;
            }
        }
        return 0;
    };
    var max = 0;
    var chat = undefined;
    try {
        for (var _b = __values(wdInstance.chats), _c = _b.next(); !_c.done; _c = _b.next()) {
            var _chat = _c.value;
            var curr = Math.max(findMessageByIdAndGetTime(_chat, _chat.idOfLastMessageSeen), findLastMessageSentByUserAndGetTime(_chat));
            if (curr > max) {
                max = curr;
                chat = _chat;
            }
        }
    }
    catch (e_1_1) { e_1 = { error: e_1_1 }; }
    finally {
        try {
            if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
        }
        finally { if (e_1) throw e_1.error; }
    }
    return chat;
}
exports.getChatWithLatestActivity = getChatWithLatestActivity;
/**
 *
 * message1  < ( older than )  message1  => -1
 * message1 === message2  => 0
 * message1  >  message2  => 1
 *
 * Produce an ordering or messages that reflect the
 * real temporality of a conversation.
 *
 */
function compareMessage(message1, message2) {
    var getOrderingTime = function (message) {
        if (message.direction === "OUTGOING") {
            if (message.status === "STATUS REPORT RECEIVED") {
                if (message.deliveredTime !== null) {
                    return message.deliveredTime;
                }
            }
            else if (!(message.status === "SEND REPORT RECEIVED" && !message.isSentSuccessfully)) {
                var time = message.time + 60 * 1000;
                if (time > Date.now()) {
                    return time;
                }
            }
        }
        return message.time;
    };
    //return Math.sign(getOrderingTime(message1) - getOrderingTime(message2)) as (-1 | 0 | 1);
    var diff = getOrderingTime(message1) - getOrderingTime(message2);
    return diff !== 0 ? (diff > 0 ? 1 : -1) : 0;
}
exports.compareMessage = compareMessage;
/**
 *
 * chat1  <  chat2  => -1
 * chat1 === chat2  => 0
 * chat1  >  chat2  => 1
 *
 * Sorting a set of chats in decreasing order
 * will result in the following:
 *
 * -First chat with the more recent activity.
 * ( more resent message according to message ordering )
 * -Then chats that does not contain message will be
 * ordered in alphabetical order against their contact's name.
 * -Then the chats with no messages and no contact name
 * will be sorted in a non specified, deterministic order.
 *
 */
function compareChat(chat1, chat2) {
    var hasContactName = function (chat) { return chat.contactName !== ""; };
    var hasMessages = function (chat) { return chat.messages.length !== 0; };
    if (hasMessages(chat1) || hasMessages(chat2)) {
        if (!hasMessages(chat1)) {
            return -1;
        }
        if (!hasMessages(chat2)) {
            return 1;
        }
        //Assuming message are already ordered within chat.
        return compareMessage(chat1.messages.slice(-1).pop(), chat2.messages.slice(-1).pop());
    }
    else if (hasContactName(chat1) || hasContactName(chat2)) {
        if (!hasContactName(chat1)) {
            return -1;
        }
        if (!hasContactName(chat2)) {
            return 1;
        }
        return isAscendingAlphabeticalOrder_1.isAscendingAlphabeticalOrder(chat1.contactName, chat2.contactName) ? 1 : -1;
    }
    else {
        return chat1.contactNumber < chat2.contactNumber ? -1 : 1;
    }
}
exports.compareChat = compareChat;
function getUnreadMessagesCount(wdChat) {
    var count = 0;
    for (var i = wdChat.messages.length - 1; i >= 0; i--) {
        var message = wdChat.messages[i];
        if (message.direction === "INCOMING" ||
            (message.status === "STATUS REPORT RECEIVED" &&
                message.sentBy.who === "OTHER")) {
            if (wdChat.idOfLastMessageSeen === message.id_) {
                break;
            }
            count++;
        }
    }
    return count;
}
exports.getUnreadMessagesCount = getUnreadMessagesCount;

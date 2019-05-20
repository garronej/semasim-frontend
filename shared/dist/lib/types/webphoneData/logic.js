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
var cryptoLib = require("../../../tools/crypto/library");
var isAscendingAlphabeticalOrder_1 = require("../../../tools/isAscendingAlphabeticalOrder");
function decryptChat(decryptor, chat) {
    var decryptThenParse = cryptoLib.decryptThenParseFactory(decryptor);
    return __assign({}, chat, { "contactNumber": decryptThenParse(chat.contactNumber.encrypted_string), "contactName": decryptThenParse(chat.contactName.encrypted_string), "contactIndexInSim": decryptThenParse(chat.contactIndexInSim.encrypted_number_or_null), "messages": chat.messages.map(function (message) { return decryptMessage(decryptor, message); }) });
}
exports.decryptChat = decryptChat;
/** If input message have no id so will the output message */
function encryptMessage(encryptor, message) {
    var stringifyThenEncrypt = cryptoLib.stringifyThenEncryptFactory(encryptor);
    var encryptedMessage = __assign({}, message, { "text": { "encrypted_string": stringifyThenEncrypt(message.text) } });
    if ("sentBy" in message && message.sentBy.who === "OTHER") {
        encryptedMessage.sentBy = __assign({}, message.sentBy, { "email": { "encrypted_string": stringifyThenEncrypt(message.sentBy.email) } });
    }
    return encryptedMessage;
}
exports.encryptMessage = encryptMessage;
function decryptMessage(decryptor, encryptedMessage) {
    var decryptThenParse = cryptoLib.decryptThenParseFactory(decryptor);
    var message = __assign({}, encryptedMessage, { "text": decryptThenParse(encryptedMessage.text.encrypted_string) });
    if ("sentBy" in encryptedMessage && encryptedMessage.sentBy.who === "OTHER") {
        message.sentBy = __assign({}, encryptedMessage.sentBy, { "email": decryptThenParse(encryptedMessage.sentBy.email.encrypted_string) });
    }
    return message;
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

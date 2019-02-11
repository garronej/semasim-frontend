"use strict";
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
var UserSim;
(function (UserSim) {
    var Owned;
    (function (Owned) {
        function match(userSim) {
            return userSim.ownership.status === "OWNED";
        }
        Owned.match = match;
    })(Owned = UserSim.Owned || (UserSim.Owned = {}));
    var Shared;
    (function (Shared) {
        function match(userSim) {
            return Confirmed.match(userSim) || NotConfirmed.match(userSim);
        }
        Shared.match = match;
        var Confirmed;
        (function (Confirmed) {
            function match(userSim) {
                return userSim.ownership.status === "SHARED CONFIRMED";
            }
            Confirmed.match = match;
        })(Confirmed = Shared.Confirmed || (Shared.Confirmed = {}));
        var NotConfirmed;
        (function (NotConfirmed) {
            function match(userSim) {
                return userSim.ownership.status === "SHARED NOT CONFIRMED";
            }
            NotConfirmed.match = match;
        })(NotConfirmed = Shared.NotConfirmed || (Shared.NotConfirmed = {}));
    })(Shared = UserSim.Shared || (UserSim.Shared = {}));
    var Usable;
    (function (Usable) {
        function match(userSim) {
            return Owned.match(userSim) || Shared.Confirmed.match(userSim);
        }
        Usable.match = match;
    })(Usable = UserSim.Usable || (UserSim.Usable = {}));
})(UserSim = exports.UserSim || (exports.UserSim = {}));
var webphoneData;
(function (webphoneData) {
    /** Best guess on previously opened chat: */
    function getChatWithLatestActivity(wdInstance) {
        var e_1, _a;
        //TODO: what if last seen message not loaded.
        var findMessageByIdAndGetTime = function (wdChat, message_id) {
            if (message_id = -1) {
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
    webphoneData.getChatWithLatestActivity = getChatWithLatestActivity;
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
    webphoneData.compareMessage = compareMessage;
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
            return isAscendingAlphabeticalOrder(chat1.contactName, chat2.contactName) ? 1 : -1;
        }
        else {
            return chat1.contactNumber < chat2.contactNumber ? -1 : 1;
        }
    }
    webphoneData.compareChat = compareChat;
    function isAscendingAlphabeticalOrder(a, b) {
        if (!a || !b) {
            return a.length < b.length;
        }
        var getWeight = function (str) {
            var val = str.charAt(0).toLowerCase().charCodeAt(0);
            if (!(96 < val && val < 123)) {
                return 123;
            }
            return val;
        };
        var vA = getWeight(a);
        var vB = getWeight(b);
        if (vA === vB) {
            return isAscendingAlphabeticalOrder(a.substr(1), b.substr(1));
        }
        return vA < vB;
    }
    webphoneData.isAscendingAlphabeticalOrder = isAscendingAlphabeticalOrder;
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
    webphoneData.getUnreadMessagesCount = getUnreadMessagesCount;
})(webphoneData = exports.webphoneData || (exports.webphoneData = {}));

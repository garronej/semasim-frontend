"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    }
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
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
var loadUiClassHtml_1 = require("../../../shared/dist/lib/tools/loadUiClassHtml");
var phone_number_1 = require("phone-number");
var ts_events_extended_1 = require("ts-events-extended");
var types = require("../../../shared/dist/lib/types");
var wd = types.webphoneData;
var moment = require("moment");
//declare const titlenotifier: any;
var html = loadUiClassHtml_1.loadUiClassHtml(require("../templates/UiConversation.html"), "UiConversation");
require("../templates/UiConversation.less");
//const checkMark= "\u221a";
var checkMark = Buffer.from("e29c93", "hex").toString("utf8");
var crossMark = Buffer.from("e29d8c", "hex").toString("utf8");
var UiConversation = /** @class */ (function () {
    function UiConversation(userSim, wdChat) {
        var e_1, _a;
        var _this = this;
        this.userSim = userSim;
        this.wdChat = wdChat;
        this.structure = html.structure.clone();
        this.evtUpdateContact = new ts_events_extended_1.VoidSyncEvent();
        this.evtVoiceCall = new ts_events_extended_1.VoidSyncEvent();
        this.evtSendText = new ts_events_extended_1.SyncEvent();
        this.evtDelete = new ts_events_extended_1.VoidSyncEvent();
        this.evtChecked = new ts_events_extended_1.VoidSyncEvent();
        this.textarea = this.structure.find("textarea");
        this.aSend = this.structure.find("a.id_send");
        this.ul = this.structure.find("ul");
        this.btnUpdateContact = this.structure.find("button.id_updateContact");
        this.btnCall = this.structure.find("button.id_call");
        this.btnDelete = this.structure.find("button.id_delete");
        this.evtLoadMore = new ts_events_extended_1.SyncEvent();
        /** indexed but wd.Message.id_ */
        this.uiBubbles = new Map();
        this.notifyContactNameUpdated();
        this.setReadonly(true);
        this.btnUpdateContact
            .on("click", function () { return _this.evtUpdateContact.post(); });
        this.btnCall
            .on("click", function () { return _this.evtVoiceCall.post(); });
        this.btnDelete
            .on("click", function () { return _this.evtDelete.post(); });
        this.aSend.on("click", function () {
            var text = _this.textarea.val();
            if (!text || text.match(/^\ +$/)) {
                return;
            }
            _this.evtSendText.post(text);
            _this.textarea.val("");
            _this.textarea.trigger("autosize.resizeIncludeStyle");
        });
        this.textarea
            .on("keypress", function (event) {
            _this.evtChecked.post();
            if (event.key === "Enter" && !event.shiftKey) {
                _this.aSend.trigger("click");
                return false;
            }
        })
            .on("focus", function () { return _this.evtChecked.post(); });
        this.ul.slimScroll({
            "position": "right",
            "distance": '0px',
            "railVisible": true,
            "height": '400px',
            "start": "bottom"
        }).bind("slimscroll", (function (e_, pos) {
            if (pos !== "top") {
                return;
            }
            _this.evtLoadMore.post({
                "onLoaded": function (wdMessages) {
                    var e_2, _a;
                    if (wdMessages.length === 0) {
                        return;
                    }
                    var li = _this.ul.find("li:first");
                    try {
                        for (var wdMessages_1 = __values(wdMessages), wdMessages_1_1 = wdMessages_1.next(); !wdMessages_1_1.done; wdMessages_1_1 = wdMessages_1.next()) {
                            var wdMessage = wdMessages_1_1.value;
                            _this.newMessage(wdMessage, "MUTE");
                        }
                    }
                    catch (e_2_1) { e_2 = { error: e_2_1 }; }
                    finally {
                        try {
                            if (wdMessages_1_1 && !wdMessages_1_1.done && (_a = wdMessages_1.return)) _a.call(wdMessages_1);
                        }
                        finally { if (e_2) throw e_2.error; }
                    }
                    _this.ul.slimScroll({ "scrollTo": li.position().top + "px" });
                }
            });
        }));
        try {
            for (var _b = __values(this.wdChat.messages), _c = _b.next(); !_c.done; _c = _b.next()) {
                var wdMessage = _c.value;
                this.newMessage(wdMessage, "MUTE");
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_1) throw e_1.error; }
        }
        this.unselect();
    }
    UiConversation.prototype.setReadonly = function (isReadonly) {
        if (isReadonly) {
            this.textarea.attr("disabled", true);
            this.aSend.hide();
            this.btnUpdateContact.prop("disabled", true);
            this.btnCall.prop("disabled", true);
            this.btnDelete.prop("disabled", true);
        }
        else {
            if (!phone_number_1.phoneNumber.isDialable(this.wdChat.contactNumber)) {
                return;
            }
            this.textarea.removeAttr("disabled");
            this.aSend.show();
            this.btnUpdateContact.prop("disabled", false);
            this.btnCall.prop("disabled", false);
            this.btnDelete.prop("disabled", false);
        }
    };
    UiConversation.prototype.setSelected = function () {
        var _this = this;
        this.structure.show({
            "duration": 0,
            "complete": function () {
                _this.ul.slimScroll({ "scrollTo": _this.ul.prop("scrollHeight") + "px" });
                _this.textarea.trigger("focus");
                _this.textarea.autosize();
            }
        });
    };
    UiConversation.prototype.unselect = function () {
        this.structure.hide();
    };
    Object.defineProperty(UiConversation.prototype, "isSelected", {
        get: function () {
            return this.structure.is(":visible");
        },
        enumerable: true,
        configurable: true
    });
    UiConversation.prototype.notifyContactNameUpdated = function () {
        var prettyNumber = phone_number_1.phoneNumber.prettyPrint(this.wdChat.contactNumber, this.userSim.sim.country ?
            this.userSim.sim.country.iso : undefined);
        if (this.wdChat.contactName) {
            this.structure.find("span.id_name").text(this.wdChat.contactName);
            this.structure.find("span.id_number").text(" ( " + prettyNumber + " ) ");
        }
        else {
            this.structure.find("span.id_name").text("");
            this.structure.find("span.id_number").text(prettyNumber);
        }
    };
    /**
     * Place uiBubble in the structure, assume all bubbles already sorted
     * return true if the bubble is the last <li> of the <ul>
     * */
    UiConversation.prototype.placeUiBubble = function (uiBubble) {
        var _this = this;
        var getUiBubbleFromStructure = function (li_elem) {
            var e_3, _a;
            try {
                for (var _b = __values(_this.uiBubbles.values()), _c = _b.next(); !_c.done; _c = _b.next()) {
                    var uiBubble_1 = _c.value;
                    if (uiBubble_1.structure.get(0) === li_elem) {
                        return uiBubble_1;
                    }
                }
            }
            catch (e_3_1) { e_3 = { error: e_3_1 }; }
            finally {
                try {
                    if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
                }
                finally { if (e_3) throw e_3.error; }
            }
            throw new Error("uiBubble not found");
        };
        var lis = this.ul.find("li");
        for (var i = lis.length - 1; i >= 0; i--) {
            var uiBubble_i = getUiBubbleFromStructure(lis.get(i));
            if (wd.compareMessage(uiBubble.wdMessage, uiBubble_i.wdMessage) >= 0) {
                //Message is more recent than current
                uiBubble.structure.insertAfter(uiBubble_i.structure);
                return i === lis.length - 1;
            }
        }
        this.ul.prepend(uiBubble.structure);
        return false;
    };
    /** new Message or update existing one */
    UiConversation.prototype.newMessage = function (wdMessage, mute) {
        if (mute === void 0) { mute = undefined; }
        if (this.uiBubbles.has(wdMessage.id_)) {
            this.uiBubbles.get(wdMessage.id_).structure.remove();
            this.uiBubbles.delete(wdMessage.id_);
        }
        var uiBubble;
        if (wdMessage.direction === "INCOMING") {
            if (wdMessage.isNotification) {
                var uiBubbleIncomingNotification = new UiBubble.IncomingNotification(wdMessage, this.wdChat, this.userSim);
                uiBubble = uiBubbleIncomingNotification;
            }
            else {
                if (!mute) {
                    ion.sound.play(this.isSelected ? "water_droplet" : "button_tiny");
                }
                var uiBubbleIncomingText = new UiBubble.IncomingText(wdMessage, this.wdChat, this.userSim);
                uiBubble = uiBubbleIncomingText;
            }
        }
        else {
            var uiBubbleOutgoing = new UiBubble.Outgoing(wdMessage);
            uiBubble = uiBubbleOutgoing;
        }
        this.uiBubbles.set(wdMessage.id_, uiBubble);
        var isAtBottom = this.placeUiBubble(uiBubble);
        if (this.isSelected && isAtBottom) {
            this.ul.slimScroll({ "scrollTo": this.ul.prop("scrollHeight") });
        }
    };
    return UiConversation;
}());
exports.UiConversation = UiConversation;
var UiBubble = /** @class */ (function () {
    function UiBubble(wdMessage) {
        this.wdMessage = wdMessage;
        this.structure = html.templates.find("li").clone();
        this.structure.find("p.id_content")
            .html(wdMessage.text.split("\n").join("<br>"));
        this.structure.find("span.id_date")
            .html(moment.unix(~~(wdMessage.time / 1000)).format("Do MMMM H:mm"));
    }
    return UiBubble;
}());
(function (UiBubble) {
    var IncomingText = /** @class */ (function (_super) {
        __extends(IncomingText, _super);
        function IncomingText(wdMessage, wdChat, userSim) {
            var _this = _super.call(this, wdMessage) || this;
            _this.wdMessage = wdMessage;
            _this.wdChat = wdChat;
            _this.userSim = userSim;
            _this.structure.find("div.message").addClass("in");
            _this.structure.find("p.id_emitter").html((function () {
                if (_this.wdChat.contactName) {
                    return _this.wdChat.contactName;
                }
                else {
                    return phone_number_1.phoneNumber.prettyPrint(_this.wdChat.contactNumber, _this.userSim.sim.country ?
                        _this.userSim.sim.country.iso : undefined);
                }
            })());
            return _this;
        }
        return IncomingText;
    }(UiBubble));
    UiBubble.IncomingText = IncomingText;
    var IncomingNotification = /** @class */ (function (_super) {
        __extends(IncomingNotification, _super);
        function IncomingNotification(wdMessage, wdChat, userSim) {
            var _this = _super.call(this, wdMessage) || this;
            _this.wdMessage = wdMessage;
            _this.wdChat = wdChat;
            _this.userSim = userSim;
            _this.structure.find("div.message").addClass("notification");
            return _this;
        }
        return IncomingNotification;
    }(UiBubble));
    UiBubble.IncomingNotification = IncomingNotification;
    var Outgoing = /** @class */ (function (_super) {
        __extends(Outgoing, _super);
        function Outgoing(wdMessage) {
            var _this = _super.call(this, wdMessage) || this;
            _this.wdMessage = wdMessage;
            _this.structure.find("div.message")
                .addClass("out")
                .find("p.id_emitter")
                .html((wdMessage.status === "STATUS REPORT RECEIVED" &&
                wdMessage.sentBy.who === "OTHER") ? wdMessage.sentBy.email : "You");
            _this.structure.find("span.id_check").text((function () {
                switch (wdMessage.status) {
                    case "SEND REPORT RECEIVED": return !!wdMessage.isSentSuccessfully ? checkMark : crossMark;
                    case "STATUS REPORT RECEIVED": return "" + checkMark + checkMark;
                    case "PENDING": return "";
                }
            })());
            return _this;
        }
        return Outgoing;
    }(UiBubble));
    UiBubble.Outgoing = Outgoing;
})(UiBubble || (UiBubble = {}));

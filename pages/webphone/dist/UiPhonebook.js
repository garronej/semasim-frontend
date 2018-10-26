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
var ts_events_extended_1 = require("ts-events-extended");
var loadUiClassHtml_1 = require("../../../shared/dist/lib/tools/loadUiClassHtml");
var ts_events_extended_2 = require("ts-events-extended");
var types = require("../../../shared/dist/lib/types");
var phone_number_1 = require("phone-number");
var wd = types.webphoneData;
var html = loadUiClassHtml_1.loadUiClassHtml(require("../templates/UiPhonebook.html"), "UiPhonebook");
var UiPhonebook = /** @class */ (function () {
    function UiPhonebook(userSim, wdInstance) {
        var e_1, _a;
        this.userSim = userSim;
        this.wdInstance = wdInstance;
        this.structure = html.structure.clone();
        this.evtContactSelected = new ts_events_extended_1.SyncEvent();
        /** mapped by wdChat.id_ */
        this.uiContacts = new Map();
        this.structure.find("ul").slimScroll({
            "position": "right",
            "distance": '0px',
            "railVisible": true,
            "height": '290px',
            "size": "5px"
        });
        try {
            for (var _b = __values(this.wdInstance.chats), _c = _b.next(); !_c.done; _c = _b.next()) {
                var wdChat = _c.value;
                this.createUiContact(wdChat);
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_1) throw e_1.error; }
        }
        this.updateSearch();
    }
    UiPhonebook.prototype.triggerClickOnLastSeenChat = function () {
        var wdChat = wd.getChatWithLatestActivity(this.wdInstance);
        if (!wdChat) {
            return;
        }
        this.uiContacts.get(wdChat.id_).evtClick.post();
    };
    UiPhonebook.prototype.createUiContact = function (wdChat) {
        var _this = this;
        var uiContact = new UiContact(this.userSim, wdChat);
        uiContact.evtClick.attach(function () {
            var uiContactPrev = Array.from(_this.uiContacts.values())
                .find(function (_a) {
                var isSelected = _a.isSelected;
                return isSelected;
            });
            var wdChatPrev;
            if (uiContactPrev) {
                uiContactPrev.unselect();
                wdChatPrev = uiContactPrev.wdChat;
            }
            else {
                wdChatPrev = undefined;
            }
            _this.uiContacts.get(wdChat.id_).setSelected();
            _this.evtContactSelected.post({ wdChatPrev: wdChatPrev, wdChat: wdChat });
        });
        this.uiContacts.set(wdChat.id_, uiContact);
        this.placeUiContact(uiContact);
    };
    UiPhonebook.prototype.updateSearch = function () {
        this.structure.find("input")
            .quicksearch(this.structure.find("ul li"));
        this.structure.find("ul").slimScroll({ "scrollTo": "0" });
    };
    UiPhonebook.prototype.placeUiContact = function (uiContact) {
        var _this = this;
        var getUiContactFromStructure = function (li_elem) {
            var e_2, _a;
            try {
                for (var _b = __values(_this.uiContacts.values()), _c = _b.next(); !_c.done; _c = _b.next()) {
                    var uiContact_1 = _c.value;
                    if (uiContact_1.structure.get(0) === li_elem) {
                        return uiContact_1;
                    }
                }
            }
            catch (e_2_1) { e_2 = { error: e_2_1 }; }
            finally {
                try {
                    if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
                }
                finally { if (e_2) throw e_2.error; }
            }
            throw new Error("UiContact not found");
        };
        var lis = this.structure.find("ul li");
        for (var i = 0; i < lis.length; i++) {
            var uiContact_i = getUiContactFromStructure(lis.get(i));
            if (wd.compareChat(uiContact.wdChat, uiContact_i.wdChat) >= 0) {
                uiContact.structure.insertBefore(uiContact_i.structure);
                return;
            }
        }
        this.structure.find("ul").append(uiContact.structure);
    };
    /** To create ui contact after init */
    UiPhonebook.prototype.insertContact = function (wdChat) {
        this.structure.find("input").val("");
        this.createUiContact(wdChat);
        this.updateSearch();
    };
    /**
     * triggered by: evt on text input => update last seen => call
     * OR
     * new message arrive => update wdMessage => call
     * OR
     * contact name changed
     * OR
     * contact deleted
     * */
    UiPhonebook.prototype.notifyContactChanged = function (wdChat) {
        var uiContact = this.uiContacts.get(wdChat.id_);
        if (this.wdInstance.chats.indexOf(wdChat) < 0) {
            uiContact.structure.detach();
            this.uiContacts.delete(wdChat.id_);
        }
        else {
            uiContact.refreshNotificationLabel();
            uiContact.updateContactName();
            this.placeUiContact(uiContact);
        }
    };
    UiPhonebook.prototype.triggerContactClick = function (wdChat) {
        this.uiContacts.get(wdChat.id_).evtClick.post();
    };
    return UiPhonebook;
}());
exports.UiPhonebook = UiPhonebook;
var UiContact = /** @class */ (function () {
    function UiContact(userSim, wdChat) {
        var _this = this;
        this.userSim = userSim;
        this.wdChat = wdChat;
        this.structure = html.templates.find("li").clone();
        /** only forward click event, need to be selected manually from outside */
        this.evtClick = new ts_events_extended_2.VoidSyncEvent();
        this.structure.on("click", function () { return _this.evtClick.post(); });
        this.updateContactName();
        this.structure.find("span.id_notifications").hide();
        this.refreshNotificationLabel();
    }
    //TODO: optimization
    UiContact.prototype.refreshNotificationLabel = function () {
        if (this.wdChat.messages.length) {
            this.structure.addClass("has-messages");
        }
        else {
            this.structure.removeClass("has-messages");
        }
        var count = wd.getUnreadMessagesCount(this.wdChat);
        var span = this.structure.find("span.id_notifications");
        span.html("" + count);
        if (count !== 0) {
            span.stop().fadeIn(0);
        }
        else {
            span.fadeOut(2000);
        }
    };
    //TODO: optimization
    /** updateName if different */
    UiContact.prototype.updateContactName = function () {
        this.structure.find("span.id_name").html(this.wdChat.contactName);
        var spanNumber = this.structure.find("span.id_number");
        var prettyNumber = phone_number_1.phoneNumber.prettyPrint(this.wdChat.contactNumber, this.userSim.sim.country ?
            this.userSim.sim.country.iso : undefined);
        if (this.wdChat.contactName) {
            spanNumber
                .addClass("visible-lg-inline")
                .html(" ( " + prettyNumber + " ) ");
        }
        else {
            spanNumber
                .removeClass("visible-lg-inline")
                .html(prettyNumber);
        }
    };
    /** update wsChat */
    UiContact.prototype.setSelected = function () {
        this.structure.addClass("selected");
    };
    /** default state */
    UiContact.prototype.unselect = function () {
        this.structure.removeClass("selected");
    };
    Object.defineProperty(UiContact.prototype, "isSelected", {
        get: function () {
            return this.structure.hasClass("selected");
        },
        enumerable: true,
        configurable: true
    });
    return UiContact;
}());

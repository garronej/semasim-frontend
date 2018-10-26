"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ts_events_extended_1 = require("ts-events-extended");
var loadUiClassHtml_1 = require("../../../shared/dist/lib/tools/loadUiClassHtml");
var phone_number_1 = require("phone-number");
var html = loadUiClassHtml_1.loadUiClassHtml(require("../templates/UiVoiceCall.html"), "UiVoiceCall");
var UiVoiceCall = /** @class */ (function () {
    function UiVoiceCall(userSim) {
        var _this = this;
        this.userSim = userSim;
        this.structure = html.structure.clone();
        this.btnGreen = this.structure.find(".id_btn-green");
        this.btnRed = this.structure.find(".id_btn-red");
        this.evtBtnClick = new ts_events_extended_1.SyncEvent();
        this.evtNumpadDtmf = new ts_events_extended_1.SyncEvent();
        this.state = "TERMINATED";
        this.countryIso = userSim.sim.country ?
            userSim.sim.country.iso : undefined;
        this.structure.modal({
            "keyboard": false,
            "show": false,
            "backdrop": "static"
        });
        this.structure.find("span.id_me").html(userSim.friendlyName);
        //FIXME: this is redundant.
        this.structure.find("span.id_me_under").html(!!this.userSim.sim.storage.number ?
            intlTelInputUtils.formatNumber(this.userSim.sim.storage.number, this.countryIso || null, 2 /* NATIONAL */) : "");
        this.btnGreen.on("click", function () { return _this.evtBtnClick.post("GREEN"); });
        this.btnRed.on("click", function () { return _this.evtBtnClick.post("RED"); });
        var mouseDownStart = {};
        var _loop_1 = function (i) {
            var signal = (i <= 9) ? "" + i : (i === 10) ? "*" : "#";
            this_1.structure.find("button.id_key" + (signal === "*" ? "Ast" : (signal === "#" ? "Sharp" : signal)))
                .on("mousedown", function () { return mouseDownStart[signal] = Date.now(); })
                .on("click", function () {
                var duration = Date.now() - mouseDownStart[signal];
                if (duration < 250) {
                    duration = 250;
                }
                var e = {
                    signal: signal,
                    duration: duration
                };
                _this.evtNumpadDtmf.post(e);
            });
        };
        var this_1 = this;
        for (var i = 0; i <= 11; i++) {
            _loop_1(i);
        }
    }
    UiVoiceCall.prototype.setContact = function (wdChat) {
        var prettyNumber = phone_number_1.phoneNumber.prettyPrint(wdChat.contactNumber, this.countryIso);
        this.structure.find("span.id_contact")
            .html(wdChat.contactName ? wdChat.contactName : "");
        this.structure.find("span.id_contact_under")
            .html(prettyNumber);
    };
    UiVoiceCall.prototype.setArrows = function (direction) {
        this.structure.find("[class^='sel_arrow-']").addClass("hide");
        this.structure
            .find(".sel_arrow-" + ((direction === "INCOMING") ? "left" : "right"))
            .removeClass("hide");
    };
    UiVoiceCall.prototype.onEstablished = function () {
        var _this = this;
        this.setState("ESTABLISHED", "In call");
        var evtUserInput = new ts_events_extended_1.SyncEvent();
        this.evtNumpadDtmf.attach(function (_a) {
            var signal = _a.signal, duration = _a.duration;
            return evtUserInput.post({ "userAction": "DTMF", signal: signal, duration: duration });
        });
        this.evtBtnClick.attachOnce(function () {
            _this.setState("TERMINATED", "You hanged up");
            evtUserInput.post({ "userAction": "HANGUP" });
        });
        return { evtUserInput: evtUserInput };
    };
    UiVoiceCall.prototype.onIncoming = function (wdChat) {
        var _this = this;
        this.setContact(wdChat);
        this.setArrows("INCOMING");
        this.setState("RINGING", "Incoming call");
        return {
            "onTerminated": function (message) { return _this.setState("TERMINATED", message); },
            "prUserInput": new Promise(function (resolve) { return _this.evtBtnClick.attachOnce(function (btnId) {
                if (btnId === "RED") {
                    _this.setState("TERMINATED", "You rejected the call");
                    resolve({ "userAction": "REJECT" });
                }
                else {
                    _this.setState("LOADING", "Connecting...");
                    resolve({
                        "userAction": "ANSWER",
                        "onEstablished": function () { return _this.onEstablished(); }
                    });
                }
            }); })
        };
    };
    UiVoiceCall.prototype.onOutgoing = function (wdChat) {
        var _this = this;
        this.setContact(wdChat);
        this.setArrows("OUTGOING");
        this.setState("LOADING", "Loading...");
        return {
            "onTerminated": function (message) { return _this.setState("TERMINATED", message); },
            "onRingback": function () {
                _this.setState("RINGBACK", "Remote is ringing");
                return {
                    "onEstablished": function () { return _this.onEstablished(); },
                    "prUserInput": new Promise(function (resolve) { return _this.evtBtnClick.attachOnce(function () {
                        _this.setState("TERMINATED", "You hanged up before remote answered");
                        resolve({ "userAction": "HANGUP" });
                    }); })
                };
            },
            "prUserInput": new Promise(function (resolve) { return _this.evtBtnClick.attachOnce(function () {
                _this.setState("TERMINATED", "You canceled the call before remote was ringing");
                resolve({ "userAction": "CANCEL" });
            }); })
        };
    };
    UiVoiceCall.prototype.setState = function (state, message) {
        var _this = this;
        if (state === this.state) {
            return;
        }
        this.state = state;
        this.evtBtnClick.detach();
        var keyPad = this.structure.find(".id_numpad");
        keyPad.hide();
        this.structure.find("[class^='id_icon-']").addClass("hide");
        var spanTimer = this.structure.find("span.id_timer");
        if (spanTimer["timer"] instanceof Function) {
            spanTimer["timer"]("remove");
            spanTimer.text("");
        }
        this.evtNumpadDtmf.detach();
        this.btnGreen.addClass("hide");
        this.btnRed.addClass("hide");
        this.structure.modal("show");
        ion.sound.stop("semasim_ringtone");
        switch (state) {
            case "RINGING":
                ion.sound.play("semasim_ringtone", { "loop": true });
                this.btnGreen.removeClass("hide").html("Answer");
                this.btnRed.removeClass("hide").html("Reject");
                this.structure.find(".id_icon-ring").removeClass("hide");
                break;
            case "RINGBACK":
                this.structure.find(".id_icon-ring").removeClass("hide");
                this.btnRed.removeClass("hide").html("Hangup");
                break;
            case "ESTABLISHED":
                keyPad.show();
                this.btnRed.removeClass("hide").html("Hangup");
                spanTimer["timer"]("start");
                break;
            case "LOADING":
                this.btnRed.removeClass("hide").html("Cancel");
                this.structure.find(".id_icon-spin").removeClass("hide");
                break;
            case "TERMINATED":
                this.structure.find(".id_icon-hangup").removeClass("hide");
                setTimeout(function () { return _this.structure.modal("hide"); }, 1500);
                break;
            default: break;
        }
        this.structure.find(".id_status").html(message);
    };
    return UiVoiceCall;
}());
exports.UiVoiceCall = UiVoiceCall;

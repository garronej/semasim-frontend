"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ts_events_extended_1 = require("ts-events-extended");
var loadUiClassHtml_1 = require("../../../shared/dist/lib/tools/loadUiClassHtml");
var phone_number_1 = require("phone-number");
(function () {
    $.validator.addMethod("validateTelInput", function (value, element) {
        try {
            phone_number_1.phoneNumber.build(value, $(element).intlTelInput("getSelectedCountryData").iso2, "MUST BE DIALABLE");
        }
        catch (_a) {
            return false;
        }
        return true;
    }, "Malformed phone number");
    /*
    let errorMessages = Object.keys((intlTelInputUtils as any).validationError)
        .map(value => value.toLowerCase().split("_").join(" "));

    $.validator.addMethod("validateTelInput", (value, element) =>
        $(element).intlTelInput("getValidationError") === intlTelInputUtils.validationError.IS_POSSIBLE,
        ((bool, element) => errorMessages[$(element).intlTelInput("getValidationError")]) as any
    );
    */
})();
var html = loadUiClassHtml_1.loadUiClassHtml(require("../templates/UiQuickAction.html"), "UiQuickAction");
var UiQuickAction = /** @class */ (function () {
    function UiQuickAction(userSim) {
        var _this = this;
        this.userSim = userSim;
        this.structure = html.structure.clone();
        this.templates = html.templates.clone();
        //TODO: type StaticNotificationWidget
        this.evtStaticNotification = new ts_events_extended_1.SyncEvent();
        this.evtVoiceCall = new ts_events_extended_1.SyncEvent();
        this.evtSms = new ts_events_extended_1.SyncEvent();
        this.evtNewContact = new ts_events_extended_1.SyncEvent();
        var input = this.structure.find("input.id_tel-input");
        //TODO add if bug "utilsScript": "/intl-tel-input/build/js/utils.js",
        var simIso = this.userSim.sim.country ? this.userSim.sim.country.iso : undefined;
        var gwIso = this.userSim.gatewayLocation.countryIso;
        (function () {
            var intlTelInputOptions = {
                "dropdownContainer": "body"
            };
            var preferredCountries = [];
            if (simIso) {
                preferredCountries.push(simIso);
            }
            if (gwIso && simIso !== gwIso) {
                preferredCountries.push(gwIso);
            }
            if (preferredCountries.length) {
                intlTelInputOptions.preferredCountries = preferredCountries;
            }
            if (simIso || gwIso) {
                intlTelInputOptions.initialCountry = simIso || gwIso;
            }
            input.intlTelInput(intlTelInputOptions);
        })();
        (function () {
            var self = _this;
            input.on("countrychange", function calleeA(_, countryData) {
                if (countryData.iso2 === simIso)
                    return;
                input.off("countrychange", undefined, calleeA);
                //TODO: do with StaticNotificationWidget
                var staticNotification = {
                    "message": [
                        "Warning: Consult ",
                        self.userSim.sim.serviceProvider.fromImsi || "Your operator",
                        "'s pricing for Calls/SMS toward " + countryData.name
                    ].join("")
                };
                self.evtStaticNotification.post(staticNotification);
                input.on("countrychange", function calleeB(_, countryData) {
                    if (countryData.iso2 !== simIso)
                        return;
                    //staticNotification.close();
                    input.off("countrychange", undefined, calleeB);
                    input.on("countrychange", calleeA);
                });
            });
        })();
        input.popover({
            "html": true,
            "trigger": "manual",
            "placement": "right",
            "container": "body",
            "content": function () { return _this.templates.find("div.id_popover").html(); }
        });
        var validator = this.structure.find("form.id_form").validate({
            "debug": true,
            "onsubmit": false,
            "rules": {
                "tel-input": {
                    "validateTelInput": true
                }
            },
            "errorPlacement": function (error) {
                _this.templates.find("div.id_popover span.id_error-message").html($(error).text());
                input.popover("show");
            },
            "success": function () { return input.popover("hide"); }
        });
        this.structure.on("mouseleave", function () { return input.popover("hide"); });
        this.structure.find("button").on("click", function (event) {
            if (!validator.form()) {
                return;
            }
            var evt;
            if ($(event.currentTarget).hasClass("id_call")) {
                evt = _this.evtVoiceCall;
            }
            else if ($(event.currentTarget).hasClass("id_sms")) {
                evt = _this.evtSms;
            }
            else if ($(event.currentTarget).hasClass("id_contact")) {
                evt = _this.evtNewContact;
            }
            evt.post(phone_number_1.phoneNumber.build(input.val(), input.intlTelInput("getSelectedCountryData").iso2));
            if (simIso) {
                input.intlTelInput("setCountry", simIso);
            }
            input.intlTelInput("setNumber", "");
        });
    }
    return UiQuickAction;
}());
exports.UiQuickAction = UiQuickAction;

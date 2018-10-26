"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ts_events_extended_1 = require("ts-events-extended");
var loadUiClassHtml_1 = require("../../../shared/dist/lib/tools/loadUiClassHtml");
var html = loadUiClassHtml_1.loadUiClassHtml(require("../templates/UiSimRow.html"), "UiSimRow");
require("../templates/UiSimRow.less");
var UiSimRow = /** @class */ (function () {
    function UiSimRow(userSim) {
        var _this = this;
        this.userSim = userSim;
        this.structure = html.structure.clone();
        this.evtSelected = new ts_events_extended_1.VoidSyncEvent();
        this.isSelected = false;
        this.structure.click(function () {
            if (!_this.isSelected) {
                _this.isSelected = true;
                _this.structure.find(".id_row").addClass("selected");
                _this.evtSelected.post();
            }
        });
        this.setDetailsVisibility("HIDDEN");
        this.populate();
    }
    UiSimRow.prototype.unselect = function () {
        this.structure.find(".id_row").removeClass("selected");
        this.isSelected = false;
    };
    UiSimRow.prototype.setDetailsVisibility = function (visibility) {
        var details = this.structure.find(".id_details");
        switch (visibility) {
            case "SHOWN":
                details.show();
                break;
            case "HIDDEN":
                details.hide();
                break;
        }
    };
    UiSimRow.prototype.setVisibility = function (visibility) {
        switch (visibility) {
            case "SHOWN":
                this.structure.show();
                break;
            case "HIDDEN":
                this.structure.hide();
                break;
        }
    };
    /** To call when userSim has changed */
    UiSimRow.prototype.populate = function () {
        var _this = this;
        this.structure.find(".id_simId").text(this.userSim.friendlyName + (!!this.userSim.sim.storage.number ?
            " ( " + this.userSim.sim.storage.number + " )" : ""));
        this.structure.find(".id_connectivity").text(this.userSim.isOnline ? "online" : "offline");
        if (!this.userSim.isOnline) {
            this.structure.find(".id_row").addClass("offline");
        }
        else {
            this.structure.find(".id_row").removeClass("offline");
        }
        this.structure.find(".id_ownership").text(this.userSim.ownership.status === "OWNED" ?
            "Owned" :
            "owned by: " + this.userSim.ownership.ownerEmail);
        this.structure.find(".id_connectivity_").text(this.userSim.isOnline ? "Online" : "Offline");
        this.structure.find(".id_gw_location").text([
            this.userSim.gatewayLocation.city || "",
            this.userSim.gatewayLocation.subdivisions || "",
            this.userSim.gatewayLocation.countryIso || "",
            "( " + this.userSim.gatewayLocation.ip + " )"
        ].join(" "));
        this.structure.find(".id_owner").text(this.userSim.ownership.status === "OWNED" ?
            "You" : this.userSim.ownership.ownerEmail);
        this.structure.find(".id_number").text((function () {
            var n = _this.userSim.sim.storage.number;
            return n || "Unknown";
        })());
        this.structure.find(".id_serviceProvider").text((function () {
            var out;
            if (_this.userSim.sim.serviceProvider.fromImsi) {
                out = _this.userSim.sim.serviceProvider.fromImsi;
            }
            else if (_this.userSim.sim.serviceProvider.fromNetwork) {
                out = _this.userSim.sim.serviceProvider.fromNetwork;
            }
            else {
                out = "Unknown";
            }
            if (_this.userSim.sim.country) {
                out += ", " + _this.userSim.sim.country.name;
            }
            return out;
        })());
        this.structure.find(".id_dongle_info").text((function () {
            var d = _this.userSim.dongle;
            return [
                d.manufacturer,
                d.model,
                "firm: " + d.firmwareVersion,
                "IMEI: " + d.imei
            ].join(" ");
        })());
        this.structure.find(".id_features").text((function () {
            switch (_this.userSim.dongle.isVoiceEnabled) {
                case undefined:
                    return "SMS: yes,  Voice call: not sure, try and see ( may need to manually enable voice on 3G dongle )";
                case true:
                    return "SMS: yes, Voice call: yes";
                case false:
                    return "SMS: yes, Voice call: no ( need to manually enable voice on 3G dongle )";
            }
        })());
        this.structure.find(".id_imsi").text(this.userSim.sim.imsi);
        this.structure.find(".id_iccid").text(this.userSim.sim.iccid);
        this.structure.find(".id_phonebook").text((function () {
            var n = _this.userSim.sim.storage.contacts.length;
            var tot = n + _this.userSim.sim.storage.infos.storageLeft;
            return n + "/" + tot;
        })());
    };
    return UiSimRow;
}());
exports.UiSimRow = UiSimRow;

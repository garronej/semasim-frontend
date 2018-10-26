"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ts_events_extended_1 = require("ts-events-extended");
var loadUiClassHtml_1 = require("../../../shared/dist/lib/tools/loadUiClassHtml");
var html = loadUiClassHtml_1.loadUiClassHtml(require("../templates/UiHeader.html"), "UiHeader");
var UiHeader = /** @class */ (function () {
    function UiHeader(userSim) {
        var _this = this;
        this.userSim = userSim;
        this.structure = html.structure.clone();
        this.templates = html.templates.clone();
        this.evtUp = new ts_events_extended_1.VoidSyncEvent();
        this.structure.find("a.id_friendly_name").popover({
            "html": true,
            "trigger": "hover",
            "placement": "right",
            "container": "body",
            "title": "SIM card infos",
            "content": function () { return _this.templates.find("div.id_popover").html(); }
        }).find("span").text(this.userSim.friendlyName);
        this.structure.find("button.id_up").on("click", function () { return _this.evtUp.post(); });
        this.templates.find("div.id_popover div.id_flag").addClass(this.userSim.sim.country ? this.userSim.sim.country.iso : "");
        this.templates.find("div.id_popover span.id_network").html(this.userSim.sim.serviceProvider.fromImsi ||
            this.userSim.sim.serviceProvider.fromNetwork ||
            "Unknown");
        this.templates.find("div.id_popover span.id_number").text(function () {
            if (!!_this.userSim.sim.storage.number) {
                return intlTelInputUtils.formatNumber(_this.userSim.sim.storage.number, _this.userSim.sim.country ? _this.userSim.sim.country.iso : null, 2 /* NATIONAL */);
            }
            else {
                return "Unknown";
            }
        });
        this.structure.find("span.id_geoInfo").html((function () {
            var loc = _this.userSim.gatewayLocation;
            var arr = [];
            if (loc.subdivisions) {
                arr.push(loc.subdivisions);
            }
            if (loc.city) {
                arr.push(loc.city);
            }
            return arr.join(", ") + "&nbsp;";
        })());
        this.structure.find("div.id_flag").addClass(this.userSim.gatewayLocation.countryIso || "");
    }
    /** to call when userSim has changed */
    UiHeader.prototype.update = function () {
        //TODO
    };
    return UiHeader;
}());
exports.UiHeader = UiHeader;

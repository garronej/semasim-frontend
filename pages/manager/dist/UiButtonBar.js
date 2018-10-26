"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ts_events_extended_1 = require("ts-events-extended");
var loadUiClassHtml_1 = require("../../../shared/dist/lib/tools/loadUiClassHtml");
var html = loadUiClassHtml_1.loadUiClassHtml(require("../templates/UiButtonBar.html"), "UiButtonBar");
var UiButtonBar = /** @class */ (function () {
    function UiButtonBar() {
        var _this = this;
        this.structure = html.structure.clone();
        /** true if detail was clicked */
        this.evtToggleDetailVisibility = new ts_events_extended_1.SyncEvent();
        this.evtClickDelete = new ts_events_extended_1.VoidSyncEvent();
        this.evtClickShare = new ts_events_extended_1.VoidSyncEvent();
        this.evtClickRename = new ts_events_extended_1.VoidSyncEvent();
        this.evtClickReboot = new ts_events_extended_1.VoidSyncEvent();
        this.buttons = this.structure.find("button");
        this.btnDetail = $(this.buttons.get(0));
        this.btnBack = $(this.buttons.get(1));
        this.btnDelete = $(this.buttons.get(2));
        this.btnShare = $(this.buttons.get(3));
        this.btnRename = $(this.buttons.get(4));
        this.btnReboot = $(this.buttons.get(5));
        this.btnDetail.click(function () {
            _this.setState({ "areDetailsShown": true });
            _this.evtToggleDetailVisibility.post(true);
        });
        this.btnBack.click(function () {
            _this.setState({ "areDetailsShown": false });
            _this.evtToggleDetailVisibility.post(false);
        });
        this.btnDelete.click(function () { return _this.evtClickDelete.post(); });
        this.btnShare.tooltip();
        this.btnShare.click(function () { return _this.evtClickShare.post(); });
        this.btnRename.click(function () { return _this.evtClickRename.post(); });
        this.btnReboot.tooltip();
        this.btnReboot.click(function () { return _this.evtClickReboot.post(); });
        this.state = (function () {
            var state = {
                "isSimRowSelected": false,
                "isSimSharable": false,
                "isSimOnline": false,
                "areDetailsShown": false
            };
            return state;
        })();
        this.setState({});
    }
    UiButtonBar.prototype.setState = function (state) {
        var _this = this;
        for (var key in state) {
            this.state[key] = state[key];
        }
        this.buttons.removeClass("disabled");
        this.btnDetail.show();
        this.btnBack.show();
        if (!this.state.isSimRowSelected) {
            this.buttons.each(function (i) {
                $(_this.buttons[i]).addClass("disabled");
            });
        }
        if (this.state.areDetailsShown) {
            this.btnDetail.hide();
        }
        else {
            this.btnBack.hide();
        }
        if (!this.state.isSimSharable) {
            this.btnShare.addClass("disabled");
        }
        if (!this.state.isSimOnline) {
            this.btnReboot.addClass("disabled");
        }
    };
    return UiButtonBar;
}());
exports.UiButtonBar = UiButtonBar;

"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
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
Object.defineProperty(exports, "__esModule", { value: true });
var ts_events_extended_1 = require("ts-events-extended");
var bootbox_custom = require("../../../shared/dist/lib/tools/bootbox_custom");
var loadUiClassHtml_1 = require("../../../shared/dist/lib/tools/loadUiClassHtml");
var html = loadUiClassHtml_1.loadUiClassHtml(require("../templates/UiShareSim.html"), "UiShareSim");
require("../templates/UiShareSim.less");
var UiShareSim = /** @class */ (function () {
    /**
     * The evt argument should post be posted whenever.
     * -An user accept a sharing request.
     * -An user reject a sharing request.
     * -An user unregistered a shared sim.
     */
    function UiShareSim(evt) {
        var _this = this;
        this.evt = evt;
        this.structure = html.structure.clone();
        this.buttonClose = this.structure.find(".id_close");
        this.buttonStopSharing = this.structure.find(".id_stopSharing");
        this.divListContainer = this.structure.find(".id_list");
        this.inputEmails = this.structure.find(".id_emails");
        this.textareaMessage = this.structure.find(".id_message textarea");
        this.buttonSubmit = this.structure.find(".id_submit");
        this.divsToHideIfNotShared = this.structure.find("._toHideIfNotShared");
        this.evtShare = new ts_events_extended_1.SyncEvent();
        this.evtStopSharing = new ts_events_extended_1.SyncEvent();
        this.currentUserSim = undefined;
        this.structure.modal({
            "keyboard": false,
            "show": false,
            "backdrop": "true"
        });
        this.buttonClose.on("click", function () { return _this.structure.modal("hide"); });
        this.structure.find(".id_emails").multiple_emails({
            "placeholder": "Enter email addresses",
            "checkDupEmail": true
        });
        this.buttonStopSharing.on("click", function () { return __awaiter(_this, void 0, void 0, function () {
            var emails;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        emails = [];
                        this.divListContainer.find(".id_row.selected").each(function (_, element) {
                            emails.push($(element).find(".id_email").html());
                        });
                        return [4 /*yield*/, this.hide()];
                    case 1:
                        _a.sent();
                        bootbox_custom.loading("Revoking some user's SIM access");
                        return [4 /*yield*/, new Promise(function (resolve) {
                                return _this.evtStopSharing.post({
                                    "userSim": _this.currentUserSim,
                                    emails: emails,
                                    "onSubmitted": function () { return resolve(); }
                                });
                            })];
                    case 2:
                        _a.sent();
                        bootbox_custom.dismissLoading();
                        this.open(this.currentUserSim);
                        return [2 /*return*/];
                }
            });
        }); });
        this.buttonSubmit.on("click", function () { return __awaiter(_this, void 0, void 0, function () {
            var emails;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        emails = this.getInputEmails();
                        return [4 /*yield*/, this.hide()];
                    case 1:
                        _a.sent();
                        bootbox_custom.loading("Granting sim access to some users");
                        return [4 /*yield*/, new Promise(function (resolve) {
                                return _this.evtShare.post({
                                    "userSim": _this.currentUserSim,
                                    emails: emails,
                                    "message": _this.textareaMessage.html(),
                                    "onSubmitted": function () { return resolve(); }
                                });
                            })];
                    case 2:
                        _a.sent();
                        bootbox_custom.dismissLoading();
                        this.open(this.currentUserSim);
                        return [2 /*return*/];
                }
            });
        }); });
        this.inputEmails.change(function () {
            if (_this.getInputEmails().length === 0) {
                _this.buttonSubmit.addClass("disabled");
                _this.textareaMessage.parent().hide();
            }
            else {
                _this.buttonSubmit.removeClass("disabled");
                _this.textareaMessage.parent().show();
            }
        });
    }
    UiShareSim.prototype.hide = function () {
        var _this = this;
        this.structure.modal("hide");
        return new Promise(function (resolve) {
            return _this.structure.one("hidden.bs.modal", function () { return resolve(); });
        });
    };
    UiShareSim.prototype.getInputEmails = function () {
        var raw = this.inputEmails.val();
        return !!raw ? JSON.parse(raw) : [];
    };
    UiShareSim.prototype.open = function (userSim) {
        var _this = this;
        this.evt.detach(this);
        this.currentUserSim = userSim;
        this.textareaMessage.html([
            "I would like to share the SIM card",
            userSim.friendlyName,
            userSim.sim.storage.number || "",
            "with you."
        ].join(" "));
        this.inputEmails.parent().find("li").detach();
        this.inputEmails.val("");
        this.inputEmails.trigger("change");
        if (userSim.ownership.sharedWith.confirmed.length === 0 &&
            userSim.ownership.sharedWith.notConfirmed.length === 0) {
            this.divsToHideIfNotShared.hide();
        }
        else {
            this.divListContainer.find(".id_row").detach();
            this.divsToHideIfNotShared.show();
            var onRowClick_1 = function (divRow) {
                if (!!divRow) {
                    divRow.toggleClass("selected");
                }
                var selectedCount = _this.divListContainer.find(".id_row.selected").length;
                if (selectedCount === 0) {
                    _this.buttonStopSharing.hide();
                }
                else {
                    _this.buttonStopSharing.show();
                    _this.buttonStopSharing.find("span").html("Remove (" + selectedCount + ")");
                }
            };
            var appendRow = function (email, isConfirmed) {
                var divRow = html.templates.find(".id_row").clone();
                divRow.find(".id_email").text(email);
                divRow.find(".id_isConfirmed")
                    .text(isConfirmed ? "confirmed" : "Not yet confirmed")
                    .addClass(isConfirmed ? "color-green" : "color-yellow");
                divRow.on("click", function () { return onRowClick_1(divRow); });
                _this.evt.attach(function (_a) {
                    var userSim = _a.userSim, email_ = _a.email;
                    return (userSim === _this.currentUserSim &&
                        email_ === email);
                }, _this, function () {
                    if (userSim.ownership.sharedWith.confirmed.indexOf(email) >= 0) {
                        divRow.find(".id_isConfirmed")
                            .removeClass("color-yellow")
                            .text("confirmed")
                            .addClass("color-green");
                    }
                    else {
                        divRow.remove();
                        if (userSim.ownership.sharedWith.confirmed.length === 0 &&
                            userSim.ownership.sharedWith.notConfirmed.length === 0) {
                            _this.divsToHideIfNotShared.hide();
                        }
                    }
                });
                _this.divListContainer.append(divRow);
            };
            for (var _i = 0, _a = userSim.ownership.sharedWith.confirmed; _i < _a.length; _i++) {
                var email = _a[_i];
                appendRow(email, true);
            }
            for (var _b = 0, _c = userSim.ownership.sharedWith.notConfirmed; _b < _c.length; _b++) {
                var email = _c[_b];
                appendRow(email, false);
            }
            onRowClick_1();
        }
        this.structure.modal("show");
    };
    return UiShareSim;
}());
exports.UiShareSim = UiShareSim;

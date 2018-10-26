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
var types = require("../../../shared/dist/lib/types");
var localApiHandlers = require("../../../shared/dist/lib/toBackend/localApiHandlers");
var remoteApiCaller = require("../../../shared/dist/lib/toBackend/remoteApiCaller");
var loadUiClassHtml_1 = require("../../../shared/dist/lib/tools/loadUiClassHtml");
var bootbox_custom = require("../../../shared/dist/lib/tools/bootbox_custom");
var UiButtonBar_1 = require("./UiButtonBar");
var UiSimRow_1 = require("./UiSimRow");
var UiShareSim_1 = require("./UiShareSim");
var html = loadUiClassHtml_1.loadUiClassHtml(require("../templates/UiController.html"), "UiController");
var UiController = /** @class */ (function () {
    function UiController() {
        var _this = this;
        this.structure = html.structure.clone();
        this.uiButtonBar = new UiButtonBar_1.UiButtonBar();
        this.uiShareSim = new UiShareSim_1.UiShareSim((function () {
            var evt = new ts_events_extended_1.SyncEvent();
            localApiHandlers.evtSharingRequestResponse.attach(function (_a) {
                var userSim = _a.userSim, email = _a.email;
                return evt.post({ userSim: userSim, email: email });
            });
            localApiHandlers.evtSharedSimUnregistered.attach(function (_a) {
                var userSim = _a.userSim, email = _a.email;
                return evt.post({ userSim: userSim, email: email });
            });
            return evt;
        })());
        this.uiSimRows = [];
        this.structure.find(".id_placeholder_no_sim").hide();
        this.initUiButtonBar();
        this.initUiShareSim();
        remoteApiCaller.getUsableUserSims().then(function (userSims) {
            if (userSims.length === 0) {
                _this.setPlaceholder("NO SIM");
                return;
            }
            for (var _i = 0, userSims_1 = userSims; _i < userSims_1.length; _i++) {
                var userSim = userSims_1[_i];
                _this.addUserSim(userSim);
            }
        });
        remoteApiCaller.evtUsableSim.attach(function (userSim) { return _this.addUserSim(userSim); });
        localApiHandlers.evtSimPermissionLost.attach(function (userSim) { return _this.removeUserSim(userSim); });
    }
    UiController.prototype.setPlaceholder = function (placeholder) {
        var main = this.structure.find(".id_placeholder_main");
        var noSim = this.structure.find(".id_placeholder_no_sim");
        switch (placeholder) {
            case "MAIN":
                {
                    noSim.hide();
                    main.show();
                }
                ;
                break;
            case "NO SIM":
                {
                    main.hide();
                    noSim.show();
                }
                ;
                break;
        }
    };
    UiController.prototype.addUserSim = function (userSim) {
        var _this = this;
        this.setPlaceholder("MAIN");
        var uiSimRow = new UiSimRow_1.UiSimRow(userSim);
        this.uiSimRows.push(uiSimRow);
        this.structure.find(".id_placeholder_main").append(uiSimRow.structure);
        uiSimRow.evtSelected.attach(function () {
            if (_this.uiButtonBar.state.isSimRowSelected) {
                _this.getSelectedUiSimRow(uiSimRow).unselect();
            }
            _this.uiButtonBar.setState({
                "isSimRowSelected": true,
                "isSimSharable": types.UserSim.Owned.match(userSim),
                "isSimOnline": userSim.isOnline
            });
        });
        localApiHandlers.evtSimIsOnlineStatusChange.attach(function (userSim_) { return userSim_ === userSim; }, function () {
            uiSimRow.populate();
            if (uiSimRow.isSelected) {
                _this.uiButtonBar.setState({ "isSimOnline": userSim.isOnline });
            }
        });
        //NOTE: Edge case where if other user that share the SIM create or delete contact the phonebook number is updated.
        for (var _i = 0, _a = [localApiHandlers.evtContactCreatedOrUpdated, localApiHandlers.evtContactDeleted]; _i < _a.length; _i++) {
            var evt = _a[_i];
            evt.attach(function (_a) {
                var _userSim = _a.userSim, contact = _a.contact;
                return _userSim === userSim && contact.mem_index !== undefined;
            }, function () {
                uiSimRow.populate();
            });
        }
        //If no sim is selected in the list select this one by triggering a click on the row element.
        if (!this.uiButtonBar.state.isSimRowSelected) {
            uiSimRow.structure.click();
        }
    };
    UiController.prototype.removeUserSim = function (userSim) {
        return __awaiter(this, void 0, void 0, function () {
            var uiSimRow;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        uiSimRow = this.uiSimRows.find(function (uiSimRow) { return uiSimRow.userSim === userSim; });
                        if (this.uiButtonBar.state.isSimRowSelected) {
                            if (uiSimRow === this.getSelectedUiSimRow()) {
                                this.uiButtonBar.setState({
                                    "isSimRowSelected": false,
                                    "isSimSharable": false,
                                    "isSimOnline": false,
                                    "areDetailsShown": false
                                });
                                uiSimRow.unselect();
                            }
                        }
                        uiSimRow.structure.remove();
                        return [4 /*yield*/, remoteApiCaller.getUsableUserSims()];
                    case 1:
                        if ((_a.sent()).length === 0) {
                            this.setPlaceholder("NO SIM");
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    UiController.prototype.getSelectedUiSimRow = function (notUiSimRow) {
        return this.uiSimRows.find(function (uiSimRow) { return uiSimRow !== notUiSimRow && uiSimRow.isSelected; });
    };
    UiController.prototype.initUiButtonBar = function () {
        var _this = this;
        this.structure.find(".id_placeholder_main").append(this.uiButtonBar.structure);
        this.uiButtonBar.evtToggleDetailVisibility.attach(function (isShown) {
            for (var _i = 0, _a = _this.uiSimRows; _i < _a.length; _i++) {
                var uiSimRow = _a[_i];
                if (isShown) {
                    if (uiSimRow.isSelected) {
                        uiSimRow.setDetailsVisibility("SHOWN");
                    }
                    else {
                        uiSimRow.setVisibility("HIDDEN");
                    }
                }
                else {
                    if (uiSimRow.isSelected) {
                        uiSimRow.setDetailsVisibility("HIDDEN");
                    }
                    else {
                        uiSimRow.setVisibility("SHOWN");
                    }
                }
            }
        });
        this.uiButtonBar.evtClickDelete.attach(function () { return __awaiter(_this, void 0, void 0, function () {
            var userSim, shouldProceed;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        userSim = this.getSelectedUiSimRow().userSim;
                        return [4 /*yield*/, new Promise(function (resolve) { return bootbox_custom.confirm({
                                "title": "Unregister SIM",
                                "message": "Do you really want to unregister " + userSim.friendlyName + "?",
                                callback: function (result) { return resolve(result); }
                            }); })];
                    case 1:
                        shouldProceed = _a.sent();
                        if (!shouldProceed) return [3 /*break*/, 3];
                        return [4 /*yield*/, remoteApiCaller.unregisterSim(userSim)];
                    case 2:
                        _a.sent();
                        this.removeUserSim(userSim);
                        _a.label = 3;
                    case 3: return [2 /*return*/];
                }
            });
        }); });
        this.uiButtonBar.evtClickShare.attach(function () { return __awaiter(_this, void 0, void 0, function () {
            var userSim;
            return __generator(this, function (_a) {
                userSim = this.getSelectedUiSimRow().userSim;
                /*
                NOTE: If the user was able to click on share the
                selected SIM is owned.
                */
                this.uiShareSim.open(userSim);
                return [2 /*return*/];
            });
        }); });
        this.uiButtonBar.evtClickRename.attach(function () { return __awaiter(_this, void 0, void 0, function () {
            var uiSimRow, friendlyNameSubmitted;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        uiSimRow = this.getSelectedUiSimRow();
                        return [4 /*yield*/, new Promise(function (resolve) { return bootbox_custom.prompt({
                                "title": "Friendly name for this sim?",
                                "value": uiSimRow.userSim.friendlyName,
                                "callback": function (result) { return resolve(result); },
                            }); })];
                    case 1:
                        friendlyNameSubmitted = _a.sent();
                        if (!!!friendlyNameSubmitted) return [3 /*break*/, 3];
                        return [4 /*yield*/, remoteApiCaller.changeSimFriendlyName(uiSimRow.userSim, friendlyNameSubmitted)];
                    case 2:
                        _a.sent();
                        uiSimRow.populate();
                        _a.label = 3;
                    case 3: return [2 /*return*/];
                }
            });
        }); });
        this.uiButtonBar.evtClickReboot.attach(function () { return __awaiter(_this, void 0, void 0, function () {
            var userSim, shouldProceed;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        userSim = this.getSelectedUiSimRow().userSim;
                        return [4 /*yield*/, new Promise(function (resolve) { return bootbox_custom.confirm({
                                "title": "Reboot GSM Dongle",
                                "message": "Do you really want to reboot Dongle " + userSim.dongle.manufacturer + " " + userSim.dongle.model + "?",
                                callback: function (result) { return resolve(result); }
                            }); })];
                    case 1:
                        shouldProceed = _a.sent();
                        if (!shouldProceed) {
                            return [2 /*return*/];
                        }
                        bootbox_custom.loading("Sending reboot command to dongle");
                        /*
                        NOTE: If the user was able to click on the reboot button
                        the sim is necessary online.
                        */
                        return [4 /*yield*/, remoteApiCaller.rebootDongle(userSim)];
                    case 2:
                        /*
                        NOTE: If the user was able to click on the reboot button
                        the sim is necessary online.
                        */
                        _a.sent();
                        bootbox_custom.dismissLoading();
                        return [4 /*yield*/, new Promise(function (resolve) { return bootbox_custom.alert("Restart command issued successfully, the SIM should be back online within 30 seconds", function () { return resolve(); }); })];
                    case 3:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); });
    };
    UiController.prototype.initUiShareSim = function () {
        var _this = this;
        this.uiShareSim.evtShare.attach(function (_a) {
            var userSim = _a.userSim, emails = _a.emails, message = _a.message, onSubmitted = _a.onSubmitted;
            return __awaiter(_this, void 0, void 0, function () {
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0: return [4 /*yield*/, remoteApiCaller.shareSim(userSim, emails, message)];
                        case 1:
                            _b.sent();
                            onSubmitted();
                            return [2 /*return*/];
                    }
                });
            });
        });
        this.uiShareSim.evtStopSharing.attach(function (_a) {
            var userSim = _a.userSim, emails = _a.emails, onSubmitted = _a.onSubmitted;
            return __awaiter(_this, void 0, void 0, function () {
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0: return [4 /*yield*/, remoteApiCaller.stopSharingSim(userSim, emails)];
                        case 1:
                            _b.sent();
                            onSubmitted();
                            return [2 /*return*/];
                    }
                });
            });
        });
    };
    return UiController;
}());
exports.UiController = UiController;

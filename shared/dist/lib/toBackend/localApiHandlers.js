"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
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
var apiDeclaration = require("../../sip_api_declarations/uaToBackend");
var evt_1 = require("evt");
var dcTypes = require("chan-dongle-extended-client/dist/lib/types");
function getHandlers() {
    var _this = this;
    var evtRtcIceServer = new evt_1.Evt();
    var remoteNotifyEvts = {
        "evtUserSimChange": new evt_1.Evt(),
        "evtDongleOnLan": new evt_1.Evt(),
        "evtOpenElsewhere": new evt_1.VoidEvt(),
        "getRtcIceServer": (function () {
            var current = undefined;
            var evtUpdated = new evt_1.VoidEvt();
            evtRtcIceServer.attach(function (_a) {
                var rtcIceServer = _a.rtcIceServer, attachOnNoLongerValid = _a.attachOnNoLongerValid;
                attachOnNoLongerValid(function () { return current = undefined; });
                current = rtcIceServer;
                evtUpdated.post();
            });
            return function callee() {
                return __awaiter(this, void 0, void 0, function () {
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                if (current !== undefined) {
                                    return [2 /*return*/, current];
                                }
                                return [4 /*yield*/, evtUpdated.waitFor()];
                            case 1:
                                _a.sent();
                                return [2 /*return*/, callee()];
                        }
                    });
                });
            };
        })(),
        "evtWdActionFromOtherUa": new evt_1.Evt()
    };
    var handlers = {};
    {
        var methodName = apiDeclaration.notifyUserSimChange.methodName;
        var handler = {
            "handler": function (eventData) {
                if (eventData.type === "IS NOW REACHABLE") {
                    evtUsableDongle.post({ "imei": eventData.simDongle.imei });
                }
                remoteNotifyEvts.evtUserSimChange.post(eventData);
                return Promise.resolve(undefined);
            }
        };
        handlers[methodName] = handler;
    }
    /**
     * Posted when a Dongle with an unlocked SIM goes online.
     * Used so we can display a loading between the moment
     * when the card have been unlocked and the card is ready
     * to use.
     */
    var evtUsableDongle = new evt_1.Evt();
    {
        var methodName = apiDeclaration.notifyDongleOnLan.methodName;
        var handler = {
            "handler": function (dongle) { return __awaiter(_this, void 0, void 0, function () {
                var data;
                return __generator(this, function (_a) {
                    data = dcTypes.Dongle.Locked.match(dongle) ? ({
                        "type": "LOCKED",
                        dongle: dongle,
                        "prSimUnlocked": evtUsableDongle
                            .waitFor(function (_a) {
                            var imei = _a.imei;
                            return imei === dongle.imei;
                        })
                            .then(function () { return undefined; })
                    }) : ({
                        "type": "USABLE",
                        dongle: dongle
                    });
                    if (data.type === "USABLE") {
                        evtUsableDongle.post({ "imei": dongle.imei });
                    }
                    remoteNotifyEvts.evtDongleOnLan.postAsyncOnceHandled(data);
                    return [2 /*return*/, undefined];
                });
            }); }
        };
        handlers[methodName] = handler;
    }
    {
        var methodName = apiDeclaration.notifyLoggedFromOtherTab.methodName;
        var handler = {
            "handler": function () {
                remoteNotifyEvts.evtOpenElsewhere.postAsyncOnceHandled();
                return Promise.resolve(undefined);
            }
        };
        handlers[methodName] = handler;
    }
    {
        var methodName = apiDeclaration.notifyIceServer.methodName;
        var handler = {
            "handler": function (params, fromSocket) {
                evtRtcIceServer.post({
                    "rtcIceServer": params !== undefined ? params :
                        ({
                            "urls": [
                                "stun:stun1.l.google.com:19302",
                                "stun:stun2.l.google.com:19302",
                                "stun:stun3.l.google.com:19302",
                                "stun:stun4.l.google.com:19302"
                            ]
                        }),
                    "attachOnNoLongerValid": function (onNoLongerValid) { return fromSocket.evtClose.attachOnce(function () { return onNoLongerValid(); }); }
                });
                return Promise.resolve(undefined);
            }
        };
        handlers[methodName] = handler;
    }
    {
        var methodName = apiDeclaration.wd_notifyActionFromOtherUa.methodName;
        var handler = {
            "handler": function (params) {
                remoteNotifyEvts.evtWdActionFromOtherUa.post(params);
                return Promise.resolve(undefined);
            }
        };
        handlers[methodName] = handler;
    }
    return { handlers: handlers, remoteNotifyEvts: remoteNotifyEvts };
}
exports.getHandlers = getHandlers;

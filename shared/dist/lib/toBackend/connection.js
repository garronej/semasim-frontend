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
var sip = require("ts-sip");
var ts_events_extended_1 = require("ts-events-extended");
var localApiHandlers = require("./localApiHandlers");
var remoteApiCaller = require("./remoteApiCaller/base");
var bootbox_custom = require("../../tools/bootbox_custom");
var env_1 = require("../env");
var cookies = require("../cookies/logic/frontend");
exports.url = "wss://web." + env_1.baseDomain;
var idString = "toBackend";
var log = env_1.isDevEnv ? console.log.bind(console) : (function () { });
var apiServer = new sip.api.Server(localApiHandlers.handlers, sip.api.Server.getDefaultLogger({
    idString: idString,
    log: log,
    "hideKeepAlive": true
}));
var socketCurrent = undefined;
var userSims = undefined;
exports.evtConnect = new ts_events_extended_1.SyncEvent();
/**
 * - Multiple auxiliary connection can be established at the same time.
 * - On the contrary only one main connection can be active at the same time for a given user account )
 * - Auxiliary connections does not receive most of the events defined in localApiHandler.
 *   But will receive notifyIceServer ( if requestTurnCred === true ).
 * - Auxiliary connections will not receive phonebook entries
 * ( userSims will appear as if they had no contacts stored )
 *
 * Called from outside isReconnect should never be passed.
 *  */
function connect(connectionParams, isReconnect) {
    var _this = this;
    //We register 'offline' event only on the first call of connect()
    if (socketCurrent === undefined) {
        window.addEventListener("offline", function () {
            var socket = get();
            if (socket instanceof Promise) {
                return;
            }
            socket.destroy("Browser is offline");
        });
    }
    var removeCookie = cookies.WebsocketConnectionParams.set(connectionParams);
    var socket = new sip.Socket(new WebSocket(exports.url, "SIP"), true, {
        "remoteAddress": "web." + env_1.baseDomain,
        "remotePort": 443
    }, 20000);
    apiServer.startListening(socket);
    sip.api.client.enableKeepAlive(socket, 6 * 1000);
    sip.api.client.enableErrorLogging(socket, sip.api.client.getDefaultErrorLogger({
        idString: idString,
        "log": console.log.bind(console)
    }));
    socket.enableLogger({
        "socketId": idString,
        "remoteEndId": "BACKEND",
        "localEndId": "FRONTEND",
        "connection": true,
        "error": true,
        "close": true,
        "incomingTraffic": false,
        "outgoingTraffic": false,
        "ignoreApiTraffic": true
    }, log);
    socketCurrent = socket;
    socket.evtConnect.attachOnce(function () {
        log("Socket " + (!!isReconnect ? "re-" : "") + "connected");
        removeCookie();
        if (!!isReconnect) {
            bootbox_custom.dismissLoading();
        }
        var includeContacts = connectionParams.connectionType === "MAIN";
        if (userSims === undefined) {
            remoteApiCaller.getUsableUserSims(includeContacts)
                .then(function (userSims_) { return userSims = userSims_; });
        }
        else {
            remoteApiCaller.getUsableUserSims(includeContacts, "STATELESS")
                .then(function (userSims_) {
                var e_1, _a;
                var _loop_1 = function (userSim_) {
                    var userSim = userSims
                        .find(function (_a) {
                        var sim = _a.sim;
                        return sim.imsi === userSim_.sim.imsi;
                    });
                    /*
                    By testing if digests are the same we cover 99% of the case
                    when the sim could have been modified while offline...good enough.
                    */
                    if (!userSim ||
                        userSim.sim.storage.digest !== userSim_.sim.storage.digest) {
                        location.reload();
                        return { value: void 0 };
                    }
                    /*
                    If userSim is online we received a notification before having the
                    response of the request... even possible?
                     */
                    if (!!userSim.reachableSimState) {
                        return "continue";
                    }
                    userSim.reachableSimState = userSim_.reachableSimState;
                    userSim.password = userSim_.password;
                    userSim.dongle = userSim_.dongle;
                    userSim.gatewayLocation = userSim_.gatewayLocation;
                    if (!!userSim.reachableSimState) {
                        localApiHandlers.evtSimIsOnlineStatusChange.post(userSim);
                    }
                };
                try {
                    for (var userSims_1 = __values(userSims_), userSims_1_1 = userSims_1.next(); !userSims_1_1.done; userSims_1_1 = userSims_1.next()) {
                        var userSim_ = userSims_1_1.value;
                        var state_1 = _loop_1(userSim_);
                        if (typeof state_1 === "object")
                            return state_1.value;
                    }
                }
                catch (e_1_1) { e_1 = { error: e_1_1 }; }
                finally {
                    try {
                        if (userSims_1_1 && !userSims_1_1.done && (_a = userSims_1.return)) _a.call(userSims_1);
                    }
                    finally { if (e_1) throw e_1.error; }
                }
            });
        }
        exports.evtConnect.post(socket);
    });
    socket.evtClose.attachOnce(function () { return __awaiter(_this, void 0, void 0, function () {
        var _a, _b, userSim;
        var e_2, _c;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    log("Socket disconnected");
                    try {
                        for (_a = __values(userSims || []), _b = _a.next(); !_b.done; _b = _a.next()) {
                            userSim = _b.value;
                            userSim.reachableSimState = undefined;
                            localApiHandlers.evtSimIsOnlineStatusChange.post(userSim);
                        }
                    }
                    catch (e_2_1) { e_2 = { error: e_2_1 }; }
                    finally {
                        try {
                            if (_b && !_b.done && (_c = _a.return)) _c.call(_a);
                        }
                        finally { if (e_2) throw e_2.error; }
                    }
                    if (localApiHandlers.evtOpenElsewhere.postCount !== 0) {
                        return [2 /*return*/];
                    }
                    if (socket.evtConnect.postCount === 1) {
                        bootbox_custom.loading("Reconnecting...");
                    }
                    _d.label = 1;
                case 1:
                    if (!!navigator.onLine) return [3 /*break*/, 3];
                    return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 1000); })];
                case 2:
                    _d.sent();
                    return [3 /*break*/, 1];
                case 3:
                    connect(connectionParams, "RECONNECT");
                    return [2 /*return*/];
            }
        });
    }); });
}
exports.connect = connect;
function get() {
    if (!socketCurrent ||
        socketCurrent.evtClose.postCount !== 0 ||
        !socketCurrent.evtConnect.postCount) {
        return new Promise(function (resolve) { return exports.evtConnect.attachOnce(function () { return resolve(socketCurrent); }); });
    }
    else {
        return socketCurrent;
    }
}
exports.get = get;

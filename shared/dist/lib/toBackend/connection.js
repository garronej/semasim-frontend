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
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __spread = (this && this.__spread) || function () {
    for (var ar = [], i = 0; i < arguments.length; i++) ar = ar.concat(__read(arguments[i]));
    return ar;
};
Object.defineProperty(exports, "__esModule", { value: true });
var sip = require("ts-sip");
var ts_events_extended_1 = require("ts-events-extended");
var localApiHandlers = require("./localApiHandlers");
var dialog_1 = require("../../tools/modal/dialog");
var urlGetParameters = require("../../tools/urlGetParameters");
var env_1 = require("../env");
var AuthenticatedSessionDescriptorSharedData_1 = require("../localStorage/AuthenticatedSessionDescriptorSharedData");
var tryLoginFromStoredCredentials_1 = require("../tryLoginFromStoredCredentials");
var appEvts_1 = require("./appEvts");
var restartApp_1 = require("../restartApp");
var networkStateMonitoring = require("../networkStateMonitoring");
exports.url = "wss://web." + env_1.env.baseDomain;
var idString = "toBackend";
env_1.env.isDevEnv;
/*
const log: typeof console.log = env.isDevEnv ?
    ((...args) => console.log.apply(console, ["[toBackend/connection]", ...args])) :
    (() => { });
    */
var log = true ?
    (function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        return console.log.apply(console, __spread(["[toBackend/connection]"], args));
    }) :
    (function () { });
var notConnectedUserFeedback;
(function (notConnectedUserFeedback) {
    var setVisibilityWithMessage;
    function setVisibility(isVisible) {
        var state = isVisible ?
            ({ isVisible: isVisible, "message": "Connecting..." }) :
            ({ isVisible: isVisible });
        setVisibilityWithMessage(state);
    }
    notConnectedUserFeedback.setVisibility = setVisibility;
    function provideCustomImplementation(setVisibilityWithMessageImpl) {
        setVisibilityWithMessage = setVisibilityWithMessageImpl;
    }
    notConnectedUserFeedback.provideCustomImplementation = provideCustomImplementation;
})(notConnectedUserFeedback || (notConnectedUserFeedback = {}));
var apiServer = new sip.api.Server(localApiHandlers.handlers, sip.api.Server.getDefaultLogger({
    idString: idString,
    log: log,
    "hideKeepAlive": true
}));
/** login is called when the user
 * is no longer logged in, it should return a Promise
 * that resolve when the user is logged back in
 * if not provided and if in browser the page will be reloaded
 * else error will be thrown.
 */
exports.connect = (function () {
    var hasBeenInvoked = false;
    return function connect(params) {
        if (hasBeenInvoked) {
            throw new Error("Should be invoked only once");
        }
        hasBeenInvoked = true;
        if (params.assertJsRuntimeEnv !== env_1.env.jsRuntimeEnv) {
            throw new Error("Wrong params for js runtime environnement");
        }
        notConnectedUserFeedback.provideCustomImplementation(params.assertJsRuntimeEnv === "react-native" ?
            params.notConnectedUserFeedback :
            (function (state) {
                if (state.isVisible) {
                    dialog_1.dialogApi.loading(state.message, 1200);
                }
                else {
                    dialog_1.dialogApi.dismissLoading();
                }
            }));
        //TODO: See if of any use
        networkStateMonitoring.getApi().then(function (api) {
            return api.evtStateChange.attach(function () { return !api.getIsOnline(); }, function () {
                var socket = get();
                if (socket instanceof Promise) {
                    return;
                }
                socket.destroy("Internet connection lost");
            });
        });
        AuthenticatedSessionDescriptorSharedData_1.AuthenticatedSessionDescriptorSharedData.evtChange.attach(function (authenticatedSessionDescriptorSharedData) { return !authenticatedSessionDescriptorSharedData; }, function () {
            var socket = get();
            if (socket instanceof Promise) {
                return;
            }
            socket.destroy("User no longer authenticated");
        });
        connectRecursive(params.requestTurnCred ? "REQUEST TURN CRED" : "DO NOT REQUEST TURN CRED");
    };
})();
exports.evtConnect = new ts_events_extended_1.SyncEvent();
var socketCurrent = undefined;
/** Assert user logged in, will restart app as soon as user is detected as no longer logged in */
function connectRecursive(requestTurnCred) {
    return __awaiter(this, void 0, void 0, function () {
        var loginAttemptResult, connect_sid, webSocket, socket;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    notConnectedUserFeedback.setVisibility(true);
                    return [4 /*yield*/, tryLoginFromStoredCredentials_1.tryLoginFromStoredCredentials()];
                case 1:
                    loginAttemptResult = _a.sent();
                    if (loginAttemptResult !== "LOGGED IN") {
                        restartApp_1.restartApp("User is no longer logged in");
                        return [2 /*return*/];
                    }
                    return [4 /*yield*/, AuthenticatedSessionDescriptorSharedData_1.AuthenticatedSessionDescriptorSharedData.get()];
                case 2:
                    connect_sid = (_a.sent()).connect_sid;
                    try {
                        webSocket = new WebSocket(urlGetParameters.buildUrl(exports.url, {
                            connect_sid: connect_sid,
                            requestTurnCred: requestTurnCred
                        }), "SIP");
                    }
                    catch (error) {
                        log("WebSocket construction error: " + error.message);
                        connectRecursive(requestTurnCred);
                        return [2 /*return*/];
                    }
                    socket = new sip.Socket(webSocket, true, {
                        "remoteAddress": "web." + env_1.env.baseDomain,
                        "remotePort": 443
                    }, 20000);
                    apiServer.startListening(socket);
                    sip.api.client.enableKeepAlive(socket, 25 * 1000);
                    sip.api.client.enableErrorLogging(socket, sip.api.client.getDefaultErrorLogger({
                        idString: idString,
                        log: log
                    }));
                    socket.enableLogger({
                        "socketId": idString,
                        "remoteEndId": "BACKEND",
                        "localEndId": "FRONTEND",
                        "connection": true,
                        "error": true,
                        "close": true,
                        "incomingTraffic": true,
                        "outgoingTraffic": true,
                        "ignoreApiTraffic": true
                    }, log);
                    socketCurrent = socket;
                    socket.evtConnect.attachOnce(function () {
                        log("Socket (re-)connected");
                        notConnectedUserFeedback.setVisibility(false);
                        exports.evtConnect.post(socket);
                    });
                    socket.evtClose.attachOnce(function () { return __awaiter(_this, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            if (appEvts_1.appEvts.evtOpenElsewhere.postCount !== 0) {
                                return [2 /*return*/];
                            }
                            connectRecursive(requestTurnCred);
                            return [2 /*return*/];
                        });
                    }); });
                    return [2 /*return*/];
            }
        });
    });
}
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

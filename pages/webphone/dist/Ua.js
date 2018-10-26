"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
Object.defineProperty(exports, "__esModule", { value: true });
var ts_events_extended_1 = require("ts-events-extended");
var phone_number_1 = require("phone-number");
var gateway_1 = require("../../../shared/dist/gateway");
var sip = require("ts-sip");
var runExclusive = require("run-exclusive");
var connection = require("../../../shared/dist/lib/toBackend/connection");
var remoteApiCaller = require("../../../shared/dist/lib/toBackend/remoteApiCaller");
var localApiHandlers = require("../../../shared/dist/lib/toBackend/localApiHandlers");
//JsSIP.debug.enable("JsSIP:*");
JsSIP.debug.disable("JsSIP:*");
/*
const pcConfig: RTCConfiguration = {
    "iceServers": [{ "urls": ["stun:stun1.l.google.com:19302"] }]
};
*/
var Ua = /** @class */ (function () {
    function Ua(userSim) {
        var _this = this;
        this.userSim = userSim;
        /** post isRegistered */
        this.evtRegistrationStateChanged = new ts_events_extended_1.SyncEvent();
        this.evtRingback = new ts_events_extended_1.SyncEvent();
        this.isRegistered = false;
        this.evtIncomingMessage = new ts_events_extended_1.SyncEvent();
        this.postEvtIncomingMessage = runExclusive.buildMethod(function (evtData) {
            var onProcessed;
            var pr = new Promise(function (resolve) { return onProcessed = resolve; });
            _this.evtIncomingMessage.post(__assign({}, evtData, { "onProcessed": onProcessed }));
            return pr;
        });
        /** return exactSendDate to match with sendReport and statusReport */
        this.evtIncomingCall = new ts_events_extended_1.SyncEvent();
        var imsi = userSim.sim.imsi;
        var uri = "sip:" + imsi + "-webRTC@semasim.com";
        this.jsSipSocket = new JsSipSocket(imsi, uri);
        //TODO: Try to find a way to put it outside the uri itself.
        this.jsSipUa = new JsSIP.UA({
            "sockets": this.jsSipSocket,
            uri: uri,
            "authorization_user": imsi,
            "password": this.userSim.password,
            "instance_id": Ua.instanceId.match(/"<urn:([^>]+)>"$/)[1],
            "register": false,
            "contact_uri": uri + ";enc_email=" + gateway_1.urlSafeB64.enc(Ua.email),
            "register_expires": 345600
        });
        /*
        evt 'registered' is posted only when register change
        so we use this instead.
        */
        this.jsSipSocket.evtSipPacket.attach(function (sipPacket) { return (!sip.matchRequest(sipPacket) &&
            sipPacket.headers.cseq.method === "REGISTER" &&
            sipPacket.status === 200); }, function () {
            _this.isRegistered = true;
            _this.evtRegistrationStateChanged.post(true);
        });
        this.jsSipUa.on("unregistered", function () {
            _this.isRegistered = false;
            _this.evtRegistrationStateChanged.post(false);
        });
        this.jsSipUa.on("newMessage", function (_a) {
            var originator = _a.originator, request = _a.request;
            if (originator === "remote") {
                _this.onMessage(request);
            }
        });
        this.jsSipUa.on("newRTCSession", function (_a) {
            var originator = _a.originator, session = _a.session, request = _a.request;
            if (originator === "remote") {
                _this.onIncomingCall(session, request);
            }
        });
        this.jsSipUa.start();
    }
    /** Must be called in webphone.ts */
    Ua.init = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _a, email, uaInstanceId;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, remoteApiCaller.getUaInstanceIdAndEmail()];
                    case 1:
                        _a = _b.sent(), email = _a.email, uaInstanceId = _a.uaInstanceId;
                        this.email = email;
                        this.instanceId = uaInstanceId;
                        return [2 /*return*/];
                }
            });
        });
    };
    //TODO: If no response to register do something
    Ua.prototype.register = function () {
        this.jsSipUa.register();
    };
    /**
     * Do not actually send a REGISTER expire=0.
     * Assert no packet will arrive to this UA until next register.
     * */
    Ua.prototype.unregister = function () {
        this.jsSipUa.emit("unregistered");
    };
    Ua.prototype.onMessage = function (request) {
        var bundledData = gateway_1.extractBundledDataFromHeaders((function () {
            var out = {};
            for (var key in request.headers) {
                out[key] = request.headers[key][0].raw;
            }
            return out;
        })());
        var fromNumber = this.toPhoneNumber(request.from.uri.user);
        if (bundledData.type === "RINGBACK") {
            this.evtRingback.post(bundledData.callId);
            return;
        }
        var pr = this.postEvtIncomingMessage({
            fromNumber: fromNumber,
            bundledData: bundledData,
            "text": request.body,
        });
        this.jsSipSocket.setMessageOkDelay(request, pr);
    };
    Ua.prototype.sendMessage = function (number, text, exactSendDate) {
        var _this = this;
        var extraHeaders = (function () {
            var headers = gateway_1.smuggleBundledDataInHeaders((function () {
                var bundledData = {
                    "type": "MESSAGE",
                    exactSendDate: exactSendDate
                };
                return bundledData;
            })());
            var out = [];
            for (var key in headers) {
                out.push(key + ": " + headers[key]);
            }
            return out;
        })();
        return new Promise(function (resolve, reject) { return _this.jsSipUa.sendMessage("sip:" + number + "@semasim.com", text, {
            "contentType": "text/plain; charset=UTF-8",
            extraHeaders: extraHeaders,
            "eventHandlers": {
                "succeeded": function () { return resolve(); },
                "failed": function (_a) {
                    var cause = _a.cause;
                    return reject(new Error("Send message failed " + cause));
                }
            }
        }); });
    };
    Ua.prototype.onIncomingCall = function (jsSipRtcSession, request) {
        var _this = this;
        var evtRequestTerminate = new ts_events_extended_1.VoidSyncEvent();
        var evtAccepted = new ts_events_extended_1.VoidSyncEvent();
        var evtTerminated = new ts_events_extended_1.VoidSyncEvent();
        var evtDtmf = new ts_events_extended_1.SyncEvent();
        var evtEstablished = new ts_events_extended_1.VoidSyncEvent();
        evtRequestTerminate.attachOnce(function () { return jsSipRtcSession.terminate(); });
        evtDtmf.attach(function (_a) {
            var signal = _a.signal, duration = _a.duration;
            return jsSipRtcSession.sendDTMF(signal, { duration: duration });
        });
        evtAccepted.attachOnce(function () {
            jsSipRtcSession.answer({
                "mediaConstraints": { "audio": true, "video": false },
                "pcConfig": { "iceServers": localApiHandlers.iceServers }
            });
            jsSipRtcSession.connection.ontrack =
                function (_a) {
                    var _b = __read(_a.streams, 1), stream = _b[0];
                    return playAudioStream(stream);
                };
        });
        jsSipRtcSession.once("confirmed", function () { return evtEstablished.post(); });
        jsSipRtcSession.once("ended", function () { return evtTerminated.post(); });
        jsSipRtcSession.once("failed", function () { return evtTerminated.post(); });
        this.evtIncomingCall.post({
            "fromNumber": this.toPhoneNumber(request.from.uri.user),
            "terminate": function () { return evtRequestTerminate.post(); },
            "prTerminated": Promise.race([
                evtRequestTerminate.waitFor(),
                evtTerminated.waitFor()
            ]),
            "onAccepted": function () { return __awaiter(_this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            evtAccepted.post();
                            return [4 /*yield*/, evtEstablished.waitFor()];
                        case 1:
                            _a.sent();
                            return [2 /*return*/, {
                                    "state": "ESTABLISHED",
                                    "sendDtmf": function (signal, duration) { return evtDtmf.post({ signal: signal, duration: duration }); }
                                }];
                    }
                });
            }); }
        });
    };
    Ua.prototype.placeOutgoingCall = function (number) {
        var _this = this;
        var evtEstablished = new ts_events_extended_1.VoidSyncEvent();
        var evtTerminated = new ts_events_extended_1.VoidSyncEvent();
        var evtDtmf = new ts_events_extended_1.SyncEvent();
        var evtRequestTerminate = new ts_events_extended_1.VoidSyncEvent();
        var evtRingback = new ts_events_extended_1.VoidSyncEvent();
        this.jsSipUa.call("sip:" + number + "@semasim.com", {
            "mediaConstraints": { "audio": true, "video": false },
            "pcConfig": { "iceServers": localApiHandlers.iceServers },
            "eventHandlers": {
                "connecting": function () {
                    var jsSipRtcSession = this;
                    if (!!evtRequestTerminate.postCount) {
                        jsSipRtcSession.terminate();
                        return;
                    }
                    evtRequestTerminate.attachOnce(function () { return jsSipRtcSession.terminate(); });
                    evtDtmf.attach(function (_a) {
                        var signal = _a.signal, duration = _a.duration;
                        return jsSipRtcSession.sendDTMF(signal, { duration: duration });
                    });
                    jsSipRtcSession.connection.ontrack =
                        function (_a) {
                            var _b = __read(_a.streams, 1), stream = _b[0];
                            return playAudioStream(stream);
                        };
                },
                "confirmed": function () { return evtEstablished.post(); },
                "ended": function () { return evtTerminated.post(); },
                "sending": function (_a) {
                    var request = _a.request;
                    return _this.evtRingback.waitFor(function (callId) { return callId === request.call_id; }, 30000)
                        .then(function () { return evtRingback.post(); })
                        .catch(function () { });
                }
            }
        });
        return {
            "prNextState": new Promise(function (resolve) { return __awaiter(_this, void 0, void 0, function () {
                var _this = this;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, Promise.race([
                                evtRingback.waitFor(),
                                evtEstablished.waitFor()
                            ])];
                        case 1:
                            _a.sent();
                            resolve({
                                "state": "RINGBACK",
                                "prNextState": new Promise(function (resolve) { return __awaiter(_this, void 0, void 0, function () {
                                    return __generator(this, function (_a) {
                                        switch (_a.label) {
                                            case 0:
                                                if (!!evtEstablished.postCount) return [3 /*break*/, 2];
                                                return [4 /*yield*/, evtEstablished.waitFor()];
                                            case 1:
                                                _a.sent();
                                                _a.label = 2;
                                            case 2:
                                                resolve({
                                                    "state": "ESTABLISHED",
                                                    "sendDtmf": function (signal, duration) {
                                                        return evtDtmf.post({ signal: signal, duration: duration });
                                                    }
                                                });
                                                return [2 /*return*/];
                                        }
                                    });
                                }); })
                            });
                            return [2 /*return*/];
                    }
                });
            }); }),
            "prTerminated": Promise.race([
                evtRequestTerminate.waitFor(),
                evtTerminated.waitFor()
            ]),
            "terminate": function () { return evtRequestTerminate.post(); }
        };
    };
    /** convert raw number in phoneNumber */
    Ua.prototype.toPhoneNumber = function (number) {
        return phone_number_1.phoneNumber.build(number, this.userSim.sim.country ? this.userSim.sim.country.iso : undefined);
    };
    return Ua;
}());
exports.Ua = Ua;
function playAudioStream(stream) {
    $("<audio>", { "autoplay": "" }).get(0)["srcObject"] = stream;
}
var JsSipSocket = /** @class */ (function () {
    function JsSipSocket(imsi, sip_uri) {
        var _this = this;
        this.sip_uri = sip_uri;
        this.evtSipPacket = new ts_events_extended_1.SyncEvent();
        this.via_transport = "WSS";
        this.url = connection.url;
        this.messageOkDelays = new Map();
        (function () { return __awaiter(_this, void 0, void 0, function () {
            var onBackedSocketConnect, socket;
            var _this = this;
            return __generator(this, function (_a) {
                onBackedSocketConnect = function (backendSocket) {
                    var onSipPacket = function (sipPacket) {
                        if (gateway_1.readImsi(sipPacket) !== imsi) {
                            return;
                        }
                        _this.evtSipPacket.post(sipPacket);
                        _this.ondata(sip.toData(sipPacket).toString("utf8"));
                    };
                    backendSocket.evtRequest.attach(onSipPacket);
                    backendSocket.evtResponse.attach(onSipPacket);
                };
                connection.evtConnect.attach(function (socket) { return onBackedSocketConnect(socket); });
                socket = connection.get();
                if (!(socket instanceof Promise)) {
                    onBackedSocketConnect(socket);
                }
                return [2 /*return*/];
            });
        }); })();
    }
    JsSipSocket.prototype.connect = function () {
        this.onconnect();
    };
    JsSipSocket.prototype.disconnect = function () {
        throw new Error("JsSip should not call disconnect");
    };
    /**
     * To call when receiving as SIP MESSAGE
     * to prevent directly sending the 200 OK
     * response immediately but rather wait
     * until some action have been completed.
     *
     * @param request the request prop of the
     * eventData emitted by JsSIP UA for the
     * "newMessage" event. ( when originator === remote )
     * @param pr The response to the SIP MESSAGE
     * will not be sent until this promise resolve.
     */
    JsSipSocket.prototype.setMessageOkDelay = function (request, pr) {
        this.messageOkDelays.set(request.getHeader("Call-ID"), pr);
    };
    JsSipSocket.prototype.send = function (data) {
        var _this = this;
        (function () { return __awaiter(_this, void 0, void 0, function () {
            var sipPacket, sipResponse, callId, pr, socket;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        sipPacket = sip.parse(Buffer.from(data, "utf8"));
                        if (!!sip.matchRequest(sipPacket)) return [3 /*break*/, 2];
                        sipResponse = sipPacket;
                        if (!(sipResponse.headers.cseq.method === "MESSAGE")) return [3 /*break*/, 2];
                        callId = sipResponse.headers["call-id"];
                        pr = this.messageOkDelays.get(callId);
                        if (!!!pr) return [3 /*break*/, 2];
                        return [4 /*yield*/, pr];
                    case 1:
                        _a.sent();
                        this.messageOkDelays.delete(callId);
                        _a.label = 2;
                    case 2: return [4 /*yield*/, connection.get()];
                    case 3:
                        socket = _a.sent();
                        socket.write(sip.parse(Buffer.from(data, "utf8")));
                        return [2 /*return*/];
                }
            });
        }); })();
        return true;
    };
    JsSipSocket.prototype.onconnect = function () {
        throw new Error("Missing impl");
    };
    JsSipSocket.prototype.ondisconnect = function (error, code, reason) {
        throw new Error("Missing impl");
    };
    JsSipSocket.prototype.ondata = function (data) {
        throw new Error("Missing impl");
    };
    return JsSipSocket;
}());

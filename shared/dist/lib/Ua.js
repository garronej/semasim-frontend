"use strict";
//NOTE: Require jssip_compat loaded on the page.
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
var ts_events_extended_1 = require("ts-events-extended");
var bundledData_1 = require("../gateway/bundledData");
var readImsi_1 = require("../gateway/readImsi");
var serializedUaObjectCarriedOverSipContactParameter = require("../gateway/serializedUaObjectCarriedOverSipContactParameter");
var sip = require("ts-sip");
var runExclusive = require("run-exclusive");
var env_1 = require("./env");
//JsSIP.debug.enable("JsSIP:*");
JsSIP.debug.disable("JsSIP:*");
function uaInstantiationHelper(params) {
    return __awaiter(this, void 0, void 0, function () {
        var _a, towardUserDecryptor, towardUserEncryptKeyStr, getTowardSimEncryptor, pushNotificationToken, _b, AuthenticatedSessionDescriptorSharedData, backendEvents, connection, _c;
        var _this = this;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    _a = params.cryptoRelatedParams, towardUserDecryptor = _a.towardUserDecryptor, towardUserEncryptKeyStr = _a.towardUserEncryptKeyStr, getTowardSimEncryptor = _a.getTowardSimEncryptor, pushNotificationToken = params.pushNotificationToken;
                    return [4 /*yield*/, Promise.all([
                            Promise.resolve().then(function () { return require("./localStorage/AuthenticatedSessionDescriptorSharedData"); }),
                            Promise.resolve().then(function () { return require("./toBackend/events"); }),
                            Promise.resolve().then(function () { return require("./toBackend/connection"); })
                        ])];
                case 1:
                    _b = __read.apply(void 0, [_d.sent(), 3]), AuthenticatedSessionDescriptorSharedData = _b[0].AuthenticatedSessionDescriptorSharedData, backendEvents = _b[1], connection = _b[2];
                    _c = Ua.bind;
                    return [4 /*yield*/, (function () { return __awaiter(_this, void 0, void 0, function () {
                            var _a, email, uaInstanceId;
                            return __generator(this, function (_b) {
                                switch (_b.label) {
                                    case 0: return [4 /*yield*/, AuthenticatedSessionDescriptorSharedData.get()];
                                    case 1:
                                        _a = _b.sent(), email = _a.email, uaInstanceId = _a.uaInstanceId;
                                        return [2 /*return*/, {
                                                "instance": uaInstanceId,
                                                "pushToken": pushNotificationToken,
                                                towardUserEncryptKeyStr: towardUserEncryptKeyStr,
                                                "userEmail": email
                                            }];
                                }
                            });
                        }); })()];
                case 2: return [2 /*return*/, new (_c.apply(Ua, [void 0, _d.sent(),
                        towardUserDecryptor,
                        (function () {
                            var evtUnregisteredByGateway = new ts_events_extended_1.SyncEvent();
                            var onEvt = function (_a) {
                                var imsi = _a.sim.imsi;
                                return evtUnregisteredByGateway.post({ imsi: imsi });
                            };
                            backendEvents.evtSimPasswordChanged.attach(onEvt);
                            backendEvents.evtSimPermissionLost.attach(onEvt);
                            backendEvents.evtSimReachabilityStatusChange.attach(function (_a) {
                                var reachableSimState = _a.reachableSimState;
                                return reachableSimState === undefined;
                            }, onEvt);
                            return evtUnregisteredByGateway;
                        })(),
                        getTowardSimEncryptor,
                        function (imsi) { return new JsSipSocket(imsi, connection); },
                        function () { return backendEvents.rtcIceEServer.getCurrent(); }]))()];
            }
        });
    });
}
exports.uaInstantiationHelper = uaInstantiationHelper;
var Ua = /** @class */ (function () {
    /** evtUnregisteredByGateway should post when a sim that was previously
     * reachable goes unreachable, when this happen SIP packets can no longer be
     * routed to the gateway and the gateway unregister all the SIP contact
     * It happen also when an user lose access to sim or need to refresh sim password.
     * */
    function Ua(uaDescriptorWithoutPlatform, towardUserDecryptor, evtUnregisteredByGateway, getTowardSimEncryptor, getJsSipSocket, getRtcIceServer) {
        this.towardUserDecryptor = towardUserDecryptor;
        this.evtUnregisteredByGateway = evtUnregisteredByGateway;
        this.getTowardSimEncryptor = getTowardSimEncryptor;
        this.getJsSipSocket = getJsSipSocket;
        this.getRtcIceServer = getRtcIceServer;
        this.descriptor = __assign(__assign({}, uaDescriptorWithoutPlatform), { "platform": (function () {
                switch (env_1.env.jsRuntimeEnv) {
                    case "browser": return "web";
                    case "react-native": return env_1.env.hostOs;
                }
            })() });
    }
    Ua.prototype.newUaSim = function (usableUserSim) {
        var _this = this;
        var sim = usableUserSim.sim;
        return new UaSim(this.descriptor, this.towardUserDecryptor, this.getRtcIceServer, (function () {
            var out = new ts_events_extended_1.VoidSyncEvent();
            _this.evtUnregisteredByGateway.attach(function (_a) {
                var imsi = _a.imsi;
                return imsi === sim.imsi;
            }, function () { return out.post(); });
            return out;
        })(), this.getJsSipSocket(sim.imsi), sim.imsi, usableUserSim.password, this.getTowardSimEncryptor(usableUserSim).towardSimEncryptor);
    };
    return Ua;
}());
exports.Ua = Ua;
var UaSim = /** @class */ (function () {
    /** Use UA.prototype.newUaSim to instantiate an UaSim */
    function UaSim(uaDescriptor, towardUserDecryptor, getRtcIceServer, evtUnregisteredByGateway, jsSipSocket, imsi, sipPassword, towardSimEncryptor) {
        var _this = this;
        this.uaDescriptor = uaDescriptor;
        this.towardUserDecryptor = towardUserDecryptor;
        this.getRtcIceServer = getRtcIceServer;
        this.jsSipSocket = jsSipSocket;
        this.towardSimEncryptor = towardSimEncryptor;
        /** post isRegistered */
        this.evtRegistrationStateChanged = new ts_events_extended_1.SyncEvent();
        this.evtRingback = new ts_events_extended_1.SyncEvent();
        this.isRegistered = false;
        this.evtIncomingMessage = new ts_events_extended_1.SyncEvent();
        this.postEvtIncomingMessage = runExclusive.buildMethod(function (evtData) {
            var onProcessed;
            var pr = new Promise(function (resolve) { return onProcessed = resolve; });
            _this.evtIncomingMessage.post(__assign(__assign({}, evtData), { "onProcessed": onProcessed }));
            return pr;
        });
        this.evtIncomingCall = new ts_events_extended_1.SyncEvent();
        var uri = this.jsSipSocket.sip_uri;
        var register_expires = 61;
        //NOTE: Do not put more less than 60 or less than 7200 for register expire ( asterisk will respond with 60 or 7200 )
        this.jsSipUa = new JsSIP.UA({
            "sockets": this.jsSipSocket,
            uri: uri,
            "authorization_user": imsi,
            "password": sipPassword,
            //NOTE: The ua instance id is also bundled in the contact uri but
            //but jsSip does not allow us to not include an instance id
            //if we don't provide one it will generate one for us.
            //So we are providing it for consistency.
            "instance_id": uaDescriptor.instance.match(/"<urn:([^>]+)>"$/)[1],
            "register": false,
            "contact_uri": uri + ";" + serializedUaObjectCarriedOverSipContactParameter.buildParameter(uaDescriptor),
            register_expires: register_expires
        });
        var lastRegisterTime = 0;
        this.jsSipUa.on("registrationExpiring", function () { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                if (!this.isRegistered) {
                    return [2 /*return*/];
                }
                //NOTE: For react native, jsSIP does not post "unregistered" event when registration
                //actually expire.
                if (Date.now() - lastRegisterTime >= register_expires * 1000) {
                    console.log("Sip registration has expired while app was in the background");
                    this.jsSipUa.emit("unregistered");
                }
                else {
                    console.log("Ua registration expiring for " + imsi);
                }
                console.log("re-registering");
                this.jsSipUa.register();
                return [2 /*return*/];
            });
        }); });
        evtUnregisteredByGateway.attach(function () { return _this.jsSipUa.emit("unregistered"); });
        /*
        evt 'registered' is posted only when register change
        so we use this instead.
        */
        this.jsSipSocket.evtSipPacket.attach(function (sipPacket) { return (!sip.matchRequest(sipPacket) &&
            sipPacket.headers.cseq.method === "REGISTER" &&
            sipPacket.status === 200); }, function () {
            lastRegisterTime = Date.now();
            _this.isRegistered = true;
            _this.evtRegistrationStateChanged.post(true);
        });
        this.jsSipUa.on("unregistered", function () {
            console.log("ua sim unregistered");
            _this.isRegistered = false;
            _this.evtRegistrationStateChanged.post(false);
        });
        this.jsSipUa.on("newMessage", function (_a) {
            var originator = _a.originator, request = _a.request;
            if (originator !== "remote") {
                return;
            }
            _this.onMessage(request);
        });
        this.jsSipUa.on("newRTCSession", function (_a) {
            var originator = _a.originator, session = _a.session, request = _a.request;
            if (originator !== "remote") {
                return;
            }
            _this.onIncomingCall(session, request);
        });
        this.jsSipUa.start();
    }
    //TODO: If no response to register do something
    UaSim.prototype.register = function () {
        this.jsSipUa.register();
    };
    UaSim.prototype.unregister = function () {
        if (!this.isRegistered) {
            return;
        }
        this.jsSipUa.unregister();
    };
    UaSim.prototype.onMessage = function (request) {
        return __awaiter(this, void 0, void 0, function () {
            var bundledData, fromNumber, pr;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, bundledData_1.extractBundledDataFromHeaders((function () {
                            var out = {};
                            for (var key in request.headers) {
                                out[key] = request.headers[key][0].raw;
                            }
                            return out;
                        })(), this.towardUserDecryptor)];
                    case 1:
                        bundledData = _a.sent();
                        fromNumber = request.from.uri.user;
                        if (bundledData.type === "RINGBACK") {
                            this.evtRingback.post(bundledData.callId);
                            return [2 /*return*/];
                        }
                        pr = this.postEvtIncomingMessage({
                            fromNumber: fromNumber,
                            bundledData: bundledData
                        });
                        this.jsSipSocket.setMessageOkDelay(request, pr);
                        return [2 /*return*/];
                }
            });
        });
    };
    UaSim.prototype.sendMessage = function (number, bundledData) {
        var _this = this;
        return new Promise(function (resolve, reject) { return __awaiter(_this, void 0, void 0, function () {
            var _a, _b, _c, _d, _e;
            return __generator(this, function (_f) {
                switch (_f.label) {
                    case 0:
                        _b = (_a = this.jsSipUa).sendMessage;
                        _c = ["sip:" + number + "@" + env_1.env.baseDomain,
                            "| encrypted message bundled in header |"];
                        _d = {
                            "contentType": "text/plain; charset=UTF-8"
                        };
                        _e = "extraHeaders";
                        return [4 /*yield*/, bundledData_1.smuggleBundledDataInHeaders(bundledData, this.towardSimEncryptor).then(function (headers) { return Object.keys(headers).map(function (key) { return key + ": " + headers[key]; }); })];
                    case 1: return [2 /*return*/, _b.apply(_a, _c.concat([(_d[_e] = _f.sent(),
                                _d["eventHandlers"] = {
                                    "succeeded": function () { return resolve(); },
                                    "failed": function (_a) {
                                        var cause = _a.cause;
                                        return reject(new Error("Send message failed " + cause));
                                    }
                                },
                                _d)]))];
                }
            });
        }); });
    };
    UaSim.prototype.onIncomingCall = function (jsSipRtcSession, request) {
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
        evtAccepted.attachOnce(function () { return __awaiter(_this, void 0, void 0, function () {
            var rtcIceServer;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getRtcIceServer()];
                    case 1:
                        rtcIceServer = _a.sent();
                        jsSipRtcSession.on("icecandidate", newIceCandidateHandler(rtcIceServer));
                        jsSipRtcSession.answer({
                            "mediaConstraints": { "audio": true, "video": false },
                            "pcConfig": { "iceServers": [rtcIceServer] }
                        });
                        jsSipRtcSession.connection.addEventListener("track", function (_a) {
                            var _b = __read(_a.streams, 1), stream = _b[0];
                            return playAudioStream(stream);
                        });
                        return [2 /*return*/];
                }
            });
        }); });
        jsSipRtcSession.once("confirmed", function () { return evtEstablished.post(); });
        jsSipRtcSession.once("ended", function () { return evtTerminated.post(); });
        jsSipRtcSession.once("failed", function () { return evtTerminated.post(); });
        this.evtIncomingCall.post({
            "fromNumber": request.from.uri.user,
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
    UaSim.prototype.placeOutgoingCall = function (number) {
        return __awaiter(this, void 0, void 0, function () {
            var evtEstablished, evtTerminated, evtDtmf, evtRequestTerminate, evtRingback, rtcICEServer;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        evtEstablished = new ts_events_extended_1.VoidSyncEvent();
                        evtTerminated = new ts_events_extended_1.VoidSyncEvent();
                        evtDtmf = new ts_events_extended_1.SyncEvent();
                        evtRequestTerminate = new ts_events_extended_1.VoidSyncEvent();
                        evtRingback = new ts_events_extended_1.VoidSyncEvent();
                        return [4 /*yield*/, this.getRtcIceServer()];
                    case 1:
                        rtcICEServer = _a.sent();
                        this.jsSipUa.call("sip:" + number + "@" + env_1.env.baseDomain, {
                            "mediaConstraints": { "audio": true, "video": false },
                            "pcConfig": {
                                "iceServers": [rtcICEServer]
                            },
                            "eventHandlers": {
                                "icecandidate": newIceCandidateHandler(rtcICEServer),
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
                                    jsSipRtcSession.connection.addEventListener("track", function (_a) {
                                        var _b = __read(_a.streams, 1), stream = _b[0];
                                        return playAudioStream(stream);
                                    });
                                },
                                "confirmed": function () { return evtEstablished.post(); },
                                "ended": function () { return evtTerminated.post(); },
                                "failed": function () { return evtTerminated.post(); },
                                "sending": function (_a) {
                                    var request = _a.request;
                                    return _this.evtRingback.waitFor(function (callId) { return callId === request.call_id; }, 30000)
                                        .then(function () { return evtRingback.post(); })
                                        .catch(function () { });
                                }
                            }
                        });
                        return [2 /*return*/, {
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
                            }];
                }
            });
        });
    };
    return UaSim;
}());
exports.UaSim = UaSim;
function playAudioStream(stream) {
    var audio = document.createElement("audio");
    audio.autoplay = true;
    audio.srcObject = stream;
}
var JsSipSocket = /** @class */ (function () {
    function JsSipSocket(imsi, connection) {
        var _this = this;
        this.connection = connection;
        this.evtSipPacket = new ts_events_extended_1.SyncEvent();
        this.via_transport = "WSS";
        this.url = this.connection.url;
        this.messageOkDelays = new Map();
        this.sip_uri = "sip:" + imsi + "@" + env_1.env.baseDomain;
        var onBackedSocketConnect = function (backendSocket) {
            {
                var onSipPacket = function (sipPacket) {
                    if (readImsi_1.readImsi(sipPacket) !== imsi) {
                        return;
                    }
                    _this.sdpHacks("INCOMING", sipPacket);
                    _this.evtSipPacket.post(sipPacket);
                    _this.ondata(sip.toData(sipPacket).toString("utf8"));
                };
                backendSocket.evtRequest.attach(onSipPacket);
                backendSocket.evtResponse.attach(onSipPacket);
            }
            backendSocket.evtPacketPreWrite.attach(function (sipPacket) { return _this.sdpHacks("OUTGOING", sipPacket); });
        };
        connection.evtConnect.attach(function (socket) { return onBackedSocketConnect(socket); });
        var socket = connection.get();
        if (!(socket instanceof Promise)) {
            onBackedSocketConnect(socket);
        }
    }
    JsSipSocket.prototype.sdpHacks = function (direction, sipPacket) {
        if (sipPacket.headers["content-type"] !== "application/sdp") {
            return;
        }
        var editSdp = function (sdpEditor) {
            var parsedSdp = sip.parseSdp(sip.getPacketContent(sipPacket)
                .toString("utf8"));
            sdpEditor(parsedSdp);
            sip.setPacketContent(sipPacket, sip.stringifySdp(parsedSdp));
        };
        switch (direction) {
            case "INCOMING":
                //NOTE: Sdp Hack for Mozilla
                if (!/firefox/i.test(navigator.userAgent)) {
                    return;
                }
                console.log("Firefox SDP hack !");
                editSdp(function (parsedSdp) {
                    var a = parsedSdp["m"][0]["a"];
                    if (!!a.find(function (v) { return /^mid:/i.test(v); })) {
                        return;
                    }
                    parsedSdp["m"][0]["a"] = __spread(a, ["mid:0"]);
                });
                break;
            case "OUTGOING":
                editSdp(function (parsedSdp) {
                    //NOTE: We allow to try establishing P2P connection only 
                    //when the public address resolved by the stun correspond
                    //to a private address of class A ( 192.168.x.x ).
                    //Otherwise we stripe out the srflx candidate and use turn.
                    var a = parsedSdp["m"][0]["a"];
                    var updated_a = a.filter(function (line) {
                        var match = line.match(/srflx\ raddr\ ([0-9]+)\./);
                        if (!match) {
                            return true;
                        }
                        return match[1] === "192";
                    });
                    parsedSdp["m"][0]["a"] = updated_a;
                });
                break;
        }
    };
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
            var sipPacket, sipResponse, callId, pr, socketOrPrSocket, socket, _a, isSent;
            return __generator(this, function (_b) {
                switch (_b.label) {
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
                        _b.sent();
                        this.messageOkDelays.delete(callId);
                        _b.label = 2;
                    case 2:
                        if (!true) return [3 /*break*/, 7];
                        socketOrPrSocket = this.connection.get();
                        if (!(socketOrPrSocket instanceof Promise)) return [3 /*break*/, 4];
                        return [4 /*yield*/, socketOrPrSocket];
                    case 3:
                        _a = (_b.sent());
                        return [3 /*break*/, 5];
                    case 4:
                        _a = socketOrPrSocket;
                        _b.label = 5;
                    case 5:
                        socket = _a;
                        return [4 /*yield*/, socket.write(sip.parse(Buffer.from(data, "utf8")))];
                    case 6:
                        isSent = _b.sent();
                        if (!isSent) {
                            console.log("WARNING: websocket sip data was not sent successfully", data);
                            return [3 /*break*/, 2];
                        }
                        return [3 /*break*/, 7];
                    case 7: return [2 /*return*/];
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
/** Let end gathering ICE candidates as quickly as possible. */
function newIceCandidateHandler(rtcICEServer) {
    var isReady = newIceCandidateHandler.isReadyFactory(rtcICEServer);
    var readyTimer = undefined;
    return function (data) {
        var candidate = data.candidate, ready = data.ready;
        //console.log(candidate);
        var readyState = isReady(candidate.candidate);
        console.log("ICE: " + readyState);
        switch (readyState) {
            case "NOT READY": return;
            case "AT LEAST ONE RELAY CANDIDATE READY":
                if (readyTimer === undefined) {
                    readyTimer = setTimeout(function () {
                        console.log("Timing out ice candidates gathering");
                        ready();
                    }, 300);
                }
                return;
            case "ALL CANDIDATES READY":
                clearTimeout(readyTimer);
                ready();
                return;
        }
    };
}
(function (newIceCandidateHandler) {
    function isReadyFactory(rtcICEServer) {
        //console.log(JSON.stringify(rtcICEServer, null, 2));
        var p = (function () {
            var urls = typeof rtcICEServer.urls === "string" ?
                [rtcICEServer.urls] : rtcICEServer.urls;
            ;
            return {
                "isSrflxCandidateExpected": !!urls.find(function (url) { return !!url.match(/^stun/i); }),
                "isRelayCandidateExpected": !!urls.find(function (url) { return !!url.match(/^turn:/i); }),
                "isEncryptedRelayCandidateExpected": !!urls.find(function (url) { return !!url.match(/^turns:/i); }),
                "lines": new Array()
            };
        })();
        //console.log(JSON.stringify(p, null, 2));
        return function (line) {
            p.lines.push(line);
            var isRtcpExcepted = !!p.lines
                .map(function (line) { return parseLine(line); })
                .find(function (_a) {
                var component = _a.component;
                return component === "RTCP";
            });
            if (isFullyReady(__assign(__assign({}, p), { isRtcpExcepted: isRtcpExcepted }))) {
                return "ALL CANDIDATES READY";
            }
            return countRelayCandidatesReady(p.lines, isRtcpExcepted) >= 1 ?
                "AT LEAST ONE RELAY CANDIDATE READY" : "NOT READY";
        };
    }
    newIceCandidateHandler.isReadyFactory = isReadyFactory;
    function parseLine(line) {
        var match = line.match(/(1|2)\s+(?:udp|tcp)\s+([0-9]+)\s/i);
        return {
            "component": match[1] === "1" ? "RTP" : "RTCP",
            "priority": parseInt(match[2])
        };
    }
    function countRelayCandidatesReady(lines, isRtcpExcepted) {
        var parsedLines = lines
            .filter(function (line) { return !!line.match(/udp.+relay/i); })
            .map(parseLine);
        var parsedRtpLines = parsedLines
            .filter(function (_a) {
            var component = _a.component;
            return component === "RTP";
        });
        if (!isRtcpExcepted) {
            return parsedRtpLines.length;
        }
        var parsedRtcpLines = parsedLines
            .filter(function (_a) {
            var component = _a.component;
            return component === "RTCP";
        });
        return parsedRtpLines
            .filter(function (_a) {
            var rtpPriority = _a.priority;
            return !!parsedRtcpLines.find(function (_a) {
                var priority = _a.priority;
                return Math.abs(priority - rtpPriority) === 1;
            });
        })
            .length;
    }
    function isSrflxCandidateReady(lines, isRtcpExcepted) {
        var parsedLines = lines
            .filter(function (line) { return !!line.match(/udp.+srflx/i); })
            .map(parseLine);
        var parsedRtpLines = parsedLines
            .filter(function (_a) {
            var component = _a.component;
            return component === "RTP";
        });
        if (!isRtcpExcepted) {
            return parsedRtpLines.length !== 0;
        }
        var parsedRtcpLines = parsedLines
            .filter(function (_a) {
            var component = _a.component;
            return component === "RTCP";
        });
        return !!parsedRtpLines
            .find(function (_a) {
            var rtpPriority = _a.priority;
            return !!parsedRtcpLines.find(function (_a) {
                var priority = _a.priority;
                return Math.abs(priority - rtpPriority) === 1;
            });
        });
    }
    function isFullyReady(p) {
        return (!p.isSrflxCandidateExpected ?
            true :
            isSrflxCandidateReady(p.lines, p.isRtcpExcepted)) && ((p.isRelayCandidateExpected ? 1 : 0)
            +
                (p.isEncryptedRelayCandidateExpected ? 1 : 0)
            <=
                countRelayCandidatesReady(p.lines, p.isRtcpExcepted));
    }
})(newIceCandidateHandler || (newIceCandidateHandler = {}));

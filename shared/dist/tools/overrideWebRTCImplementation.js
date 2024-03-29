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
var __values = (this && this.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.testOverrideWebRTCImplementation = exports.overrideWebRTCImplementation = void 0;
var evt_1 = require("evt");
function overrideWebRTCImplementation(methods) {
    console.log("Using alternative WebRTC implementation !!");
    //NOTE: Polyfills for deprecated RTCSessionDescription constructor.
    window["RTCSessionDescription"] = (function RTCSessionDescription(rtcSessionDescriptionInit) {
        return Object.setPrototypeOf((function () {
            var _a = __read(!!rtcSessionDescriptionInit ?
                [rtcSessionDescriptionInit.sdp || null, rtcSessionDescriptionInit.type || null] :
                [null, null], 2), sdp = _a[0], type = _a[1];
            return { sdp: sdp, type: type };
        })(), {
            "constructor": RTCSessionDescription,
            "toJSON": function toJSON() {
                var _a = this, sdp = _a.sdp, type = _a.type;
                return { sdp: sdp, type: type };
            }
        });
    });
    //NOTE: Polyfills RTCIceCandidate constructor not provided by react-native.
    window["RTCIceCandidate"] = (function RTCIceCandidate(rtcIceCandidateInit) {
        return Object.setPrototypeOf((function () {
            var p = rtcIceCandidateInit;
            var _a = __read(!!p ?
                [p.candidate || null, p.sdpMid || null, p.sdpMLineIndex || null, p.usernameFragment || null] :
                [null, null, null, null], 4), candidate = _a[0], sdpMid = _a[1], sdpMLineIndex = _a[2], usernameFragment = _a[3];
            return Object.defineProperties({ candidate: candidate, sdpMid: sdpMid, sdpMLineIndex: sdpMLineIndex, usernameFragment: usernameFragment }, {
                "component": {
                    "enumerable": true,
                    "get": function () {
                        throw new Error("component not implemented");
                    }
                },
                "foundation": {
                    "enumerable": true,
                    "get": function () {
                        throw new Error("foundation not implemented");
                    }
                },
                "ip": {
                    "enumerable": true,
                    "get": function () {
                        throw new Error("ip not implemented");
                    }
                },
                "port": {
                    "enumerable": true,
                    "get": function () {
                        throw new Error("port not implemented");
                    }
                },
                "priority": {
                    "enumerable": true,
                    "get": function () {
                        throw new Error("priority not implemented");
                    }
                },
                "protocol": {
                    "enumerable": true,
                    "get": function () {
                        throw new Error("protocol not implemented");
                    }
                },
                "relatedAddress": {
                    "enumerable": true,
                    "get": function () {
                        throw new Error("relatedAddress not implemented");
                    }
                },
                "relatedPort": {
                    "enumerable": true,
                    "get": function () {
                        throw new Error("relatedPort not implemented");
                    }
                }
            });
        })(), {
            "constructor": RTCIceCandidate,
            "toJSON": function toJSON() {
                var _a = this, candidate = _a.candidate, sdpMid = _a.sdpMid, sdpMLineIndex = _a.sdpMLineIndex, usernameFragment = _a.usernameFragment;
                return { candidate: candidate, sdpMid: sdpMid, sdpMLineIndex: sdpMLineIndex, usernameFragment: usernameFragment };
            },
        });
    });
    var getCounter = (function () {
        var counter = (function () {
            var min = -2147483000;
            var max = 1147483000;
            return Math.floor(Math.random() * (max - min)) + min;
        })();
        return function () { return counter++; };
    })();
    var evtIcecandidate = new evt_1.Evt();
    var evtIceconnectionstatechange = new evt_1.Evt();
    var evtSignalingstatechange = new evt_1.Evt();
    var evtMethodReturn = new evt_1.Evt();
    var refByMediaStream = new WeakMap();
    var getUserMediaProxy = function getUserMedia(mediaStreamConstraints) {
        return __awaiter(this, void 0, void 0, function () {
            var mediaStreamRef, ref_1, mediaStreamProxy;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        mediaStreamRef = getCounter();
                        ref_1 = getCounter();
                        methods.getUserMedia(mediaStreamRef, JSON.stringify(mediaStreamConstraints), ref_1);
                        return [4 /*yield*/, evtMethodReturn.waitFor(function (_a) {
                                var callRef = _a.callRef;
                                return callRef === ref_1;
                            })];
                    case 1:
                        _a.sent();
                        mediaStreamProxy = Object.setPrototypeOf({
                            "getTracks": function () { return [
                                ({
                                    "stop": function () { return methods.stopMediaStreamTrack(mediaStreamRef); }
                                })
                            ]; }
                        }, { "constructor": function MediaStream() { } });
                        refByMediaStream.set(mediaStreamProxy, mediaStreamRef);
                        return [2 /*return*/, mediaStreamProxy];
                }
            });
        });
    };
    var RTCPeerConnectionProxy = function RTCPeerConnection(rtcConfiguration) {
        var e_1, _a;
        var _this = this;
        var rtcPeerConnectionRef = getCounter();
        methods.createRTCPeerConnection(rtcPeerConnectionRef, JSON.stringify(rtcConfiguration));
        var properties = {
            //WARNING: Never updated, I guess in our implementation it's ok...
            "iceGatheringState": "new",
            "iceConnectionState": "new",
            "localDescription": null,
            "signalingState": "stable"
        };
        evtIceconnectionstatechange.attach(function (_a) {
            var ref = _a.rtcPeerConnectionRef;
            return ref === rtcPeerConnectionRef;
        }, function (_a) {
            var iceConnectionState = _a.iceConnectionState;
            return properties.iceConnectionState = iceConnectionState;
        });
        evtSignalingstatechange.attach(function (_a) {
            var ref = _a.rtcPeerConnectionRef;
            return ref === rtcPeerConnectionRef;
        }, function (_a) {
            var rtcSignalingState = _a.rtcSignalingState;
            return properties.signalingState = rtcSignalingState;
        });
        evtIcecandidate.attach(function (_a) {
            var ref = _a.rtcPeerConnectionRef;
            return ref === rtcPeerConnectionRef;
        }, function (_a) {
            var localDescriptionRTCSessionDescriptionInitOrNullJson = _a.localDescriptionRTCSessionDescriptionInitOrNullJson;
            return properties.localDescription = (function () {
                var localDescriptionRTCSessionDescriptionInitOrNull = JSON.parse(localDescriptionRTCSessionDescriptionInitOrNullJson);
                return localDescriptionRTCSessionDescriptionInitOrNull !== null ?
                    new RTCSessionDescription(localDescriptionRTCSessionDescriptionInitOrNull) : null;
            })();
        });
        var rtcPeerConnectionProxy = __assign(__assign({ "createAnswer": function (_options) { return __awaiter(_this, void 0, void 0, function () {
                var ref, rtcSessionDescriptionInitJson;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            ref = getCounter();
                            methods.createAnswerForRTCPeerConnection(rtcPeerConnectionRef, ref);
                            return [4 /*yield*/, evtMethodReturn.waitFor(function (_a) {
                                    var callRef = _a.callRef;
                                    return callRef === ref;
                                })];
                        case 1:
                            rtcSessionDescriptionInitJson = (_a.sent()).out;
                            //NOTE: We could just JSON.parse, as the return type is *Init
                            return [2 /*return*/, new RTCSessionDescription(JSON.parse(rtcSessionDescriptionInitJson))];
                    }
                });
            }); }, "createOffer": function (_options) { return __awaiter(_this, void 0, void 0, function () {
                var ref, rtcSessionDescriptionInitJson;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            ref = getCounter();
                            methods.createOfferForRTCPeerConnection(rtcPeerConnectionRef, ref);
                            return [4 /*yield*/, evtMethodReturn.waitFor(function (_a) {
                                    var callRef = _a.callRef;
                                    return callRef === ref;
                                })];
                        case 1:
                            rtcSessionDescriptionInitJson = (_a.sent()).out;
                            //NOTE: We could just JSON.parse, as the return type is *Init
                            return [2 /*return*/, new RTCSessionDescription(JSON.parse(rtcSessionDescriptionInitJson))];
                    }
                });
            }); }, "setLocalDescription": function (rtcSessionDescriptionInit) { return __awaiter(_this, void 0, void 0, function () {
                var ref;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            properties.localDescription = new RTCSessionDescription(rtcSessionDescriptionInit);
                            ref = getCounter();
                            methods.setLocalDescriptionOfRTCPeerConnection(rtcPeerConnectionRef, JSON.stringify(rtcSessionDescriptionInit), ref);
                            return [4 /*yield*/, evtMethodReturn.waitFor(function (_a) {
                                    var callRef = _a.callRef;
                                    return callRef === ref;
                                })];
                        case 1:
                            _a.sent();
                            return [2 /*return*/];
                    }
                });
            }); }, "setRemoteDescription": function (rtcSessionDescriptionInit) { return __awaiter(_this, void 0, void 0, function () {
                var ref;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            ref = getCounter();
                            methods.setRemoteDescriptionOfRTCPeerConnection(rtcPeerConnectionRef, JSON.stringify(rtcSessionDescriptionInit), ref);
                            return [4 /*yield*/, evtMethodReturn.waitFor(function (_a) {
                                    var callRef = _a.callRef;
                                    return callRef === ref;
                                })];
                        case 1:
                            _a.sent();
                            return [2 /*return*/];
                    }
                });
            }); } }, (function () {
            //const ctxByListener = new WeakMap<(ev: any) => any, Object>();
            var addEventListener = function (type, listener) {
                var ctx = evt_1.Evt.getCtx(listener);
                switch (type) {
                    case "iceconnectionstatechange":
                        evtIceconnectionstatechange.attach(function (_a) {
                            var ref = _a.rtcPeerConnectionRef;
                            return ref === rtcPeerConnectionRef;
                        }, ctx, function () { return listener.call(rtcPeerConnectionProxy, undefined); });
                        return;
                        ;
                    case "icecandidate":
                        evtIcecandidate.attach(function (_a) {
                            var ref = _a.rtcPeerConnectionRef;
                            return ref === rtcPeerConnectionRef;
                        }, ctx, function (_a) {
                            var rtcIceCandidateInitOrNullJson = _a.rtcIceCandidateInitOrNullJson;
                            return listener.call(rtcPeerConnectionProxy, {
                                "candidate": (function () {
                                    var rtcIceCandidateInitOrNull = JSON.parse(rtcIceCandidateInitOrNullJson);
                                    return rtcIceCandidateInitOrNull !== null ? new RTCIceCandidate(rtcIceCandidateInitOrNull) : null;
                                })()
                            });
                        });
                        return;
                    case "track":
                        //NOTE: Swallow the event, JsSip does not listen to this event, track attached by remote.
                        return;
                }
                throw Error("no handler for event " + type);
            };
            var removeEventListener = function (type, listener) {
                var evt = (function () {
                    switch (type) {
                        case "iceconnectionstatechange": return evtIceconnectionstatechange;
                        case "icecandidate": return evtIcecandidate;
                        default: return undefined;
                    }
                })();
                if (evt === undefined) {
                    return;
                }
                evt_1.Evt.getCtx(listener).done();
            };
            return { addEventListener: addEventListener, removeEventListener: removeEventListener };
        })()), { "addStream": function (mediaStream) { return methods.addStreamToRTCPeerConnection(rtcPeerConnectionRef, refByMediaStream.get(mediaStream)); }, "close": function () { return methods.closeRTCPeerConnection(rtcPeerConnectionRef); } });
        var _loop_1 = function (propertyName) {
            Object.defineProperty(rtcPeerConnectionProxy, propertyName, {
                "get": function () { return properties[propertyName]; },
                "enumerable": true,
                "configurable": true
            });
        };
        try {
            for (var _b = __values(Object.keys(properties)), _c = _b.next(); !_c.done; _c = _b.next()) {
                var propertyName = _c.value;
                _loop_1(propertyName);
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_1) throw e_1.error; }
        }
        return Object.setPrototypeOf(rtcPeerConnectionProxy, { "constructor": RTCPeerConnection });
    };
    //NOTE: For react-native
    if (!navigator.mediaDevices) {
        navigator.mediaDevices = {};
    }
    navigator.mediaDevices.getUserMedia = getUserMediaProxy;
    window["RTCPeerConnection"] = RTCPeerConnectionProxy;
    return {
        "onIcecandidate": function (rtcPeerConnectionRef, rtcIceCandidateInitOrNullJson, localDescriptionRTCSessionDescriptionInitOrNullJson) { return evtIcecandidate.post({
            rtcPeerConnectionRef: rtcPeerConnectionRef,
            rtcIceCandidateInitOrNullJson: rtcIceCandidateInitOrNullJson,
            localDescriptionRTCSessionDescriptionInitOrNullJson: localDescriptionRTCSessionDescriptionInitOrNullJson
        }); },
        "onIceconnectionstatechange": function (rtcPeerConnectionRef, iceConnectionState) { return evtIceconnectionstatechange.post({
            rtcPeerConnectionRef: rtcPeerConnectionRef,
            iceConnectionState: iceConnectionState
        }); },
        "onSignalingstatechange": function (rtcPeerConnectionRef, rtcSignalingState) { return evtSignalingstatechange.post({
            rtcPeerConnectionRef: rtcPeerConnectionRef,
            rtcSignalingState: rtcSignalingState
        }); },
        "onMethodReturn": function (callRef, out) { return evtMethodReturn.post({ callRef: callRef, out: out }); }
    };
}
exports.overrideWebRTCImplementation = overrideWebRTCImplementation;
function testOverrideWebRTCImplementation() {
    var RTCPeerConnectionBackup = RTCPeerConnection;
    var getUserMediaBackup = navigator.mediaDevices.getUserMedia;
    var mediaStreamByRef = new Map();
    var rtcPeerConnectionByRef = new Map();
    var listeners = overrideWebRTCImplementation(__assign(__assign({ "getUserMedia": function (mediaStreamRef, mediaStreamConstraintsJson, callRef) {
            return getUserMediaBackup(JSON.parse(mediaStreamConstraintsJson)).then(function (mediaStream) {
                mediaStreamByRef.set(mediaStreamRef, mediaStream);
                listeners.onMethodReturn(callRef, undefined);
            });
        }, "createRTCPeerConnection": function (rtcPeerConnectionRef, rtcConfigurationJson) {
            var rtcPeerConnection = new RTCPeerConnectionBackup((function () {
                var rtcConfiguration = JSON.parse(rtcConfigurationJson);
                return rtcConfiguration;
            })());
            rtcPeerConnection.addEventListener("iceconnectionstatechange", function () { return listeners.onIceconnectionstatechange(rtcPeerConnectionRef, rtcPeerConnection.iceConnectionState); });
            rtcPeerConnection.addEventListener("icecandidate", function (rtcPeerConnectionEvent) { return listeners.onIcecandidate(rtcPeerConnectionRef, JSON.stringify(rtcPeerConnectionEvent.candidate), JSON.stringify(rtcPeerConnection.localDescription)); });
            rtcPeerConnection.addEventListener("signalingstatechange", function () { return listeners.onSignalingstatechange(rtcPeerConnectionRef, rtcPeerConnection.signalingState); });
            rtcPeerConnection.addEventListener("track", function (_a) {
                var _b = __read(_a.streams, 1), stream = _b[0];
                var audio = document.createElement("audio");
                audio.autoplay = true;
                audio.srcObject = stream;
            });
            rtcPeerConnectionByRef.set(rtcPeerConnectionRef, rtcPeerConnection);
        }, "addStreamToRTCPeerConnection": function (rtcPeerConnectionRef, mediaStreamRef) {
            return rtcPeerConnectionByRef.get(rtcPeerConnectionRef)["addStream"](mediaStreamByRef.get(mediaStreamRef));
        }, "stopMediaStreamTrack": function (mediaStreamRef) {
            var _a = __read(mediaStreamByRef.get(mediaStreamRef).getTracks(), 1), mediaStreamTrack = _a[0];
            if (mediaStreamTrack === undefined) {
                return;
            }
            mediaStreamTrack.stop();
        } }, (function () {
        var createXForRTCPeerConnection = function (xIs, rtcPeerConnectionRef, callRef) { return rtcPeerConnectionByRef.get(rtcPeerConnectionRef)[xIs === "ANSWER" ? "createAnswer" : "createOffer"]()
            .then(function (rtcSessionDescriptionInit) { return listeners.onMethodReturn(callRef, JSON.stringify(rtcSessionDescriptionInit)); }); };
        var createAnswerForRTCPeerConnection = function (rtcPeerConnectionRef, callRef) { return createXForRTCPeerConnection("ANSWER", rtcPeerConnectionRef, callRef); };
        var createOfferForRTCPeerConnection = function (rtcPeerConnectionRef, callRef) { return createXForRTCPeerConnection("OFFER", rtcPeerConnectionRef, callRef); };
        return { createAnswerForRTCPeerConnection: createAnswerForRTCPeerConnection, createOfferForRTCPeerConnection: createOfferForRTCPeerConnection };
    })()), { "setLocalDescriptionOfRTCPeerConnection": function (rtcPeerConnectionRef, rtcSessionDescriptionInitJson, callRef) {
            return rtcPeerConnectionByRef.get(rtcPeerConnectionRef)
                .setLocalDescription(JSON.parse(rtcSessionDescriptionInitJson))
                .then(function () { return listeners.onMethodReturn(callRef, undefined); });
        }, "setRemoteDescriptionOfRTCPeerConnection": function (rtcPeerConnectionRef, rtcSessionDescriptionInitJson, callRef) {
            return rtcPeerConnectionByRef.get(rtcPeerConnectionRef)
                .setRemoteDescription(JSON.parse(rtcSessionDescriptionInitJson))
                .then(function () { return listeners.onMethodReturn(callRef, undefined); });
        }, "closeRTCPeerConnection": function (rtcPeerConnectionRef) {
            return rtcPeerConnectionByRef.get(rtcPeerConnectionRef)
                .close();
        } }));
}
exports.testOverrideWebRTCImplementation = testOverrideWebRTCImplementation;

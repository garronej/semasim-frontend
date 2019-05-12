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
function useAlternativeWebRTCImplementation(api) {
    console.log("Using alternative WebRTC implementation");
    var getCounter = (function () {
        var counter = 0;
        return function () { return counter++; };
    })();
    var evtIcecandidate = new ts_events_extended_1.SyncEvent();
    var evtIceconnectionstatechange = new ts_events_extended_1.SyncEvent();
    var evtSignalingstatechange = new ts_events_extended_1.SyncEvent();
    var evtMethodReturn = new ts_events_extended_1.SyncEvent();
    api.setListeners({
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
    });
    var refByMediaStream = new WeakMap();
    var getUserMediaProxy = function getUserMedia(mediaStreamConstraints) {
        return __awaiter(this, void 0, void 0, function () {
            var mediaStreamRef, ref_1, mediaStreamProxy;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        mediaStreamRef = getCounter();
                        ref_1 = getCounter();
                        api.methods.getUserMedia(mediaStreamRef, JSON.stringify(mediaStreamConstraints), ref_1);
                        return [4 /*yield*/, evtMethodReturn.waitFor(function (_a) {
                                var callRef = _a.callRef;
                                return callRef === ref_1;
                            })];
                    case 1:
                        _a.sent();
                        mediaStreamProxy = (function () {
                            var getTracks = function () {
                                var mediaStreamTrackProxy = (function () {
                                    var stop = function () {
                                        return api.methods.stopMediaStreamTrack(mediaStreamRef);
                                    };
                                    return { stop: stop };
                                })();
                                return [mediaStreamTrackProxy];
                            };
                            var wrap = { getTracks: getTracks };
                            return Object.setPrototypeOf(wrap, { "constructor": function MediaStream() { } });
                        })();
                        refByMediaStream.set(mediaStreamProxy, mediaStreamRef);
                        return [2 /*return*/, mediaStreamProxy];
                }
            });
        });
    };
    var RTCPeerConnectionProxy = function RTCPeerConnection(rtcConfiguration) {
        var _this = this;
        var e_1, _a;
        var rtcPeerConnectionRef = getCounter();
        api.methods.createRTCPeerConnection(rtcPeerConnectionRef, JSON.stringify(rtcConfiguration));
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
        var rtcPeerConnectionProxy = __assign({ "createOffer": function (_options) { return __awaiter(_this, void 0, void 0, function () {
                var ref, rtcSessionDescriptionInitJson;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            ref = getCounter();
                            api.methods.createOfferForRTCPeerConnection(rtcPeerConnectionRef, ref);
                            return [4 /*yield*/, evtMethodReturn.waitFor(function (_a) {
                                    var callRef = _a.callRef;
                                    return callRef === ref;
                                })];
                        case 1:
                            rtcSessionDescriptionInitJson = (_a.sent()).out;
                            //NOTE: Just to help debug, RTCSessionDescriptionInit is not a class, just a type.
                            /*
                            return Object.setPrototypeOf(
                                JSON.parse(rtcSessionDescriptionInitJson!),
                                { "constructor": function RTCSessionDescriptionInit() { } }
                            );
                            */
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
                            api.methods.setLocalDescriptionOfRTCPeerConnection(rtcPeerConnectionRef, JSON.stringify(rtcSessionDescriptionInit), ref);
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
                            api.methods.setRemoteDescriptionOfRTCPeerConnection(rtcPeerConnectionRef, JSON.stringify(rtcSessionDescriptionInit), ref);
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
            var boundToByListener = new WeakMap();
            var addEventListener = function (type, listener) {
                var boundTo = {};
                boundToByListener.set(listener, boundTo);
                switch (type) {
                    case "iceconnectionstatechange":
                        evtIceconnectionstatechange.attach(function (_a) {
                            var ref = _a.rtcPeerConnectionRef;
                            return ref === rtcPeerConnectionRef;
                        }, boundTo, function () { return listener.call(rtcPeerConnectionProxy, undefined); });
                        return;
                        ;
                    case "icecandidate":
                        evtIcecandidate.attach(function (_a) {
                            var ref = _a.rtcPeerConnectionRef;
                            return ref === rtcPeerConnectionRef;
                        }, boundTo, function (_a) {
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
                evt
                    .getHandlers()
                    .find(function (_a) {
                    var boundTo = _a.boundTo;
                    return boundTo === boundToByListener.get(listener);
                })
                    .detach();
            };
            return { addEventListener: addEventListener, removeEventListener: removeEventListener };
        })(), { "addStream": function (mediaStream) { return api.methods.addStreamToRTCPeerConnection(rtcPeerConnectionRef, refByMediaStream.get(mediaStream)); }, "close": function () { return api.methods.closeRTCPeerConnection(rtcPeerConnectionRef); } });
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
    navigator.mediaDevices.getUserMedia = getUserMediaProxy;
    window["RTCPeerConnection"] = RTCPeerConnectionProxy;
}
exports.useAlternativeWebRTCImplementation = useAlternativeWebRTCImplementation;
exports.localApi = (function () {
    var RTCPeerConnectionBackup = RTCPeerConnection;
    var getUserMediaBackup = navigator.mediaDevices.getUserMedia;
    var mediaStreamByRef = new Map();
    var rtcPeerConnectionByRef = new Map();
    var listeners;
    var methods = {
        "getUserMedia": function (mediaStreamRef, mediaStreamConstraintsJson, callRef) {
            return getUserMediaBackup(JSON.parse(mediaStreamConstraintsJson)).then(function (mediaStream) {
                mediaStreamByRef.set(mediaStreamRef, mediaStream);
                listeners.onMethodReturn(callRef, null);
            });
        },
        "createRTCPeerConnection": function (rtcPeerConnectionRef, rtcConfigurationJson) {
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
        },
        "addStreamToRTCPeerConnection": function (rtcPeerConnectionRef, mediaStreamRef) {
            return rtcPeerConnectionByRef.get(rtcPeerConnectionRef)["addStream"](mediaStreamByRef.get(mediaStreamRef));
        },
        "stopMediaStreamTrack": function (mediaStreamRef) {
            var _a = __read(mediaStreamByRef.get(mediaStreamRef).getTracks(), 1), mediaStreamTrack = _a[0];
            if (mediaStreamTrack === undefined) {
                return;
            }
            mediaStreamTrack.stop();
        },
        "createOfferForRTCPeerConnection": function (rtcPeerConnectionRef, callRef) {
            return rtcPeerConnectionByRef.get(rtcPeerConnectionRef)
                .createOffer()
                .then(function (rtcSessionDescriptionInit) { return listeners.onMethodReturn(callRef, JSON.stringify(rtcSessionDescriptionInit)); });
        },
        "setLocalDescriptionOfRTCPeerConnection": function (rtcPeerConnectionRef, rtcSessionDescriptionInitJson, callRef) {
            return rtcPeerConnectionByRef.get(rtcPeerConnectionRef)
                .setLocalDescription(JSON.parse(rtcSessionDescriptionInitJson))
                .then(function () { return listeners.onMethodReturn(callRef, null); });
        },
        "setRemoteDescriptionOfRTCPeerConnection": function (rtcPeerConnectionRef, rtcSessionDescriptionInitJson, callRef) {
            return rtcPeerConnectionByRef.get(rtcPeerConnectionRef)
                .setRemoteDescription(JSON.parse(rtcSessionDescriptionInitJson))
                .then(function () { return listeners.onMethodReturn(callRef, null); });
        },
        "closeRTCPeerConnection": function (rtcPeerConnectionRef) {
            return rtcPeerConnectionByRef.get(rtcPeerConnectionRef)
                .close();
        }
    };
    return { methods: methods, "setListeners": function (listeners_) { return listeners = listeners_; } };
})();

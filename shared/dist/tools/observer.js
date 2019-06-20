"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var omniobserver_1 = require("omniobserver");
/** will observe getUserMedia and RTCPeerConnection */
function observeWebRTC() {
    omniobserver_1.observeObjectProperty(navigator.mediaDevices, "getUserMedia");
    omniobserver_1.observeObjectProperty(window, "RTCPeerConnection", function (rtcPeerConnection) {
        console.log(rtcPeerConnection);
        if (!!rtcPeerConnection.getStats) {
            setTimeout(function () {
                rtcPeerConnection.getStats().then(function (stats) {
                    var arr = [];
                    stats.forEach(function (o) {
                        console.log(JSON.stringify(o));
                        arr.push(o);
                    });
                    console.log("<======>");
                    console.log(JSON.stringify(arr));
                });
            }, 20000);
        }
        var addEventListenerBackup = rtcPeerConnection.addEventListener, removeEventListenerBackup = rtcPeerConnection.removeEventListener;
        var proxyByOriginal = new WeakMap();
        Object.defineProperties(rtcPeerConnection, {
            "addEventListener": {
                "configurable": true,
                "enumerable": true,
                "value": function addEventListener(type, listener) {
                    var listenerProxy = function () {
                        var args = [];
                        for (var _i = 0; _i < arguments.length; _i++) {
                            args[_i] = arguments[_i];
                        }
                        console.log("RTCPeerConnectionEvent: \"" + type + "\"", args);
                        return listener.apply(rtcPeerConnection, args);
                    };
                    proxyByOriginal.set(listener, listenerProxy);
                    return addEventListenerBackup.call(rtcPeerConnection, type, listenerProxy);
                }
            },
            "removeEventListener": {
                "configurable": true,
                "enumerable": true,
                "value": function removeEventListener(type, listener) {
                    return removeEventListenerBackup.call(rtcPeerConnection, type, proxyByOriginal.get(listener));
                }
            }
        });
    });
}
exports.observeWebRTC = observeWebRTC;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.apiExposedToHost = {};
function setMicrophoneMute(isMicrophoneMute) {
    apiExposedByHost.setMicrophoneMute(isMicrophoneMute);
}
exports.setMicrophoneMute = setMicrophoneMute;

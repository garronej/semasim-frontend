"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.apiExposedToHost = void 0;
var overrideWebRTCImplementation_1 = require("../../tools/overrideWebRTCImplementation");
exports.apiExposedToHost = overrideWebRTCImplementation_1.overrideWebRTCImplementation(apiExposedByHost);

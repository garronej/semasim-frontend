"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateUaInstanceId = void 0;
var uuidv5 = require("uuid/v5");
var namespace = "1514baa7-6d21-4eeb-86f5-f7ccd6a85afd";
exports.generateUaInstanceId = function (seed) { return "\"<urn:uuid:" + uuidv5(seed, namespace) + ">\""; };

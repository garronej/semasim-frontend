"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
//const { firebase }: typeof import("../../../../react-native-app/node_modules/@react-native-firebase/messaging/lib/index") = require("@react-native-firebase/messaging");
var firebase = require("@react-native-firebase/messaging").firebase;
var default_ = function () { return firebase.messaging().getToken(); };
exports.default = default_;

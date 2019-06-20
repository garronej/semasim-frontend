"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Cookies = require("js-cookie");
var types = require("../types");
var AuthenticatedSessionDescriptorSharedData;
(function (AuthenticatedSessionDescriptorSharedData) {
    function get() {
        return JSON.parse(Buffer.from(Cookies.get(types.cookieKeys.SessionData), "hex").toString("utf8"));
    }
    AuthenticatedSessionDescriptorSharedData.get = get;
})(AuthenticatedSessionDescriptorSharedData = exports.AuthenticatedSessionDescriptorSharedData || (exports.AuthenticatedSessionDescriptorSharedData = {}));
var WebsocketConnectionParams;
(function (WebsocketConnectionParams) {
    /**
     * return a function that remove the cookie entry that should be called as
     * soon as the websocket connection have been established.
     */
    function set(websocketConnectionParams) {
        var key = types.cookieKeys.WebsocketConnectionParams;
        Cookies.set(key, Buffer.from(JSON.stringify(websocketConnectionParams), "utf8").toString("hex"));
        return function () { return Cookies.remove(key); };
    }
    WebsocketConnectionParams.set = set;
})(WebsocketConnectionParams = exports.WebsocketConnectionParams || (exports.WebsocketConnectionParams = {}));

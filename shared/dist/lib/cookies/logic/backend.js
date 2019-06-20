"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var types = require("../types");
var AuthenticatedSessionDescriptorSharedData;
(function (AuthenticatedSessionDescriptorSharedData) {
    function set(authenticatedSessionDescriptorSharedData, setter) {
        setter(types.cookieKeys.SessionData, Buffer.from(JSON.stringify(authenticatedSessionDescriptorSharedData), "utf8").toString("hex"));
    }
    AuthenticatedSessionDescriptorSharedData.set = set;
})(AuthenticatedSessionDescriptorSharedData = exports.AuthenticatedSessionDescriptorSharedData || (exports.AuthenticatedSessionDescriptorSharedData = {}));
var WebsocketConnectionParams;
(function (WebsocketConnectionParams) {
    /** Read from cookie */
    function get(parsedCookies) {
        var out;
        try {
            out = JSON.parse(Buffer.from(parsedCookies[types.cookieKeys.WebsocketConnectionParams], "hex").toString("utf8"));
        }
        catch (_a) {
            return undefined;
        }
        if (!(out instanceof Object &&
            typeof out.requestTurnCred === "boolean" &&
            typeof out.connectionType === "string" &&
            (out.connectionType === "MAIN" ||
                out.connectionType === "AUXILIARY" &&
                    typeof out.uaInstanceId === "string" &&
                    /"<urn:uuid:[0-9a-f\-]{30,50}>"$/.test(out.uaInstanceId)))) {
            return undefined;
        }
        return out;
    }
    WebsocketConnectionParams.get = get;
})(WebsocketConnectionParams = exports.WebsocketConnectionParams || (exports.WebsocketConnectionParams = {}));

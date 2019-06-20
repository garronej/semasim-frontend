"use strict";
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
var types = require("./types");
var cryptoLib = require("crypto-lib");
var JustRegistered;
(function (JustRegistered) {
    function store(justRegistered) {
        localStorage.setItem(types.cookieKeys.JustRegistered, JSON.stringify(justRegistered, function (key, value) { return key === "towardUserKeys" ?
            TowardUserKeys.stringify(value) :
            value; }));
    }
    JustRegistered.store = store;
    function retreave() {
        var key = types.cookieKeys.JustRegistered;
        var justRegisteredStr = localStorage.getItem(key);
        if (justRegisteredStr === null) {
            return undefined;
        }
        localStorage.removeItem(key);
        return JSON.parse(justRegisteredStr, function (key, value) { return key === "towardUserKeys" ?
            TowardUserKeys.parse(value) :
            value; });
    }
    JustRegistered.retreave = retreave;
})(JustRegistered = exports.JustRegistered || (exports.JustRegistered = {}));
var TowardUserKeys;
(function (TowardUserKeys) {
    function stringify(towardUserKeys) {
        return JSON.stringify([towardUserKeys.encryptKey, towardUserKeys.decryptKey]
            .map(function (key) { return cryptoLib.RsaKey.stringify(key); }));
    }
    TowardUserKeys.stringify = stringify;
    function parse(towardUserKeysStr) {
        var _a = __read(JSON.parse(towardUserKeysStr)
            .map(function (keyStr) { return cryptoLib.RsaKey.parse(keyStr); }), 2), encryptKey = _a[0], decryptKey = _a[1];
        return { encryptKey: encryptKey, decryptKey: decryptKey };
    }
    TowardUserKeys.parse = parse;
    //TODO: Set expiration for the cookie based on the session id expiration.
    function store(towardUserKeys) {
        localStorage.setItem(types.cookieKeys.TowardUserKeys, stringify(towardUserKeys));
    }
    TowardUserKeys.store = store;
    function retrieve() {
        var towardUserKeysStr = localStorage.getItem(types.cookieKeys.TowardUserKeys);
        if (towardUserKeysStr === null) {
            return undefined;
        }
        return parse(towardUserKeysStr);
    }
    TowardUserKeys.retrieve = retrieve;
})(TowardUserKeys = exports.TowardUserKeys || (exports.TowardUserKeys = {}));

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var cryptoLib = require("crypto-lib");
/** Return [publicKeyStr, privateKeyStr] */
exports.rsaGenerateKeys = function (seedB64, keysLengthBytes) {
    var _a = cryptoLib.rsa.syncGenerateKeys(Buffer.from(seedB64, "base64"), keysLengthBytes), publicKey = _a.publicKey, privateKey = _a.privateKey;
    return [publicKey, privateKey]
        .map(function (rsaKey) { return cryptoLib.RsaKey.stringify(rsaKey); });
};

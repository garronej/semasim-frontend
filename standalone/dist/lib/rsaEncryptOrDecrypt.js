"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var cryptoLib = require("crypto-lib");
var encryptorMap = new Map();
function getRsaEncryptorStatic(encryptKeyStr) {
    var encryptor = encryptorMap.get(encryptKeyStr);
    if (encryptor === undefined) {
        encryptor = cryptoLib.rsa.syncEncryptorFactory(cryptoLib.RsaKey.parse(encryptKeyStr));
        encryptorMap.set(encryptKeyStr, encryptor);
    }
    return encryptor;
}
var decryptorMap = new Map();
function getRsaDecryptorStatic(decryptKeyStr) {
    var decryptor = decryptorMap.get(decryptKeyStr);
    if (decryptor === undefined) {
        decryptor = cryptoLib.rsa.syncDecryptorFactory(cryptoLib.RsaKey.parse(decryptKeyStr));
        decryptorMap.set(decryptKeyStr, decryptor);
    }
    return decryptor;
}
/** Return  outputDataB64 */
exports.rsaEncryptOrDecrypt = function (action, keyStr, inputDataB64) { return cryptoLib.toBuffer((function (inputData) {
    switch (action) {
        case "ENCRYPT": return getRsaEncryptorStatic(keyStr).encrypt(inputData);
        case "DECRYPT": return getRsaDecryptorStatic(keyStr).decrypt(inputData);
    }
})(Buffer.from(inputDataB64, "base64"))).toString("base64"); };

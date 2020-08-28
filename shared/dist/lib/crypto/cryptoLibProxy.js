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
var __spread = (this && this.__spread) || function () {
    for (var ar = [], i = 0; i < arguments.length; i++) ar = ar.concat(__read(arguments[i]));
    return ar;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.rsa = exports.aes = void 0;
var cryptoLib = require("crypto-lib");
var hostCrypto = require("../nativeModules/hostCryptoLib");
var env_1 = require("../env");
var crypto_lib_1 = require("crypto-lib");
Object.defineProperty(exports, "WorkerThreadId", { enumerable: true, get: function () { return crypto_lib_1.WorkerThreadId; } });
Object.defineProperty(exports, "RsaKey", { enumerable: true, get: function () { return crypto_lib_1.RsaKey; } });
Object.defineProperty(exports, "scrypt", { enumerable: true, get: function () { return crypto_lib_1.scrypt; } });
Object.defineProperty(exports, "toBuffer", { enumerable: true, get: function () { return crypto_lib_1.toBuffer; } });
Object.defineProperty(exports, "workerThreadPool", { enumerable: true, get: function () { return crypto_lib_1.workerThreadPool; } });
Object.defineProperty(exports, "stringifyThenEncryptFactory", { enumerable: true, get: function () { return crypto_lib_1.stringifyThenEncryptFactory; } });
Object.defineProperty(exports, "decryptThenParseFactory", { enumerable: true, get: function () { return crypto_lib_1.decryptThenParseFactory; } });
if (env_1.env.jsRuntimeEnv === "react-native") {
    cryptoLib.disableMultithreading();
}
var aes;
(function (aes) {
    aes.generateKey = cryptoLib.aes.generateKey;
    aes.encryptorDecryptorFactory = env_1.env.jsRuntimeEnv === "browser" ?
        function () {
            var _a;
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            return (_a = cryptoLib.aes).encryptorDecryptorFactory.apply(_a, __spread(args));
        }
        :
            function (key) { return ({
                "encrypt": function (plainData) { return hostCrypto.aesEncryptOrDecrypt("ENCRYPT", cryptoLib.toBuffer(key).toString("base64"), cryptoLib.toBuffer(plainData).toString("base64")).then(function (_a) {
                    var outputDataB64 = _a.outputDataB64;
                    return Buffer.from(outputDataB64, "base64");
                }); },
                "decrypt": function (encryptedData) { return hostCrypto.aesEncryptOrDecrypt("DECRYPT", cryptoLib.toBuffer(key).toString("base64"), cryptoLib.toBuffer(encryptedData).toString("base64")).then(function (_a) {
                    var outputDataB64 = _a.outputDataB64;
                    return Buffer.from(outputDataB64, "base64");
                }); }
            }); };
    cryptoLib.aes.encryptorDecryptorFactory;
})(aes = exports.aes || (exports.aes = {}));
var rsa;
(function (rsa) {
    rsa.generateKeys = env_1.env.jsRuntimeEnv === "browser" ?
        function () {
            var _a;
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            return (_a = cryptoLib.rsa).generateKeys.apply(_a, __spread(args));
        }
        :
            function (seed, keysLengthBytes) { return hostCrypto.rsaGenerateKeys(cryptoLib.toBuffer(seed).toString("base64"), keysLengthBytes).then(function (keys) { return ({
                "publicKey": cryptoLib.RsaKey.parse(keys.publicKeyStr),
                "privateKey": cryptoLib.RsaKey.parse(keys.privateKeyStr)
            }); }); };
    rsa.encryptorFactory = env_1.env.jsRuntimeEnv === "browser" ?
        function () {
            var _a;
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            return (_a = cryptoLib.rsa).encryptorFactory.apply(_a, __spread(args));
        }
        :
            function (encryptKey) { return ({
                "encrypt": function (plainData) { return hostCrypto.rsaEncryptOrDecrypt("ENCRYPT", cryptoLib.RsaKey.stringify(encryptKey), cryptoLib.toBuffer(plainData).toString("base64")).then(function (_a) {
                    var outputDataB64 = _a.outputDataB64;
                    return Buffer.from(outputDataB64, "base64");
                }); }
            }); };
    rsa.decryptorFactory = env_1.env.jsRuntimeEnv === "browser" ?
        function () {
            var _a;
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            return (_a = cryptoLib.rsa).decryptorFactory.apply(_a, __spread(args));
        }
        :
            function (decryptKey) { return ({
                "decrypt": function (encryptedData) { return hostCrypto.rsaEncryptOrDecrypt("DECRYPT", cryptoLib.RsaKey.stringify(decryptKey), cryptoLib.toBuffer(encryptedData).toString("base64")).then(function (_a) {
                    var outputDataB64 = _a.outputDataB64;
                    return Buffer.from(outputDataB64, "base64");
                }); }
            }); };
})(rsa = exports.rsa || (exports.rsa = {}));

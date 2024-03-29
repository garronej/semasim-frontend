"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.rsaGenerateKeys = exports.rsaEncryptOrDecrypt = exports.aesEncryptOrDecrypt = exports.apiExposedToHost = void 0;
var evt_1 = require("evt");
var evtAesEncryptOrDecryptResult = new evt_1.Evt().setMaxHandlers(Infinity);
var evtRsaEncryptOrDecryptResult = new evt_1.Evt();
var evtRsaGenerateKeysResult = new evt_1.Evt();
exports.apiExposedToHost = {
    "onAesEncryptOrDecryptResult": function (callRef, outputDataB64) {
        return evtAesEncryptOrDecryptResult.post({ callRef: callRef, outputDataB64: outputDataB64 });
    },
    "onRsaEncryptOrDecryptResult": function (callRef, outputDataB64) {
        return evtRsaEncryptOrDecryptResult.post({ callRef: callRef, outputDataB64: outputDataB64 });
    },
    "onRsaGenerateKeysResult": function (callRef, publicKeyStr, privateKeyStr) {
        return evtRsaGenerateKeysResult.post({ callRef: callRef, publicKeyStr: publicKeyStr, privateKeyStr: privateKeyStr });
    }
};
var getCounter = (function () {
    var counter = 0;
    return function () { return counter++; };
})();
function aesEncryptOrDecrypt(action, keyB64, inputDataB64) {
    return __awaiter(this, void 0, void 0, function () {
        var callRef, outputDataB64;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    callRef = getCounter();
                    apiExposedByHost.aesEncryptOrDecrypt(action, keyB64, inputDataB64, callRef);
                    return [4 /*yield*/, evtAesEncryptOrDecryptResult.waitFor(function (_a) {
                            var callRef_ = _a.callRef;
                            return callRef_ === callRef;
                        })];
                case 1:
                    outputDataB64 = (_a.sent()).outputDataB64;
                    return [2 /*return*/, { outputDataB64: outputDataB64 }];
            }
        });
    });
}
exports.aesEncryptOrDecrypt = aesEncryptOrDecrypt;
function rsaEncryptOrDecrypt(action, keyStr, inputDataB64) {
    return __awaiter(this, void 0, void 0, function () {
        var callRef, outputDataB64;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    callRef = getCounter();
                    apiExposedByHost.rsaEncryptOrDecrypt(action, keyStr, inputDataB64, callRef);
                    return [4 /*yield*/, evtRsaEncryptOrDecryptResult.waitFor(function (_a) {
                            var callRef_ = _a.callRef;
                            return callRef_ === callRef;
                        })];
                case 1:
                    outputDataB64 = (_a.sent()).outputDataB64;
                    return [2 /*return*/, { outputDataB64: outputDataB64 }];
            }
        });
    });
}
exports.rsaEncryptOrDecrypt = rsaEncryptOrDecrypt;
function rsaGenerateKeys(seedB64, keysLengthBytes) {
    return __awaiter(this, void 0, void 0, function () {
        var callRef, _a, publicKeyStr, privateKeyStr;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    callRef = getCounter();
                    apiExposedByHost.rsaGenerateKeys(seedB64, keysLengthBytes, callRef);
                    return [4 /*yield*/, evtRsaGenerateKeysResult.waitFor(function (_a) {
                            var callRef_ = _a.callRef;
                            return callRef_ === callRef;
                        })];
                case 1:
                    _a = _b.sent(), publicKeyStr = _a.publicKeyStr, privateKeyStr = _a.privateKeyStr;
                    return [2 /*return*/, { publicKeyStr: publicKeyStr, privateKeyStr: privateKeyStr }];
            }
        });
    });
}
exports.rsaGenerateKeys = rsaGenerateKeys;

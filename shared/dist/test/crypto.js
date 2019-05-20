"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
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
var __values = (this && this.__values) || function (o) {
    var m = typeof Symbol === "function" && o[Symbol.iterator], i = 0;
    if (m) return m.call(o);
    return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
};
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var lib = require("../tools/crypto/library");
var aes = require("../tools/crypto/aes");
var ttTesting = require("transfer-tools/dist/lib/testing");
(function () { return __awaiter(_this, void 0, void 0, function () {
    var e_1, _a, e_2, _b, aesKey, encrypt, decrypt, text, i, plainEncryptorDecryptor, aesEncryptorDecryptor, _c, _d, encoding, _e, _f, encryptorDecryptor, stringifyThenEncrypt, decryptThenParse, i, text;
    return __generator(this, function (_g) {
        switch (_g.label) {
            case 0: return [4 /*yield*/, aes.generateTestKey()];
            case 1:
                aesKey = _g.sent();
                {
                    encrypt = undefined;
                    decrypt = undefined;
                    text = ttTesting.genUtf8Str(60);
                    for (i = 1; i < 5000; i++) {
                        if (i % 5 === 0) {
                            encrypt = undefined;
                        }
                        if (i % 7 === 0) {
                            decrypt = undefined;
                        }
                        if (encrypt === undefined) {
                            encrypt = aes.encryptorDecryptorFactory(aesKey).encrypt;
                        }
                        if (decrypt === undefined) {
                            decrypt = aes.encryptorDecryptorFactory(aesKey).decrypt;
                        }
                        if (lib.toBuffer(decrypt(encrypt(Buffer.from(text, "utf8")))).toString("utf8") !== text) {
                            throw new Error("failed with " + JSON.stringify(text));
                        }
                    }
                    console.log("PASS 0");
                }
                {
                    plainEncryptorDecryptor = {
                        "encrypt": function (data) { return data; },
                        "decrypt": function (data) { return data; }
                    };
                    aesEncryptorDecryptor = aes.encryptorDecryptorFactory(aesKey);
                    try {
                        for (_c = __values(["hex", "base64", "binary"]), _d = _c.next(); !_d.done; _d = _c.next()) {
                            encoding = _d.value;
                            lib.stringifyThenEncryptFactory.stringRepresentationEncoding = encoding;
                            try {
                                for (_e = __values([plainEncryptorDecryptor, aesEncryptorDecryptor]), _f = _e.next(); !_f.done; _f = _e.next()) {
                                    encryptorDecryptor = _f.value;
                                    stringifyThenEncrypt = lib.stringifyThenEncryptFactory(encryptorDecryptor);
                                    decryptThenParse = lib.decryptThenParseFactory(encryptorDecryptor);
                                    for (i = 1; i < 1000; i++) {
                                        text = ttTesting.genUtf8Str(60);
                                        if (decryptThenParse(stringifyThenEncrypt(text)) !== text) {
                                            throw new Error("failed with " + JSON.stringify(text));
                                        }
                                    }
                                }
                            }
                            catch (e_2_1) { e_2 = { error: e_2_1 }; }
                            finally {
                                try {
                                    if (_f && !_f.done && (_b = _e.return)) _b.call(_e);
                                }
                                finally { if (e_2) throw e_2.error; }
                            }
                            console.log("PASS " + encoding);
                        }
                    }
                    catch (e_1_1) { e_1 = { error: e_1_1 }; }
                    finally {
                        try {
                            if (_d && !_d.done && (_a = _c.return)) _a.call(_c);
                        }
                        finally { if (e_1) throw e_1.error; }
                    }
                    console.log("PASS 1");
                }
                console.log("DONE");
                return [2 /*return*/];
        }
    });
}); })();

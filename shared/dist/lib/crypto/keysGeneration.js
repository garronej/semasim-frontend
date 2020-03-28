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
//import * as cryptoLib from "crypto-lib";
var cryptoLib = require("./cryptoLibProxy");
var dialog_1 = require("../../tools/modal/dialog");
var binaryDataManipulations_1 = require("crypto-lib/dist/sync/utils/binaryDataManipulations");
var kfd_1 = require("./kfd");
var workerThreadPoolId = cryptoLib.workerThreadPool.Id.generate();
var workerThreadId;
/** Must be called before using the async function */
function preSpawnIfNotAlreadyDone() {
    if (preSpawnIfNotAlreadyDone.hasBeenCalled) {
        return;
    }
    preSpawnIfNotAlreadyDone.hasBeenCalled = true;
    cryptoLib.workerThreadPool.preSpawn(workerThreadPoolId, 1);
    workerThreadId = cryptoLib.workerThreadPool.listIds(workerThreadPoolId)[0];
}
exports.preSpawnIfNotAlreadyDone = preSpawnIfNotAlreadyDone;
preSpawnIfNotAlreadyDone.hasBeenCalled = false;
function computeLoginSecretAndTowardUserKeys(params) {
    return __awaiter(this, void 0, void 0, function () {
        var password, uniqUserIdentification, _a, digest1, digest2, towardUserKeys;
        var _this = this;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    password = params.password, uniqUserIdentification = params.uniqUserIdentification;
                    dialog_1.dialogApi.loading("Generating cryptographic digest from password \uD83D\uDD10", 0);
                    return [4 /*yield*/, (function () { return __awaiter(_this, void 0, void 0, function () {
                            var salt;
                            var _this = this;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, cryptoLib.scrypt.hash((function () {
                                            var realm = Buffer.from("semasim.com", "utf8");
                                            return cryptoLib.toBuffer(binaryDataManipulations_1.concatUint8Array(realm, binaryDataManipulations_1.addPadding("LEFT", Buffer.from(uniqUserIdentification
                                                .replace(/\s/g, "")
                                                .toLowerCase(), "utf8"), 100 - realm.length))).toString("utf8");
                                        })(), "", {
                                            "n": 3,
                                            "digestLengthBytes": 16
                                        }, undefined, workerThreadId)];
                                    case 1:
                                        salt = _a.sent();
                                        return [2 /*return*/, Promise.all([1, 2].map(function (i) { return __awaiter(_this, void 0, void 0, function () {
                                                var error_1;
                                                return __generator(this, function (_a) {
                                                    switch (_a.label) {
                                                        case 0:
                                                            _a.trys.push([0, 2, , 3]);
                                                            return [4 /*yield*/, kfd_1.kfd(Buffer.from("" + password + i, "utf8").toString("hex"), salt, 100000)];
                                                        case 1: 
                                                        //NOTE: We convert password to hex so we are sure to have a password
                                                        //charset in ASCII. ( Java Modified UTF8 might cause problems ).
                                                        return [2 /*return*/, _a.sent()];
                                                        case 2:
                                                            error_1 = _a.sent();
                                                            if (i === 1) {
                                                                alert("Please use a different web browser");
                                                            }
                                                            throw error_1;
                                                        case 3: return [2 /*return*/];
                                                    }
                                                });
                                            }); }))];
                                }
                            });
                        }); })()];
                case 1:
                    _a = __read.apply(void 0, [_b.sent(), 2]), digest1 = _a[0], digest2 = _a[1];
                    dialog_1.dialogApi.loading("Computing RSA keys using digest as seed \uD83D\uDD10");
                    return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 100); })];
                case 2:
                    _b.sent();
                    return [4 /*yield*/, (function (seed) { return __awaiter(_this, void 0, void 0, function () {
                            var _a, publicKey, privateKey;
                            return __generator(this, function (_b) {
                                switch (_b.label) {
                                    case 0: return [4 /*yield*/, cryptoLib.rsa.generateKeys(seed, 160, workerThreadId)];
                                    case 1:
                                        _a = _b.sent(), publicKey = _a.publicKey, privateKey = _a.privateKey;
                                        return [2 /*return*/, {
                                                "encryptKey": publicKey,
                                                "decryptKey": privateKey
                                            }];
                                }
                            });
                        }); })(digest2)];
                case 3:
                    towardUserKeys = _b.sent();
                    dialog_1.dialogApi.dismissLoading();
                    return [2 /*return*/, {
                            "secret": cryptoLib.toBuffer(digest1).toString("hex"),
                            towardUserKeys: towardUserKeys
                        }];
            }
        });
    });
}
exports.computeLoginSecretAndTowardUserKeys = computeLoginSecretAndTowardUserKeys;
var symmetricKey;
(function (symmetricKey) {
    function createThenEncryptKey(towardUserEncryptKey) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, _b, _c, _d;
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0:
                        _b = (_a = cryptoLib).toBuffer;
                        _d = (_c = cryptoLib.rsa.encryptorFactory(towardUserEncryptKey, workerThreadPoolId)).encrypt;
                        return [4 /*yield*/, cryptoLib.aes.generateKey()];
                    case 1: return [4 /*yield*/, _d.apply(_c, [_e.sent()])];
                    case 2: return [2 /*return*/, _b.apply(_a, [_e.sent()]).toString("base64")];
                }
            });
        });
    }
    symmetricKey.createThenEncryptKey = createThenEncryptKey;
    function decryptKey(towardUserDecryptor, encryptedSymmetricKey) {
        return towardUserDecryptor.decrypt(Buffer.from(encryptedSymmetricKey, "base64"));
    }
    symmetricKey.decryptKey = decryptKey;
})(symmetricKey = exports.symmetricKey || (exports.symmetricKey = {}));

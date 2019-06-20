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
Object.defineProperty(exports, "__esModule", { value: true });
var cryptoLib = require("crypto-lib");
var bootbox_custom = require("../tools/bootbox_custom");
var workerThreadPoolId = cryptoLib.workerThreadPool.Id.generate();
var workerThreadIds;
/** Must be called before using the async function */
function preSpawn() {
    cryptoLib.workerThreadPool.preSpawn(workerThreadPoolId, 4);
    workerThreadIds = cryptoLib.workerThreadPool.listIds(workerThreadPoolId);
}
exports.preSpawn = preSpawn;
function computeLoginSecretAndTowardUserKeys(password, salt) {
    return __awaiter(this, void 0, void 0, function () {
        var kdf, buildLoginSecret, computeTowardUserKeys, getMessage, progress, digests, towardUserKeys;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    kdf = computeLoginSecretAndTowardUserKeys.kdf, buildLoginSecret = computeLoginSecretAndTowardUserKeys.buildLoginSecret, computeTowardUserKeys = computeLoginSecretAndTowardUserKeys.computeTowardUserKeys;
                    getMessage = function (percent) { return "Generating cryptographic digest from password \uD83D\uDD10 " + percent.toFixed(0) + "%"; };
                    bootbox_custom.loading(getMessage(0));
                    progress = function (percent) {
                        return $("." + bootbox_custom.loading.spanClass)
                            .html(getMessage(percent));
                    };
                    return [4 /*yield*/, kdf(password, salt, function (percent) { return progress(percent); })];
                case 1:
                    digests = _a.sent();
                    bootbox_custom.loading("Computing RSA keys using digest as seed \uD83D\uDD10");
                    return [4 /*yield*/, computeTowardUserKeys(digests)];
                case 2:
                    towardUserKeys = _a.sent();
                    bootbox_custom.dismissLoading();
                    return [2 /*return*/, {
                            "secret": buildLoginSecret(digests),
                            towardUserKeys: towardUserKeys
                        }];
            }
        });
    });
}
exports.computeLoginSecretAndTowardUserKeys = computeLoginSecretAndTowardUserKeys;
(function (computeLoginSecretAndTowardUserKeys) {
    function kdf(password, salt, progress) {
        return __awaiter(this, void 0, void 0, function () {
            var percentages, digests, out;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        percentages = workerThreadIds.map(function () { return 0; });
                        return [4 /*yield*/, Promise.all(workerThreadIds
                                .map(function (_, i) { return "" + password + i; })
                                .map(function (text, i) { return cryptoLib.scrypt.hash(text, salt, {
                                "n": 11,
                                "r": 12,
                                "p": 1,
                                "digestLengthBytes": 64
                            }, function (percent) {
                                percentages[i] = percent;
                                progress(Math.floor(percentages.reduce(function (prev, curr) { return prev + curr; }, 0) / 4));
                            }, workerThreadIds[i]); }))];
                    case 1:
                        digests = _a.sent();
                        out = {};
                        digests.forEach(function (digest, i) { return out["digestP" + (i + 1)] = digest; });
                        return [2 /*return*/, out];
                }
            });
        });
    }
    computeLoginSecretAndTowardUserKeys.kdf = kdf;
    function buildLoginSecret(digests) {
        var digestP1 = digests.digestP1, digestP2 = digests.digestP2;
        return [digestP1, digestP2]
            .map(function (digest) { return cryptoLib.toBuffer(digest).toString("hex"); })
            .join("");
    }
    computeLoginSecretAndTowardUserKeys.buildLoginSecret = buildLoginSecret;
    function computeTowardUserKeys(digests) {
        return __awaiter(this, void 0, void 0, function () {
            var digestP3, digestP4, seed, _a, publicKey, privateKey;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        digestP3 = digests.digestP3, digestP4 = digests.digestP4;
                        seed = new Uint8Array(digestP3.length + digestP4.length);
                        seed.set(digestP3);
                        seed.set(digestP4, digestP3.length);
                        return [4 /*yield*/, cryptoLib.rsa.generateKeys(seed, 160, workerThreadIds[0])];
                    case 1:
                        _a = _b.sent(), publicKey = _a.publicKey, privateKey = _a.privateKey;
                        return [2 /*return*/, {
                                "encryptKey": publicKey,
                                "decryptKey": privateKey
                            }];
                }
            });
        });
    }
    computeLoginSecretAndTowardUserKeys.computeTowardUserKeys = computeTowardUserKeys;
    ;
})(computeLoginSecretAndTowardUserKeys = exports.computeLoginSecretAndTowardUserKeys || (exports.computeLoginSecretAndTowardUserKeys = {}));
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

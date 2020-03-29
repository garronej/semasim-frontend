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
var keyGeneration = require("../crypto/keysGeneration");
var cryptoLib = require("../crypto/cryptoLibProxy");
function factory(params) {
    var webApi = params.webApi, dialogApi = params.dialogApi, JustRegistered = params.JustRegistered;
    return function launchRegister(params) {
        return __awaiter(this, void 0, void 0, function () {
            var email, uiApi;
            var _this = this;
            return __generator(this, function (_a) {
                email = params.email, uiApi = params.uiApi;
                keyGeneration.preSpawnIfNotAlreadyDone();
                if (email !== undefined) {
                    uiApi.emailInput.setValue({
                        "value": email,
                        "readonly": true
                    });
                }
                return [2 /*return*/, {
                        "register": function () { return __awaiter(_this, void 0, void 0, function () {
                            var email, password, _a, secret, towardUserKeys, regStatus, _b, _c, _d, _e;
                            return __generator(this, function (_f) {
                                switch (_f.label) {
                                    case 0:
                                        email = uiApi.emailInput.getValue();
                                        password = uiApi.passwordInput.getValue();
                                        return [4 /*yield*/, keyGeneration.computeLoginSecretAndTowardUserKeys({
                                                password: password,
                                                "uniqUserIdentification": email
                                            })];
                                    case 1:
                                        _a = _f.sent(), secret = _a.secret, towardUserKeys = _a.towardUserKeys;
                                        dialogApi.loading("Creating account", 0);
                                        _c = (_b = webApi).registerUser;
                                        _d = {
                                            email: email,
                                            secret: secret,
                                            "towardUserEncryptKeyStr": cryptoLib.RsaKey.stringify(towardUserKeys.encryptKey)
                                        };
                                        _e = "encryptedSymmetricKey";
                                        return [4 /*yield*/, keyGeneration.symmetricKey.createThenEncryptKey(towardUserKeys.encryptKey)];
                                    case 2: return [4 /*yield*/, _c.apply(_b, [(_d[_e] = _f.sent(),
                                                _d["shouldThrowOnError"] = true,
                                                _d)]).catch(function () { return new Error(); })];
                                    case 3:
                                        regStatus = _f.sent();
                                        if (!(regStatus instanceof Error)) return [3 /*break*/, 5];
                                        return [4 /*yield*/, dialogApi.create("alert", { "message": "Something went wrong, please try again later" })];
                                    case 4:
                                        _f.sent();
                                        return [2 /*return*/];
                                    case 5:
                                        switch (regStatus) {
                                            case "EMAIL NOT AVAILABLE":
                                                dialogApi.dismissLoading();
                                                dialogApi.create("alert", { "message": "Semasim account for " + email + " has already been created" });
                                                uiApi.emailInput.setValue({
                                                    "value": "",
                                                    "readonly": false
                                                });
                                                break;
                                            case "CREATED":
                                            case "CREATED NO ACTIVATION REQUIRED":
                                                JustRegistered.store({
                                                    password: password,
                                                    secret: secret,
                                                    towardUserKeys: towardUserKeys,
                                                    "promptEmailValidationCode": regStatus !== "CREATED NO ACTIVATION REQUIRED"
                                                });
                                                uiApi.redirectToLogin({ email: email });
                                                break;
                                        }
                                        return [2 /*return*/];
                                }
                            });
                        }); }
                    }];
            });
        });
    };
}
exports.factory = factory;

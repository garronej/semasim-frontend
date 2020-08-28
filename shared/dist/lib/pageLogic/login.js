"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
exports.factory = void 0;
var cryptoLib = require("../crypto/cryptoLibProxy");
var keyGeneration = require("../crypto/keysGeneration");
var assert_1 = require("../../tools/typeSafety/assert");
var env_1 = require("../env");
var generateUaInstanceId_1 = require("../crypto/generateUaInstanceId");
function factory(params) {
    var webApi = params.webApi, dialogApi = params.dialogApi, JustRegistered = params.JustRegistered, TowardUserKeys = params.TowardUserKeys;
    var validateEmail = validateEmailFactory({ dialogApi: dialogApi, webApi: webApi }).validateEmail;
    var renewPassword = renewPasswordFactory({ dialogApi: dialogApi, webApi: webApi }).renewPassword;
    return function launchLogin(params) {
        return __awaiter(this, void 0, void 0, function () {
            var intent, uiApi, email, justRegistered, _a, email, code, isEmailValidated, isEmailValidated, renewPasswordResult, newPassword, newSecret, towardUserKeys;
            var _this = this;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        intent = params.intent, uiApi = params.uiApi;
                        keyGeneration.preSpawnIfNotAlreadyDone();
                        {
                            email = params.intent.email;
                            if (email !== undefined) {
                                uiApi.emailInput.setValue(email);
                            }
                        }
                        return [4 /*yield*/, JustRegistered.retrieve()];
                    case 1:
                        justRegistered = _b.sent();
                        _a = intent.action;
                        switch (_a) {
                            case "LOGIN": return [3 /*break*/, 2];
                            case "VALIDATE EMAIL": return [3 /*break*/, 6];
                            case "RENEW PASSWORD": return [3 /*break*/, 9];
                        }
                        return [3 /*break*/, 11];
                    case 2:
                        email = intent.email;
                        //NOTE: If justRegistered we assert we have an email
                        if (email === undefined) {
                            return [3 /*break*/, 11];
                        }
                        if (justRegistered === undefined) {
                            return [3 /*break*/, 11];
                        }
                        uiApi.passwordInput.setValue(justRegistered.password);
                        if (!justRegistered.promptEmailValidationCode) return [3 /*break*/, 5];
                        return [4 /*yield*/, (function callee() {
                                return __awaiter(this, void 0, void 0, function () {
                                    var out;
                                    return __generator(this, function (_a) {
                                        switch (_a.label) {
                                            case 0: return [4 /*yield*/, new Promise(function (resolve) { return dialogApi.create("prompt", {
                                                    "title": "Code you just received by email",
                                                    "inputType": "number",
                                                    "placeholder": "XXXX",
                                                    "callback": function (result) { return resolve(result); }
                                                }); })];
                                            case 1:
                                                out = _a.sent();
                                                if (!!out) return [3 /*break*/, 3];
                                                return [4 /*yield*/, new Promise(function (resolve) { return dialogApi.create("alert", {
                                                        "message": "Validating you email address is mandatory to access Semasim services",
                                                        "callback": function () { return resolve(); }
                                                    }); })];
                                            case 2:
                                                _a.sent();
                                                return [2 /*return*/, callee()];
                                            case 3: return [2 /*return*/, out];
                                        }
                                    });
                                });
                            })()];
                    case 3:
                        code = _b.sent();
                        return [4 /*yield*/, validateEmail({ email: email, code: code })];
                    case 4:
                        isEmailValidated = (_b.sent()).isEmailValidated;
                        if (!isEmailValidated) {
                            return [3 /*break*/, 11];
                        }
                        _b.label = 5;
                    case 5:
                        setTimeout(function () { return uiApi.triggerClickButtonLogin(); }, 0);
                        return [3 /*break*/, 11];
                    case 6: return [4 /*yield*/, validateEmail({
                            "email": intent.email,
                            "code": intent.code
                        })];
                    case 7:
                        isEmailValidated = (_b.sent()).isEmailValidated;
                        if (!isEmailValidated) {
                            return [3 /*break*/, 11];
                        }
                        return [4 /*yield*/, new Promise(function (resolve) { return dialogApi.create("alert", {
                                "message": "Email successfully validated you can now proceed to login",
                                "callback": function () { return resolve(); }
                            }); })];
                    case 8:
                        _b.sent();
                        return [3 /*break*/, 11];
                    case 9: return [4 /*yield*/, renewPassword({
                            "email": intent.email,
                            "token": intent.token
                        })];
                    case 10:
                        renewPasswordResult = _b.sent();
                        if (!renewPasswordResult.isSuccess) {
                            return [3 /*break*/, 11];
                        }
                        newPassword = renewPasswordResult.newPassword, newSecret = renewPasswordResult.newSecret, towardUserKeys = renewPasswordResult.towardUserKeys;
                        justRegistered = {
                            "password": newPassword,
                            "secret": newSecret,
                            towardUserKeys: towardUserKeys,
                            "promptEmailValidationCode": false
                        };
                        uiApi.passwordInput.setValue(newPassword);
                        setTimeout(function () { return uiApi.triggerClickButtonLogin(); }, 0);
                        return [3 /*break*/, 11];
                    case 11: return [2 /*return*/, {
                            /**
                             * Assert email and password fields have been validated,
                             * Resolves when no more action ongoing.
                             * */
                            "login": function (params) { return __awaiter(_this, void 0, void 0, function () {
                                var email, _a, secret, towardUserKeys, _b, resp, _c;
                                return __generator(this, function (_d) {
                                    switch (_d.label) {
                                        case 0:
                                            assert_1.assert(params.assertJsRuntimeEnv === env_1.env.jsRuntimeEnv);
                                            email = uiApi.emailInput.getValue();
                                            if (!(justRegistered !== null && justRegistered !== void 0)) return [3 /*break*/, 1];
                                            _b = justRegistered;
                                            return [3 /*break*/, 3];
                                        case 1: return [4 /*yield*/, keyGeneration.computeLoginSecretAndTowardUserKeys({
                                                "password": uiApi.passwordInput.getValue(),
                                                "uniqUserIdentification": email
                                            })];
                                        case 2:
                                            _b = _d.sent();
                                            _d.label = 3;
                                        case 3:
                                            _a = _b, secret = _a.secret, towardUserKeys = _a.towardUserKeys;
                                            return [4 /*yield*/, webApi.loginUser(__assign({ email: email,
                                                    secret: secret, "shouldThrowOnError": true }, (function () {
                                                    switch (params.assertJsRuntimeEnv) {
                                                        case "browser": return {
                                                            "assertJsRuntimeEnv": "browser"
                                                        };
                                                        case "react-native": return {
                                                            "assertJsRuntimeEnv": "react-native",
                                                            "uaInstanceId": generateUaInstanceId_1.generateUaInstanceId(params.getDeviceUniqIdentifier())
                                                        };
                                                    }
                                                })())).catch(function (error) { return error; })];
                                        case 4:
                                            resp = _d.sent();
                                            if (!(resp instanceof Error)) return [3 /*break*/, 6];
                                            console.log(resp);
                                            return [4 /*yield*/, dialogApi.create("alert", { "message": "Please try again later" })];
                                        case 5:
                                            _d.sent();
                                            uiApi.passwordInput.setValue("");
                                            return [2 /*return*/];
                                        case 6:
                                            if (resp.status !== "SUCCESS") {
                                                uiApi.passwordInput.setValue("");
                                            }
                                            _c = resp.status;
                                            switch (_c) {
                                                case "SUCCESS": return [3 /*break*/, 7];
                                                case "NO SUCH ACCOUNT": return [3 /*break*/, 9];
                                                case "WRONG PASSWORD": return [3 /*break*/, 11];
                                                case "RETRY STILL FORBIDDEN": return [3 /*break*/, 13];
                                                case "NOT VALIDATED YET": return [3 /*break*/, 15];
                                            }
                                            return [3 /*break*/, 17];
                                        case 7: return [4 /*yield*/, TowardUserKeys.store(towardUserKeys)];
                                        case 8:
                                            _d.sent();
                                            //window.location.href = `/${availablePages.PageName.manager}`;
                                            uiApi.onLoginSuccess({
                                                email: email,
                                                secret: secret,
                                                "towardUserEncryptKeyStr": cryptoLib.RsaKey.stringify(towardUserKeys.encryptKey),
                                                "towardUserDecryptKeyStr": cryptoLib.RsaKey.stringify(towardUserKeys.decryptKey)
                                            });
                                            return [3 /*break*/, 17];
                                        case 9: return [4 /*yield*/, dialogApi.create("alert", { "message": "No Semasim account correspond to this email" })];
                                        case 10:
                                            _d.sent();
                                            return [3 /*break*/, 17];
                                        case 11: return [4 /*yield*/, dialogApi.create("alert", {
                                                "message": "Wrong password, please wait " + resp.retryDelay / 1000 + " second before retrying"
                                            })];
                                        case 12:
                                            _d.sent();
                                            return [3 /*break*/, 17];
                                        case 13: return [4 /*yield*/, dialogApi.create("alert", {
                                                "message": [
                                                    "Due to unsuccessful attempt to login your account is temporally locked",
                                                    "please wait " + resp.retryDelayLeft / 1000 + " second before retrying"
                                                ].join(" ")
                                            })];
                                        case 14:
                                            _d.sent();
                                            return [3 /*break*/, 17];
                                        case 15: return [4 /*yield*/, dialogApi.create("alert", {
                                                "message": [
                                                    "This account have not been validated yet.",
                                                    "Please check your emails"
                                                ].join(" ")
                                            })];
                                        case 16:
                                            _d.sent();
                                            return [3 /*break*/, 17];
                                        case 17: return [2 /*return*/];
                                    }
                                });
                            }); },
                            "requestRenewPassword": function callee() {
                                return __awaiter(this, void 0, void 0, function () {
                                    var email, isSuccess, shouldProceed;
                                    return __generator(this, function (_a) {
                                        switch (_a.label) {
                                            case 0: return [4 /*yield*/, new Promise(function (resolve) { return dialogApi.create("prompt", {
                                                    "title": "Account email?",
                                                    "inputType": "email",
                                                    "value": uiApi.emailInput.getValue(),
                                                    "callback": function (result) { return resolve(result); },
                                                }); })];
                                            case 1:
                                                email = _a.sent();
                                                if (!email) {
                                                    return [2 /*return*/];
                                                }
                                                return [4 /*yield*/, webApi.sendRenewPasswordEmail({ email: email, "shouldThrowOnError": true })
                                                        .catch(function () { return new Error(); })];
                                            case 2:
                                                isSuccess = _a.sent();
                                                if (!(isSuccess instanceof Error)) return [3 /*break*/, 4];
                                                return [4 /*yield*/, dialogApi.create("alert", { "message": "Something went wrong please try again later" })];
                                            case 3:
                                                _a.sent();
                                                return [2 /*return*/];
                                            case 4:
                                                if (!isSuccess) return [3 /*break*/, 6];
                                                return [4 /*yield*/, dialogApi.create("alert", { "message": "An email that will let you renew your password have been sent to you" })];
                                            case 5:
                                                _a.sent();
                                                return [2 /*return*/];
                                            case 6: return [4 /*yield*/, new Promise(function (resolve) { return dialogApi.create("dialog", {
                                                    "title": "Not found",
                                                    "message": "Account '" + email + "' does not exist",
                                                    "buttons": {
                                                        "cancel": {
                                                            "label": "Retry",
                                                            "callback": function () { return resolve("RETRY"); }
                                                        },
                                                        "success": {
                                                            "label": "Register",
                                                            "className": "btn-success",
                                                            "callback": function () { return resolve("REGISTER"); }
                                                        }
                                                    },
                                                    "closeButton": true,
                                                    "onEscape": function () { return resolve("CANCEL"); }
                                                }); })];
                                            case 7:
                                                shouldProceed = _a.sent();
                                                switch (shouldProceed) {
                                                    case "CANCEL": return [2 /*return*/];
                                                    case "REGISTER":
                                                        uiApi.redirectToRegister();
                                                        return [2 /*return*/];
                                                    case "RETRY":
                                                        uiApi.emailInput.setValue("");
                                                        callee();
                                                        return [2 /*return*/];
                                                }
                                                return [2 /*return*/];
                                        }
                                    });
                                });
                            }
                        }];
                }
            });
        });
    };
}
exports.factory = factory;
function validateEmailFactory(params) {
    var webApi = params.webApi, dialogApi = params.dialogApi;
    function validateEmail(params) {
        return __awaiter(this, void 0, void 0, function () {
            var email, code, isEmailValidated;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        email = params.email, code = params.code;
                        return [4 /*yield*/, webApi.validateEmail({
                                email: email,
                                "activationCode": code,
                                "shouldThrowOnError": true
                            }).catch(function () { return new Error(); })];
                    case 1:
                        isEmailValidated = _a.sent();
                        if (!(isEmailValidated instanceof Error)) return [3 /*break*/, 3];
                        return [4 /*yield*/, dialogApi.create("alert", {
                                "message": "Something went wrong please validate your email using the link that have via email"
                            })];
                    case 2:
                        _a.sent();
                        return [2 /*return*/, { "isEmailValidated": false }];
                    case 3:
                        if (!!isEmailValidated) return [3 /*break*/, 5];
                        return [4 /*yield*/, new Promise(function (resolve) { return dialogApi.create("alert", {
                                "message": [
                                    "Email was already validated or provided activation code was wrong.",
                                    "Follow the link you received by email to try again."
                                ].join(" "),
                                "callback": function () { return resolve(); }
                            }); })];
                    case 4:
                        _a.sent();
                        _a.label = 5;
                    case 5: return [2 /*return*/, { isEmailValidated: isEmailValidated }];
                }
            });
        });
    }
    return { validateEmail: validateEmail };
}
function renewPasswordFactory(params) {
    var webApi = params.webApi, dialogApi = params.dialogApi;
    function renewPassword(params) {
        return __awaiter(this, void 0, void 0, function () {
            var email, token;
            return __generator(this, function (_a) {
                email = params.email, token = params.token;
                return [2 /*return*/, new Promise(function callee(resolve) {
                        return __awaiter(this, void 0, void 0, function () {
                            var newPassword, newPasswordConfirm, _a, newSecret, towardUserKeys, wasTokenStillValid, _b, _c, _d, _e;
                            return __generator(this, function (_f) {
                                switch (_f.label) {
                                    case 0: return [4 /*yield*/, new Promise(function (resolve) { return dialogApi.create("prompt", {
                                            "title": "Chose a new password",
                                            "inputType": "password",
                                            "callback": function (result) { return resolve(result); }
                                        }); })];
                                    case 1:
                                        newPassword = _f.sent();
                                        if (!(!newPassword || newPassword.length < 5)) return [3 /*break*/, 3];
                                        return [4 /*yield*/, new Promise(function (resolve) { return dialogApi.create("alert", {
                                                "message": "Password must be at least 5 character long",
                                                "callback": function () { return resolve(); }
                                            }); })];
                                    case 2:
                                        _f.sent();
                                        callee(resolve);
                                        return [2 /*return*/];
                                    case 3: return [4 /*yield*/, new Promise(function (resolve) { return dialogApi.create("prompt", {
                                            "title": "Confirm your new password",
                                            "inputType": "password",
                                            "callback": function (result) { return resolve(result); }
                                        }); })];
                                    case 4:
                                        newPasswordConfirm = _f.sent();
                                        if (!(newPassword !== newPasswordConfirm)) return [3 /*break*/, 6];
                                        return [4 /*yield*/, new Promise(function (resolve) { return dialogApi.create("alert", {
                                                "message": "The two entry mismatch",
                                                "callback": function () { return resolve(); }
                                            }); })];
                                    case 5:
                                        _f.sent();
                                        callee(resolve);
                                        return [2 /*return*/];
                                    case 6: return [4 /*yield*/, keyGeneration.computeLoginSecretAndTowardUserKeys({
                                            "password": newPassword,
                                            "uniqUserIdentification": email
                                        })];
                                    case 7:
                                        _a = _f.sent(), newSecret = _a.secret, towardUserKeys = _a.towardUserKeys;
                                        dialogApi.loading("Renewing password");
                                        _c = (_b = webApi).renewPassword;
                                        _d = {
                                            email: email,
                                            newSecret: newSecret,
                                            "newTowardUserEncryptKeyStr": cryptoLib.RsaKey.stringify(towardUserKeys.encryptKey)
                                        };
                                        _e = "newEncryptedSymmetricKey";
                                        return [4 /*yield*/, keyGeneration.symmetricKey.createThenEncryptKey(towardUserKeys.encryptKey)];
                                    case 8: return [4 /*yield*/, _c.apply(_b, [(_d[_e] = _f.sent(),
                                                _d.token = token,
                                                _d["shouldThrowOnError"] = true,
                                                _d)]).catch(function () { return new Error(); })];
                                    case 9:
                                        wasTokenStillValid = _f.sent();
                                        if (!(wasTokenStillValid instanceof Error)) return [3 /*break*/, 11];
                                        return [4 /*yield*/, dialogApi.create("alert", { "message": "Something went wrong please try again later" })];
                                    case 10:
                                        _f.sent();
                                        resolve({ "isSuccess": false });
                                        return [2 /*return*/];
                                    case 11:
                                        dialogApi.dismissLoading();
                                        if (!!wasTokenStillValid) return [3 /*break*/, 13];
                                        return [4 /*yield*/, dialogApi.create("alert", { "message": "This password renew email was no longer valid" })];
                                    case 12:
                                        _f.sent();
                                        resolve({ "isSuccess": false });
                                        return [2 /*return*/];
                                    case 13:
                                        resolve({
                                            "isSuccess": true,
                                            newPassword: newPassword,
                                            newSecret: newSecret,
                                            towardUserKeys: towardUserKeys
                                        });
                                        return [2 /*return*/];
                                }
                            });
                        });
                    })];
            });
        });
    }
    ;
    return { renewPassword: renewPassword };
}

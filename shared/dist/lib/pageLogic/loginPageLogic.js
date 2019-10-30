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
var cryptoLib = require("../crypto/cryptoLibProxy");
var TowardUserKeys_1 = require("../localStorage/TowardUserKeys");
var webApiCaller = require("../webApiCaller");
var crypto = require("../crypto/keysGeneration");
var JustRegistered_1 = require("../localStorage/JustRegistered");
var dialog_1 = require("../../tools/modal/dialog");
/** uaInstanceId to provide only in react native */
function login(email, password, uaInstanceId, justRegistered, uiApi) {
    return __awaiter(this, void 0, void 0, function () {
        var _a, secret, towardUserKeys, _b, resp, _c;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    _b = justRegistered;
                    if (_b) return [3 /*break*/, 2];
                    return [4 /*yield*/, crypto.computeLoginSecretAndTowardUserKeys(password, email)];
                case 1:
                    _b = (_d.sent());
                    _d.label = 2;
                case 2:
                    _a = _b, secret = _a.secret, towardUserKeys = _a.towardUserKeys;
                    webApiCaller.setCanRequestThrowToTrueForNextMethodCall();
                    return [4 /*yield*/, webApiCaller.loginUser(email, secret, uaInstanceId).catch(function (error) { return error; })];
                case 3:
                    resp = _d.sent();
                    if (!(resp instanceof Error)) return [3 /*break*/, 5];
                    return [4 /*yield*/, dialog_1.dialogApi.create("alert", {
                            "message": "Please try again later"
                        })];
                case 4:
                    _d.sent();
                    uiApi.resetPassword();
                    return [2 /*return*/];
                case 5:
                    if (resp.status !== "SUCCESS") {
                        uiApi.resetPassword();
                    }
                    _c = resp.status;
                    switch (_c) {
                        case "SUCCESS": return [3 /*break*/, 6];
                        case "NO SUCH ACCOUNT": return [3 /*break*/, 8];
                        case "WRONG PASSWORD": return [3 /*break*/, 10];
                        case "RETRY STILL FORBIDDEN": return [3 /*break*/, 12];
                        case "NOT VALIDATED YET": return [3 /*break*/, 14];
                    }
                    return [3 /*break*/, 16];
                case 6: 
                //TODO: if native declare ua.
                return [4 /*yield*/, TowardUserKeys_1.TowardUserKeys.store(towardUserKeys)];
                case 7:
                    //TODO: if native declare ua.
                    _d.sent();
                    //window.location.href = `/${availablePages.PageName.manager}`;
                    uiApi.loginSuccess(secret);
                    return [3 /*break*/, 16];
                case 8: return [4 /*yield*/, dialog_1.dialogApi.create("alert", { "message": "No Semasim account correspond to this email" })];
                case 9:
                    _d.sent();
                    return [3 /*break*/, 16];
                case 10: return [4 /*yield*/, dialog_1.dialogApi.create("alert", {
                        "message": "Wrong password, please wait " + resp.retryDelay / 1000 + " second before retrying"
                    })];
                case 11:
                    _d.sent();
                    return [3 /*break*/, 16];
                case 12: return [4 /*yield*/, dialog_1.dialogApi.create("alert", {
                        "message": [
                            "Due to unsuccessful attempt to login your account is temporally locked",
                            "please wait " + resp.retryDelayLeft / 1000 + " second before retrying"
                        ].join(" ")
                    })];
                case 13:
                    _d.sent();
                    return [3 /*break*/, 16];
                case 14: return [4 /*yield*/, dialog_1.dialogApi.create("alert", {
                        "message": [
                            "This account have not been validated yet.",
                            "Please check your emails"
                        ].join(" ")
                    })];
                case 15:
                    _d.sent();
                    return [3 /*break*/, 16];
                case 16: return [2 /*return*/];
            }
        });
    });
}
exports.login = login;
function init(params, uiApi) {
    return __awaiter(this, void 0, void 0, function () {
        var justRegistered, email_, email, email_confirmation_code, isEmailValidated, _a, _b, _c, _d, email_1;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0:
                    crypto.preSpawn();
                    return [4 /*yield*/, JustRegistered_1.JustRegistered.retrieve()];
                case 1:
                    justRegistered = _e.sent();
                    if (justRegistered) {
                        uiApi.setJustRegistered(justRegistered);
                    }
                    email_ = params.email;
                    if (email_ !== undefined) {
                        uiApi.setEmail(email_);
                    }
                    if (!(params.email_confirmation_code !== undefined ||
                        !!justRegistered && justRegistered.promptEmailValidationCode)) return [3 /*break*/, 11];
                    email = email_;
                    email_confirmation_code = params.email_confirmation_code;
                    webApiCaller.setCanRequestThrowToTrueForNextMethodCall();
                    _b = (_a = webApiCaller).validateEmail;
                    _c = [email];
                    if (!(email_confirmation_code !== undefined)) return [3 /*break*/, 2];
                    _d = email_confirmation_code;
                    return [3 /*break*/, 4];
                case 2: return [4 /*yield*/, (function callee() {
                        return __awaiter(this, void 0, void 0, function () {
                            var out;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, new Promise(function (resolve) { return dialog_1.dialogApi.create("prompt", {
                                            "title": "Code you just received by email",
                                            "inputType": "number",
                                            "placeholder": "XXXX",
                                            "callback": function (result) { return resolve(result); }
                                        }); })];
                                    case 1:
                                        out = _a.sent();
                                        if (!!out) return [3 /*break*/, 3];
                                        return [4 /*yield*/, new Promise(function (resolve) { return dialog_1.dialogApi.create("alert", {
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
                    _d = _e.sent();
                    _e.label = 4;
                case 4: return [4 /*yield*/, _b.apply(_a, _c.concat([_d])).catch(function (error) { return error; })];
                case 5:
                    isEmailValidated = _e.sent();
                    if (!(isEmailValidated instanceof Error)) return [3 /*break*/, 7];
                    return [4 /*yield*/, dialog_1.dialogApi.create("alert", {
                            "message": "Something went wrong please validate your email using the link that have via email"
                        })];
                case 6:
                    _e.sent();
                    return [2 /*return*/];
                case 7:
                    if (!!isEmailValidated) return [3 /*break*/, 9];
                    return [4 /*yield*/, new Promise(function (resolve) { return dialog_1.dialogApi.create("alert", {
                            "message": [
                                "Email was already validated or provided activation code was wrong.",
                                "Follow the link you received by email to activate your account."
                            ].join(" "),
                            "callback": function () { return resolve(); }
                        }); })];
                case 8:
                    _e.sent();
                    return [2 /*return*/];
                case 9:
                    if (!(email_confirmation_code !== undefined)) return [3 /*break*/, 11];
                    return [4 /*yield*/, new Promise(function (resolve) { return dialog_1.dialogApi.create("alert", {
                            "message": "Email successfully validated you can now proceed to login",
                            "callback": function () { return resolve(); }
                        }); })];
                case 10:
                    _e.sent();
                    _e.label = 11;
                case 11:
                    if (!!justRegistered) {
                        //$("#password").val(justRegistered.password);
                        uiApi.setPassword(justRegistered.password);
                        //$("#login-btn").trigger("click");
                        uiApi.triggerClickLogin();
                        return [2 /*return*/];
                    }
                    //NOTE: Never in React native.
                    if (params.renew_password_token !== undefined) {
                        email_1 = params.email;
                        (function callee() {
                            return __awaiter(this, void 0, void 0, function () {
                                var newPassword, newPasswordConfirm, _a, newSecret, towardUserKeys, wasTokenStillValid, _b, _c, _d;
                                return __generator(this, function (_e) {
                                    switch (_e.label) {
                                        case 0: return [4 /*yield*/, new Promise(function (resolve) { return dialog_1.dialogApi.create("prompt", {
                                                "title": "Chose a new password",
                                                "inputType": "password",
                                                "callback": function (result) { return resolve(result); }
                                            }); })];
                                        case 1:
                                            newPassword = _e.sent();
                                            if (!(!newPassword || newPassword.length < 5)) return [3 /*break*/, 3];
                                            return [4 /*yield*/, new Promise(function (resolve) { return dialog_1.dialogApi.create("alert", {
                                                    "message": "Password must be at least 5 character long",
                                                    "callback": function () { return resolve(); }
                                                }); })];
                                        case 2:
                                            _e.sent();
                                            callee();
                                            return [2 /*return*/];
                                        case 3: return [4 /*yield*/, new Promise(function (resolve) { return dialog_1.dialogApi.create("prompt", {
                                                "title": "Confirm your new password",
                                                "inputType": "password",
                                                "callback": function (result) { return resolve(result); }
                                            }); })];
                                        case 4:
                                            newPasswordConfirm = _e.sent();
                                            if (!(newPassword !== newPasswordConfirm)) return [3 /*break*/, 6];
                                            return [4 /*yield*/, new Promise(function (resolve) { return dialog_1.dialogApi.create("alert", {
                                                    "message": "The two entry mismatch",
                                                    "callback": function () { return resolve(); }
                                                }); })];
                                        case 5:
                                            _e.sent();
                                            callee();
                                            return [2 /*return*/];
                                        case 6: return [4 /*yield*/, crypto.computeLoginSecretAndTowardUserKeys(newPassword, email_1)];
                                        case 7:
                                            _a = _e.sent(), newSecret = _a.secret, towardUserKeys = _a.towardUserKeys;
                                            dialog_1.dialogApi.loading("Renewing password");
                                            webApiCaller.setCanRequestThrowToTrueForNextMethodCall();
                                            _c = (_b = webApiCaller).renewPassword;
                                            _d = [email_1,
                                                newSecret,
                                                cryptoLib.RsaKey.stringify(towardUserKeys.encryptKey)];
                                            return [4 /*yield*/, crypto.symmetricKey.createThenEncryptKey(towardUserKeys.encryptKey)];
                                        case 8: return [4 /*yield*/, _c.apply(_b, _d.concat([_e.sent(),
                                                params.renew_password_token])).catch(function (error) { return error; })];
                                        case 9:
                                            wasTokenStillValid = _e.sent();
                                            if (!(wasTokenStillValid instanceof Error)) return [3 /*break*/, 11];
                                            return [4 /*yield*/, dialog_1.dialogApi.create("alert", { "message": "Something went wrong please try again later" })];
                                        case 10:
                                            _e.sent();
                                            return [2 /*return*/];
                                        case 11:
                                            dialog_1.dialogApi.dismissLoading();
                                            if (!!wasTokenStillValid) return [3 /*break*/, 13];
                                            return [4 /*yield*/, dialog_1.dialogApi.create("alert", { "message": "This password renew email was no longer valid" })];
                                        case 12:
                                            _e.sent();
                                            return [2 /*return*/];
                                        case 13:
                                            uiApi.setJustRegistered({
                                                "password": newPassword,
                                                "secret": newSecret,
                                                towardUserKeys: towardUserKeys,
                                                "promptEmailValidationCode": false
                                            });
                                            //$("#password").val(newPassword);
                                            uiApi.setPassword(newPassword);
                                            //$("#login-form").submit();
                                            uiApi.triggerClickLogin();
                                            return [2 /*return*/];
                                    }
                                });
                            });
                        })();
                    }
                    return [2 /*return*/];
            }
        });
    });
}
exports.init = init;
function requestRenewPassword(uiApi) {
    return __awaiter(this, void 0, void 0, function () {
        var email, isSuccess, shouldProceed;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, new Promise(function (resolve) { return dialog_1.dialogApi.create("prompt", {
                        "title": "Account email?",
                        "inputType": "email",
                        "value": uiApi.getEmail(),
                        "callback": function (result) { return resolve(result); },
                    }); })];
                case 1:
                    email = _a.sent();
                    if (!email) {
                        return [2 /*return*/];
                    }
                    webApiCaller.setCanRequestThrowToTrueForNextMethodCall();
                    return [4 /*yield*/, webApiCaller.sendRenewPasswordEmail(email)
                            .catch(function (error) { return error; })];
                case 2:
                    isSuccess = _a.sent();
                    if (!(isSuccess instanceof Error)) return [3 /*break*/, 4];
                    return [4 /*yield*/, dialog_1.dialogApi.create("alert", { "message": "Something went wrong please try again later" })];
                case 3:
                    _a.sent();
                    return [2 /*return*/];
                case 4:
                    if (!isSuccess) return [3 /*break*/, 6];
                    return [4 /*yield*/, dialog_1.dialogApi.create("alert", { "message": "An email that will let you renew your password have been sent to you" })];
                case 5:
                    _a.sent();
                    return [2 /*return*/];
                case 6: return [4 /*yield*/, new Promise(function (resolve) { return dialog_1.dialogApi.create("dialog", {
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
                            uiApi.setEmail("");
                            requestRenewPassword(uiApi);
                            return [2 /*return*/];
                    }
                    return [2 /*return*/];
            }
        });
    });
}
exports.requestRenewPassword = requestRenewPassword;

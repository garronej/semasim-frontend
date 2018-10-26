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
exports.__esModule = true;
var webApiCaller = require("../../../shared/dist/lib/webApiCaller");
var bootbox_custom = require("../../../shared/dist/lib/tools/bootbox_custom");
var getURLParameter_1 = require("../../../shared/dist/lib/tools/getURLParameter");
var requestRenewPassword_1 = require("./requestRenewPassword");
function setHandlers() {
    /* Start import from theme */
    $("#login-form").validate({
        ignore: 'input[type="hidden"]',
        errorPlacement: function (error, element) {
            var place = element.closest('.input-group');
            if (!place.get(0)) {
                place = element;
            }
            if (error.text() !== '') {
                place.after(error);
            }
        },
        errorClass: 'help-block',
        rules: {
            email: {
                required: true,
                email: true
            },
            password: {
                required: true,
                minlength: 5
            }
        },
        messages: {
            password: {
                required: "Please provide a password",
                minlength: "Your password must be at least 5 characters long"
            },
            email: "Please type your email"
        },
        highlight: function (label) {
            $(label).closest('.form-group').removeClass('has-success').addClass('has-error');
        },
        success: function (label) {
            $(label).closest('.form-group').removeClass('has-error');
            label.remove();
        }
    });
    /* End import from theme */
    $("#login-form").on("submit", function (event) {
        return __awaiter(this, void 0, void 0, function () {
            var resp;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        event.preventDefault();
                        if (!$(this).valid())
                            return [2 /*return*/];
                        return [4 /*yield*/, webApiCaller.loginUser($("#email").val(), $("#password").val())];
                    case 1:
                        resp = _a.sent();
                        if (resp.status !== "SUCCESS") {
                            $("#password").val("");
                        }
                        switch (resp.status) {
                            case "SUCCESS":
                                window.location.href = "/";
                                break;
                            case "NO SUCH ACCOUNT":
                                bootbox_custom.alert("No Semasim account correspond to that email");
                                break;
                            case "WRONG PASSWORD":
                                bootbox_custom.alert("Wrong password, please wait " + resp.retryDelay / 1000 + " second before retrying");
                                break;
                            case "RETRY STILL FORBIDDEN":
                                bootbox_custom.alert([
                                    "Due to unsuccessful attempt to login your account is temporally locked",
                                    "please wait " + resp.retryDelayLeft / 1000 + " second before retrying"
                                ].join(" "));
                                break;
                            case "NOT VALIDATED YET":
                                bootbox_custom.alert([
                                    "This account have not been validated yet.",
                                    "Please check your emails"
                                ].join(" "));
                                break;
                        }
                        return [2 /*return*/];
                }
            });
        });
    });
    $("#forgot-password").click(function (event) {
        event.preventDefault();
        requestRenewPassword_1.requestRenewPassword();
    });
}
function handleQueryString() {
    return __awaiter(this, void 0, void 0, function () {
        var emailAsHex, email, password, activationCode, isEmailValidated, token;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    emailAsHex = getURLParameter_1.getURLParameter("email-as-hex");
                    email = "";
                    if (!!emailAsHex) {
                        email = Buffer.from(emailAsHex, "hex").toString("utf8");
                        $("#email").val(email);
                    }
                    password = Cookies.get("password");
                    if (!!password) {
                        Cookies.remove("password");
                        $("#password").val(password);
                    }
                    activationCode = getURLParameter_1.getURLParameter("activation-code");
                    if (!!!activationCode) return [3 /*break*/, 7];
                    if (!(activationCode === "__prompt__")) return [3 /*break*/, 2];
                    return [4 /*yield*/, (function callee() {
                            return __awaiter(this, void 0, void 0, function () {
                                var out;
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0: return [4 /*yield*/, new Promise(function (resolve) { return bootbox_custom.prompt({
                                                "title": "Please enter the four digits code that have been sent to you via email",
                                                "callback": function (result) { return resolve(result); }
                                            }); })];
                                        case 1:
                                            out = _a.sent();
                                            if (!!out) return [3 /*break*/, 3];
                                            return [4 /*yield*/, new Promise(function (resolve) { return bootbox_custom.alert("Validating you email address is mandatory to access Semasim services", function () { return resolve(); }); })];
                                        case 2:
                                            _a.sent();
                                            return [2 /*return*/, callee()];
                                        case 3: return [2 /*return*/, out];
                                    }
                                });
                            });
                        })()];
                case 1:
                    activationCode = _a.sent();
                    _a.label = 2;
                case 2: return [4 /*yield*/, webApiCaller.validateEmail(email, activationCode)];
                case 3:
                    isEmailValidated = _a.sent();
                    if (!!isEmailValidated) return [3 /*break*/, 5];
                    return [4 /*yield*/, new Promise(function (resolve) { return bootbox_custom.alert("Email was already validated or provided activation code was wrong", function () { return resolve(); }); })];
                case 4:
                    _a.sent();
                    window.close();
                    return [2 /*return*/];
                case 5: return [4 /*yield*/, new Promise(function (resolve) { return bootbox_custom.alert("Semasim account successfully validated", function () { return resolve(); }); })];
                case 6:
                    _a.sent();
                    _a.label = 7;
                case 7:
                    if (emailAsHex && !!password) {
                        $("#login-form").submit();
                        return [2 /*return*/];
                    }
                    token = getURLParameter_1.getURLParameter("token");
                    if (!!token) {
                        (function callee() {
                            return __awaiter(this, void 0, void 0, function () {
                                var newPassword, newPasswordConfirm, wasTokenStillValid;
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0: return [4 /*yield*/, new Promise(function (resolve) { return bootbox_custom.prompt({
                                                "title": "Chose a new password",
                                                "inputType": "password",
                                                "callback": function (result) { return resolve(result); }
                                            }); })];
                                        case 1:
                                            newPassword = _a.sent();
                                            if (!(!newPassword || newPassword.length < 5)) return [3 /*break*/, 3];
                                            return [4 /*yield*/, new Promise(function (resolve) { return bootbox_custom.alert("Password must be at least 5 character long", function () { return resolve(); }); })];
                                        case 2:
                                            _a.sent();
                                            callee();
                                            return [2 /*return*/];
                                        case 3: return [4 /*yield*/, new Promise(function (resolve) { return bootbox_custom.prompt({
                                                "title": "Confirm your new password",
                                                "inputType": "password",
                                                "callback": function (result) { return resolve(result); }
                                            }); })];
                                        case 4:
                                            newPasswordConfirm = _a.sent();
                                            if (!(newPassword !== newPasswordConfirm)) return [3 /*break*/, 6];
                                            return [4 /*yield*/, new Promise(function (resolve) { return bootbox_custom.alert("The two entry mismatch", function () { return resolve(); }); })];
                                        case 5:
                                            _a.sent();
                                            callee();
                                            return [2 /*return*/];
                                        case 6:
                                            bootbox_custom.loading("Renewing password");
                                            return [4 /*yield*/, webApiCaller.renewPassword(email, newPassword, token)];
                                        case 7:
                                            wasTokenStillValid = _a.sent();
                                            bootbox_custom.dismissLoading();
                                            if (!wasTokenStillValid) {
                                                bootbox_custom.alert("This password renew email was no longer valid");
                                                return [2 /*return*/];
                                            }
                                            $("#password").val(newPassword);
                                            $("#login-form").submit();
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
$(document).ready(function () {
    setHandlers();
    handleQueryString();
});

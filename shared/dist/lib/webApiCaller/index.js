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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
var apiDeclaration = require("../../web_api_declaration");
var sendRequest_1 = require("./sendRequest");
var env_1 = require("../env");
var evt_1 = require("evt");
var assert_1 = require("../../tools/typeSafety/assert");
function getWebApi(params) {
    var _this = this;
    assert_1.assert(!getWebApi.hasBeenCalled);
    getWebApi.hasBeenCalled = true;
    //const { Credentials, AuthenticatedSessionDescriptorSharedData } = params;
    var AuthenticatedSessionDescriptorSharedData = params.AuthenticatedSessionDescriptorSharedData, restartApp = params.restartApp, networkStateMonitoringApi = params.networkStateMonitoringApi;
    var evtError = new evt_1.Evt();
    evtError.attach(function (_a) {
        var methodName = _a.methodName, httpErrorStatus = _a.httpErrorStatus;
        switch (env_1.env.jsRuntimeEnv) {
            case "browser":
                {
                    switch (httpErrorStatus) {
                        case 401:
                            restartApp("Wep api 401");
                            break;
                            ;
                        case 500:
                            alert("Internal server error");
                            break;
                        case 400:
                            alert("Request malformed");
                            break;
                        case undefined:
                            alert("Can't reach the server");
                            break;
                        default: alert(methodName + " httpErrorStatus: " + httpErrorStatus);
                    }
                }
                break;
            case "react-native":
                {
                    restartApp("WebApi Error: " + methodName + " " + httpErrorStatus);
                }
                break;
        }
    });
    var sendRequest = function (params_) { return __awaiter(_this, void 0, void 0, function () {
        var methodName, params, shouldThrowOnError, _a, _b, _c, _d, error_1;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0:
                    methodName = params_.methodName, params = params_.params, shouldThrowOnError = params_.shouldThrowOnError;
                    if (!!networkStateMonitoringApi.getIsOnline()) return [3 /*break*/, 2];
                    return [4 /*yield*/, networkStateMonitoringApi.evtStateChange.waitFor()];
                case 1:
                    _e.sent();
                    _e.label = 2;
                case 2:
                    _e.trys.push([2, 8, , 9]);
                    _a = sendRequest_1.sendRequest;
                    _b = [methodName,
                        params];
                    _d = env_1.env.jsRuntimeEnv === "react-native";
                    if (!_d) return [3 /*break*/, 4];
                    return [4 /*yield*/, AuthenticatedSessionDescriptorSharedData.isPresent()];
                case 3:
                    _d = (_e.sent());
                    _e.label = 4;
                case 4:
                    if (!_d) return [3 /*break*/, 6];
                    return [4 /*yield*/, AuthenticatedSessionDescriptorSharedData.get()];
                case 5:
                    _c = (_e.sent()).connect_sid;
                    return [3 /*break*/, 7];
                case 6:
                    _c = undefined;
                    _e.label = 7;
                case 7: return [2 /*return*/, _a.apply(void 0, _b.concat([_c]))];
                case 8:
                    error_1 = _e.sent();
                    if (!(error_1 instanceof sendRequest_1.WebApiError)) {
                        throw error_1;
                    }
                    if (shouldThrowOnError) {
                        throw error_1;
                    }
                    evtError.post(error_1);
                    return [2 /*return*/, new Promise(function () { })];
                case 9: return [2 /*return*/];
            }
        });
    }); };
    return {
        WebApiError: sendRequest_1.WebApiError,
        "registerUser": (function () {
            var methodName = apiDeclaration.registerUser.methodName;
            return function (params_) {
                var shouldThrowOnError = params_.shouldThrowOnError, params = __rest(params_, ["shouldThrowOnError"]);
                return sendRequest({
                    methodName: methodName,
                    params: params,
                    shouldThrowOnError: shouldThrowOnError
                });
            };
        })(),
        "validateEmail": (function () {
            var methodName = apiDeclaration.validateEmail.methodName;
            return function (params_) {
                var shouldThrowOnError = params_.shouldThrowOnError, params = __rest(params_, ["shouldThrowOnError"]);
                return sendRequest({
                    methodName: methodName,
                    params: params,
                    shouldThrowOnError: shouldThrowOnError
                });
            };
        })(),
        "getLoginLogoutApi": function (dependencyInjectionParams) {
            assert_1.assert(dependencyInjectionParams.assertJsRuntimeEnv === env_1.env.jsRuntimeEnv, "Wrong params for js runtime environnement");
            return ({
                /** uaInstanceId should be provided on android/ios and undefined on the web */
                "loginUser": (function () {
                    var methodName = apiDeclaration.loginUser.methodName;
                    return function (params_) {
                        return __awaiter(this, void 0, void 0, function () {
                            var response, Credentials_1, declaredPushNotificationToken_1;
                            var _this = this;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        assert_1.assert(params_.assertJsRuntimeEnv === env_1.env.jsRuntimeEnv);
                                        params_.email = params_.email.toLowerCase();
                                        return [4 /*yield*/, sendRequest({
                                                methodName: methodName,
                                                "params": {
                                                    "email": params_.email,
                                                    "secret": params_.secret,
                                                    "uaInstanceId": (function () {
                                                        switch (params_.assertJsRuntimeEnv) {
                                                            case "browser": return undefined;
                                                            case "react-native": return params_.uaInstanceId;
                                                        }
                                                    })()
                                                },
                                                "shouldThrowOnError": params_.shouldThrowOnError
                                            })];
                                    case 1:
                                        response = _a.sent();
                                        if (!(response.status !== "SUCCESS")) return [3 /*break*/, 4];
                                        if (!(response.status !== "RETRY STILL FORBIDDEN" &&
                                            dependencyInjectionParams.assertJsRuntimeEnv === "react-native")) return [3 /*break*/, 3];
                                        return [4 /*yield*/, dependencyInjectionParams.Credentials.remove()];
                                    case 2:
                                        _a.sent();
                                        _a.label = 3;
                                    case 3: return [2 /*return*/, response];
                                    case 4:
                                        if (!(params_.assertJsRuntimeEnv === "react-native")) return [3 /*break*/, 6];
                                        assert_1.assert(params_.assertJsRuntimeEnv === dependencyInjectionParams.assertJsRuntimeEnv);
                                        Credentials_1 = dependencyInjectionParams.Credentials, declaredPushNotificationToken_1 = dependencyInjectionParams.declaredPushNotificationToken;
                                        return [4 /*yield*/, (function () { return __awaiter(_this, void 0, void 0, function () {
                                                var previousCred, _a;
                                                return __generator(this, function (_b) {
                                                    switch (_b.label) {
                                                        case 0: return [4 /*yield*/, Credentials_1.isPresent()];
                                                        case 1:
                                                            if (!(_b.sent())) return [3 /*break*/, 3];
                                                            return [4 /*yield*/, Credentials_1.get()];
                                                        case 2:
                                                            _a = _b.sent();
                                                            return [3 /*break*/, 4];
                                                        case 3:
                                                            _a = undefined;
                                                            _b.label = 4;
                                                        case 4:
                                                            previousCred = _a;
                                                            if (!!previousCred &&
                                                                previousCred.email === params_.email &&
                                                                previousCred.secret === params_.secret &&
                                                                previousCred.uaInstanceId === params_.uaInstanceId) {
                                                                return [2 /*return*/];
                                                            }
                                                            return [4 /*yield*/, Promise.all([
                                                                    Credentials_1.set({
                                                                        "email": params_.email,
                                                                        "secret": params_.secret,
                                                                        "uaInstanceId": params_.uaInstanceId
                                                                    }),
                                                                    declaredPushNotificationToken_1.remove()
                                                                ])];
                                                        case 5:
                                                            _b.sent();
                                                            return [2 /*return*/];
                                                    }
                                                });
                                            }); })()];
                                    case 5:
                                        _a.sent();
                                        _a.label = 6;
                                    case 6: return [4 /*yield*/, AuthenticatedSessionDescriptorSharedData.set({
                                            "connect_sid": response.connect_sid,
                                            "email": params_.email,
                                            "encryptedSymmetricKey": response.encryptedSymmetricKey,
                                            "uaInstanceId": (function () {
                                                switch (params_.assertJsRuntimeEnv) {
                                                    case "browser": return response.webUaInstanceId;
                                                    case "react-native": return params_.uaInstanceId;
                                                }
                                            })()
                                        })];
                                    case 7:
                                        _a.sent();
                                        return [2 /*return*/, { "status": response.status }];
                                }
                            });
                        });
                    };
                })(),
                "logoutUser": (function () {
                    var methodName = apiDeclaration.logoutUser.methodName;
                    return function (params_) {
                        return __awaiter(this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, sendRequest({
                                            methodName: methodName,
                                            "params": undefined,
                                            "shouldThrowOnError": params_ === null || params_ === void 0 ? void 0 : params_.shouldThrowOnError
                                        })];
                                    case 1:
                                        _a.sent();
                                        return [4 /*yield*/, AuthenticatedSessionDescriptorSharedData.remove()];
                                    case 2:
                                        _a.sent();
                                        if (!(dependencyInjectionParams.assertJsRuntimeEnv === "react-native")) return [3 /*break*/, 4];
                                        return [4 /*yield*/, dependencyInjectionParams.Credentials.remove()];
                                    case 3:
                                        _a.sent();
                                        _a.label = 4;
                                    case 4: return [2 /*return*/];
                                }
                            });
                        });
                    };
                })()
            });
        },
        "isUserLoggedIn": (function () {
            var methodName = apiDeclaration.isUserLoggedIn.methodName;
            return function (params_) {
                return __awaiter(this, void 0, void 0, function () {
                    var isLoggedIn;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0: return [4 /*yield*/, AuthenticatedSessionDescriptorSharedData.isPresent()];
                            case 1:
                                if (!(_a.sent())) {
                                    return [2 /*return*/, false];
                                }
                                return [4 /*yield*/, sendRequest({
                                        methodName: methodName,
                                        "params": undefined,
                                        "shouldThrowOnError": params_ === null || params_ === void 0 ? void 0 : params_.shouldThrowOnError
                                    })];
                            case 2:
                                isLoggedIn = _a.sent();
                                if (!!isLoggedIn) return [3 /*break*/, 4];
                                return [4 /*yield*/, AuthenticatedSessionDescriptorSharedData.remove()];
                            case 3:
                                _a.sent();
                                _a.label = 4;
                            case 4: return [2 /*return*/, isLoggedIn];
                        }
                    });
                });
            };
        })(),
        "declareUa": (function () {
            var methodName = apiDeclaration.declareUa.methodName;
            return function (params_) {
                return __awaiter(this, void 0, void 0, function () {
                    var assertJsRuntimeEnv, shouldThrowOnError, params;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                assert_1.assert(params_.assertJsRuntimeEnv === env_1.env.jsRuntimeEnv);
                                assertJsRuntimeEnv = params_.assertJsRuntimeEnv, shouldThrowOnError = params_.shouldThrowOnError, params = __rest(params_, ["assertJsRuntimeEnv", "shouldThrowOnError"]);
                                return [4 /*yield*/, sendRequest({
                                        methodName: methodName,
                                        params: params,
                                        shouldThrowOnError: shouldThrowOnError
                                    })];
                            case 1:
                                _a.sent();
                                return [2 /*return*/];
                        }
                    });
                });
            };
        })(),
        /** Return true if email has account */
        "sendRenewPasswordEmail": (function () {
            var methodName = apiDeclaration.sendRenewPasswordEmail.methodName;
            return function (params_) {
                var shouldThrowOnError = params_.shouldThrowOnError, params = __rest(params_, ["shouldThrowOnError"]);
                return sendRequest({
                    methodName: methodName,
                    params: params,
                    shouldThrowOnError: shouldThrowOnError
                });
            };
        })(),
        "renewPassword": (function () {
            var methodName = apiDeclaration.renewPassword.methodName;
            return function (params_) {
                var shouldThrowOnError = params_.shouldThrowOnError, params = __rest(params_, ["shouldThrowOnError"]);
                return sendRequest({
                    methodName: methodName,
                    params: params,
                    shouldThrowOnError: shouldThrowOnError
                });
            };
        })(),
        "getCountryIso": (function () {
            var methodName = apiDeclaration.getCountryIso.methodName;
            return function (params_) {
                return sendRequest({
                    methodName: methodName,
                    "params": undefined,
                    "shouldThrowOnError": params_ === null || params_ === void 0 ? void 0 : params_.shouldThrowOnError
                });
            };
        })(),
        "getChangesRates": (function () {
            var methodName = apiDeclaration.getChangesRates.methodName;
            return function (params_) {
                return sendRequest({
                    methodName: methodName,
                    "params": undefined,
                    "shouldThrowOnError": params_ === null || params_ === void 0 ? void 0 : params_.shouldThrowOnError
                });
            };
        })(),
        "getSubscriptionInfos": (function () {
            var methodName = apiDeclaration.getSubscriptionInfos.methodName;
            return function (params_) {
                return sendRequest({
                    methodName: methodName,
                    "params": undefined,
                    "shouldThrowOnError": params_ === null || params_ === void 0 ? void 0 : params_.shouldThrowOnError
                });
            };
        })(),
        "subscribeOrUpdateSource": (function () {
            var methodName = apiDeclaration.subscribeOrUpdateSource.methodName;
            return function (params_) {
                return __awaiter(this, void 0, void 0, function () {
                    var sourceId, shouldThrowOnError;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                sourceId = params_.sourceId, shouldThrowOnError = params_.shouldThrowOnError;
                                return [4 /*yield*/, sendRequest({
                                        methodName: methodName,
                                        "params": { sourceId: sourceId },
                                        shouldThrowOnError: shouldThrowOnError
                                    })];
                            case 1:
                                _a.sent();
                                return [2 /*return*/];
                        }
                    });
                });
            };
        })(),
        "unsubscribe": (function () {
            var methodName = apiDeclaration.unsubscribe.methodName;
            return function (params_) {
                return __awaiter(this, void 0, void 0, function () {
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0: return [4 /*yield*/, sendRequest({
                                    methodName: methodName,
                                    "params": undefined,
                                    "shouldThrowOnError": params_ === null || params_ === void 0 ? void 0 : params_.shouldThrowOnError
                                })];
                            case 1:
                                _a.sent();
                                return [2 /*return*/];
                        }
                    });
                });
            };
        })(),
        "createStripeCheckoutSessionForShop": (function () {
            var methodName = apiDeclaration.createStripeCheckoutSessionForShop.methodName;
            return function (params_) {
                var cart = params_.cart, shippingFormData = params_.shippingFormData, currency = params_.currency, success_url = params_.success_url, cancel_url = params_.cancel_url, shouldThrowOnError = params_.shouldThrowOnError;
                return sendRequest({
                    methodName: methodName,
                    "params": {
                        "cartDescription": cart.map(function (_a) {
                            var product = _a.product, quantity = _a.quantity;
                            return ({
                                "productName": product.name,
                                quantity: quantity
                            });
                        }),
                        shippingFormData: shippingFormData,
                        currency: currency,
                        success_url: success_url,
                        cancel_url: cancel_url
                    },
                    shouldThrowOnError: shouldThrowOnError
                });
            };
        })(),
        "createStripeCheckoutSessionForSubscription": (function () {
            var methodName = apiDeclaration.createStripeCheckoutSessionForSubscription.methodName;
            return function (params_) {
                var shouldThrowOnError = params_.shouldThrowOnError, params = __rest(params_, ["shouldThrowOnError"]);
                return sendRequest({
                    methodName: methodName,
                    params: params,
                    shouldThrowOnError: shouldThrowOnError
                });
            };
        })(),
        "getOrders": (function () {
            var methodName = apiDeclaration.getOrders.methodName;
            return function (params_) {
                return sendRequest({
                    methodName: methodName,
                    "params": undefined,
                    "shouldThrowOnError": params_ === null || params_ === void 0 ? void 0 : params_.shouldThrowOnError
                });
            };
        })()
    };
}
exports.getWebApi = getWebApi;
(function (getWebApi) {
    getWebApi.hasBeenCalled = false;
})(getWebApi = exports.getWebApi || (exports.getWebApi = {}));

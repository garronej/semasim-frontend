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
var apiDeclaration = require("../../web_api_declaration");
var sendRequest_1 = require("./sendRequest");
exports.WebApiError = sendRequest_1.WebApiError;
var AuthenticatedSessionDescriptorSharedData_1 = require("../localStorage/AuthenticatedSessionDescriptorSharedData");
var Credentials_1 = require("../localStorage/Credentials");
var env = require("../env");
var ts_events_extended_1 = require("ts-events-extended");
var restartApp_1 = require("../restartApp");
var networkStateMonitoring = require("../networkStateMonitoring");
var evtError = new ts_events_extended_1.SyncEvent();
evtError.attach(function (_a) {
    var methodName = _a.methodName, httpErrorStatus = _a.httpErrorStatus;
    switch (env.jsRuntimeEnv) {
        case "browser":
            {
                switch (httpErrorStatus) {
                    case 401:
                        restartApp_1.restartApp();
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
                console.log("WebApi Error: " + methodName + " " + httpErrorStatus);
                restartApp_1.restartApp();
            }
            break;
    }
});
var canRequestThrow = false;
function setCanRequestThrowToTrueForNextMethodCall() {
    canRequestThrow = true;
}
exports.setCanRequestThrowToTrueForNextMethodCall = setCanRequestThrowToTrueForNextMethodCall;
var sendRequest = function (methodName, params) { return __awaiter(void 0, void 0, void 0, function () {
    var networkStateMonitoringApi, _a, _b, _c, _d, error_1;
    return __generator(this, function (_e) {
        switch (_e.label) {
            case 0: return [4 /*yield*/, networkStateMonitoring.getApi()];
            case 1:
                networkStateMonitoringApi = _e.sent();
                if (!!networkStateMonitoringApi.getIsOnline()) return [3 /*break*/, 3];
                return [4 /*yield*/, networkStateMonitoringApi.evtStateChange.waitFor()];
            case 2:
                _e.sent();
                _e.label = 3;
            case 3:
                _e.trys.push([3, 9, , 10]);
                _a = sendRequest_1.sendRequest;
                _b = [methodName,
                    params];
                _d = env.jsRuntimeEnv === "react-native";
                if (!_d) return [3 /*break*/, 5];
                return [4 /*yield*/, AuthenticatedSessionDescriptorSharedData_1.AuthenticatedSessionDescriptorSharedData.isPresent()];
            case 4:
                _d = (_e.sent());
                _e.label = 5;
            case 5:
                if (!_d) return [3 /*break*/, 7];
                return [4 /*yield*/, AuthenticatedSessionDescriptorSharedData_1.AuthenticatedSessionDescriptorSharedData.get()];
            case 6:
                _c = (_e.sent()).connect_sid;
                return [3 /*break*/, 8];
            case 7:
                _c = undefined;
                _e.label = 8;
            case 8: return [2 /*return*/, _a.apply(void 0, _b.concat([_c]))];
            case 9:
                error_1 = _e.sent();
                if (!(error_1 instanceof sendRequest_1.WebApiError)) {
                    throw error_1;
                }
                if (canRequestThrow) {
                    canRequestThrow = false;
                    throw error_1;
                }
                evtError.post(error_1);
                return [2 /*return*/, new Promise(function () { })];
            case 10: return [2 /*return*/];
        }
    });
}); };
exports.registerUser = (function () {
    var methodName = apiDeclaration.registerUser.methodName;
    return function (email, secret, towardUserEncryptKeyStr, encryptedSymmetricKey) {
        return sendRequest(methodName, {
            email: email,
            secret: secret,
            towardUserEncryptKeyStr: towardUserEncryptKeyStr,
            encryptedSymmetricKey: encryptedSymmetricKey
        });
    };
})();
exports.validateEmail = (function () {
    var methodName = apiDeclaration.validateEmail.methodName;
    return function (email, activationCode) {
        return sendRequest(methodName, { email: email, activationCode: activationCode });
    };
})();
/** uaInstanceId should be provided on android/iOS and undefined on the web */
exports.loginUser = (function () {
    var methodName = apiDeclaration.loginUser.methodName;
    return function (email, secret, uaInstanceId) {
        return __awaiter(this, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        email = email.toLowerCase();
                        return [4 /*yield*/, sendRequest(methodName, { email: email, secret: secret, uaInstanceId: uaInstanceId })];
                    case 1:
                        response = _a.sent();
                        if (response.status !== "SUCCESS") {
                            return [2 /*return*/, response];
                        }
                        if (!(env.jsRuntimeEnv === "react-native")) return [3 /*break*/, 3];
                        return [4 /*yield*/, Credentials_1.Credentials.set({
                                email: email,
                                secret: secret,
                                "uaInstanceId": uaInstanceId
                            })];
                    case 2:
                        _a.sent();
                        _a.label = 3;
                    case 3: return [4 /*yield*/, AuthenticatedSessionDescriptorSharedData_1.AuthenticatedSessionDescriptorSharedData.set({
                            "connect_sid": response.connect_sid,
                            email: email,
                            "encryptedSymmetricKey": response.encryptedSymmetricKey,
                            "uaInstanceId": uaInstanceId === undefined ?
                                response.webUaInstanceId : uaInstanceId
                        })];
                    case 4:
                        _a.sent();
                        return [2 /*return*/, { "status": response.status }];
                }
            });
        });
    };
})();
exports.isUserLoggedIn = (function () {
    var methodName = apiDeclaration.isUserLoggedIn.methodName;
    return function () {
        return __awaiter(this, void 0, void 0, function () {
            var isLoggedIn;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, sendRequest(methodName, undefined)];
                    case 1:
                        isLoggedIn = _a.sent();
                        if (!!isLoggedIn) return [3 /*break*/, 3];
                        return [4 /*yield*/, AuthenticatedSessionDescriptorSharedData_1.AuthenticatedSessionDescriptorSharedData.remove()];
                    case 2:
                        _a.sent();
                        _a.label = 3;
                    case 3: return [2 /*return*/, isLoggedIn];
                }
            });
        });
    };
})();
exports.declareUa = (function () {
    var methodName = apiDeclaration.declareUa.methodName;
    return function (params) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, sendRequest(methodName, params)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
})();
exports.logoutUser = (function () {
    var methodName = apiDeclaration.logoutUser.methodName;
    return function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, sendRequest(methodName, undefined)];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, AuthenticatedSessionDescriptorSharedData_1.AuthenticatedSessionDescriptorSharedData.remove()];
                    case 2:
                        _a.sent();
                        if (!(env.jsRuntimeEnv === "react-native")) return [3 /*break*/, 4];
                        return [4 /*yield*/, Credentials_1.Credentials.remove()];
                    case 3:
                        _a.sent();
                        _a.label = 4;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
})();
/** Return true if email has account */
exports.sendRenewPasswordEmail = (function () {
    var methodName = apiDeclaration.sendRenewPasswordEmail.methodName;
    return function (email) {
        return sendRequest(methodName, { email: email });
    };
})();
exports.renewPassword = (function () {
    var methodName = apiDeclaration.renewPassword.methodName;
    return function (email, newSecret, newTowardUserEncryptKeyStr, newEncryptedSymmetricKey, token) {
        return sendRequest(methodName, {
            email: email,
            newSecret: newSecret,
            newTowardUserEncryptKeyStr: newTowardUserEncryptKeyStr,
            newEncryptedSymmetricKey: newEncryptedSymmetricKey,
            token: token
        });
    };
})();
exports.getCountryIso = (function () {
    var methodName = apiDeclaration.getCountryIso.methodName;
    return function () {
        return sendRequest(methodName, undefined);
    };
})();
exports.getChangesRates = (function () {
    var methodName = apiDeclaration.getChangesRates.methodName;
    return function () {
        return sendRequest(methodName, undefined);
    };
})();
exports.getSubscriptionInfos = (function () {
    var methodName = apiDeclaration.getSubscriptionInfos.methodName;
    return function () {
        return sendRequest(methodName, undefined);
    };
})();
exports.subscribeOrUpdateSource = (function () {
    var methodName = apiDeclaration.subscribeOrUpdateSource.methodName;
    return function (sourceId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, sendRequest(methodName, { sourceId: sourceId })];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
})();
exports.unsubscribe = (function () {
    var methodName = apiDeclaration.unsubscribe.methodName;
    return function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, sendRequest(methodName, undefined)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
})();
exports.createStripeCheckoutSessionForShop = (function () {
    var methodName = apiDeclaration.createStripeCheckoutSessionForShop.methodName;
    return function (cart, shippingFormData, currency, success_url, cancel_url) {
        return sendRequest(methodName, {
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
        });
    };
})();
exports.createStripeCheckoutSessionForSubscription = (function () {
    var methodName = apiDeclaration.createStripeCheckoutSessionForSubscription.methodName;
    return function (currency, success_url, cancel_url) {
        return sendRequest(methodName, {
            currency: currency,
            success_url: success_url,
            cancel_url: cancel_url
        });
    };
})();
exports.getOrders = (function () {
    var methodName = apiDeclaration.getOrders.methodName;
    return function () {
        return sendRequest(methodName, undefined);
    };
})();

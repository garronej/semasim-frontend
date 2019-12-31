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
var __spread = (this && this.__spread) || function () {
    for (var ar = [], i = 0; i < arguments.length; i++) ar = ar.concat(__read(arguments[i]));
    return ar;
};
Object.defineProperty(exports, "__esModule", { value: true });
var appCryptoSetupHelper_1 = require("./crypto/appCryptoSetupHelper");
var remoteApiCaller = require("./toBackend/remoteApiCaller");
var AuthenticatedSessionDescriptorSharedData_1 = require("./localStorage/AuthenticatedSessionDescriptorSharedData");
var declaredPushNotificationToken = require("./localStorage/declaredPushNotificationToken");
var TowardUserKeys_1 = require("./localStorage/TowardUserKeys");
var sipUserAgent_1 = require("./sipUserAgent");
var appEvts_1 = require("./toBackend/appEvts");
var Webphone_1 = require("./Webphone");
var connection = require("./toBackend/connection");
var tryLoginFromStoredCredentials_1 = require("./tryLoginFromStoredCredentials");
var restartApp_1 = require("./restartApp");
var env_1 = require("./env");
var dialog_1 = require("../tools/modal/dialog");
var webApiCaller = require("./webApiCaller");
var interactiveAppEvtHandlers_1 = require("./interactiveAppEvtHandlers");
var getPushToken_1 = require("./getPushToken");
var id_1 = require("../tools/id");
var log = true ?
    (function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        return console.log.apply(console, __spread(["[appLauncher]"], args));
    }) :
    (function () { });
function appLauncher(params) {
    return __awaiter(this, void 0, void 0, function () {
        var needLogin, _a;
        var _this = this;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    if (params.assertJsRuntimeEnv !== env_1.env.jsRuntimeEnv) {
                        throw new Error("Wrong params for js runtime environnement");
                    }
                    if (params.assertJsRuntimeEnv === "react-native") {
                        dialog_1.provideCustomImplementationOfBaseApi(params.dialogBaseApi);
                    }
                    _a = "NO VALID CREDENTIALS";
                    return [4 /*yield*/, tryLoginFromStoredCredentials_1.tryLoginFromStoredCredentials()];
                case 1:
                    needLogin = _a === (_b.sent());
                    return [2 /*return*/, {
                            needLogin: needLogin,
                            "prWebphones": (function () { return __awaiter(_this, void 0, void 0, function () {
                                var _a, _b;
                                return __generator(this, function (_c) {
                                    switch (_c.label) {
                                        case 0:
                                            if (!needLogin) return [3 /*break*/, 2];
                                            if (params.assertJsRuntimeEnv === "browser") {
                                                return [2 /*return*/, restartApp_1.restartApp("User not logged in (launching app)")];
                                            }
                                            return [4 /*yield*/, AuthenticatedSessionDescriptorSharedData_1.AuthenticatedSessionDescriptorSharedData.evtChange
                                                    .waitFor(function (authenticatedSessionDescriptorSharedData) { return !!authenticatedSessionDescriptorSharedData; })];
                                        case 1:
                                            _c.sent();
                                            _c.label = 2;
                                        case 2:
                                            _a = appLauncher_onceLoggedIn;
                                            _b = [params];
                                            return [4 /*yield*/, AuthenticatedSessionDescriptorSharedData_1.AuthenticatedSessionDescriptorSharedData.get()];
                                        case 3: return [2 /*return*/, _a.apply(void 0, _b.concat([_c.sent()]))];
                                    }
                                });
                            }); })()
                        }];
            }
        });
    });
}
exports.appLauncher = appLauncher;
function appLauncher_onceLoggedIn(params, authenticatedSessionDescriptorSharedData) {
    return __awaiter(this, void 0, void 0, function () {
        var encryptedSymmetricKey, email, uaInstanceId, _a, paramsNeededToEncryptDecryptWebphoneData, paramsNeededToInstantiateUa, _b, _c, _d, pushNotificationToken, userSims, prCreateWebphone, _e, _f, _g, _h;
        var _this = this;
        return __generator(this, function (_j) {
            switch (_j.label) {
                case 0:
                    encryptedSymmetricKey = authenticatedSessionDescriptorSharedData.encryptedSymmetricKey, email = authenticatedSessionDescriptorSharedData.email, uaInstanceId = authenticatedSessionDescriptorSharedData.uaInstanceId;
                    _b = appCryptoSetupHelper_1.appCryptoSetupHelper;
                    _c = {};
                    _d = "towardUserKeys";
                    return [4 /*yield*/, TowardUserKeys_1.TowardUserKeys.retrieve()];
                case 1: return [4 /*yield*/, _b.apply(void 0, [(_c[_d] = _j.sent(),
                            _c.encryptedSymmetricKey = encryptedSymmetricKey,
                            _c)])];
                case 2:
                    _a = _j.sent(), paramsNeededToEncryptDecryptWebphoneData = _a.paramsNeededToEncryptDecryptWebphoneData, paramsNeededToInstantiateUa = _a.paramsNeededToInstantiateUa;
                    return [4 /*yield*/, (function () {
                            switch (params.assertJsRuntimeEnv) {
                                case "browser": return undefined;
                                case "react-native": return getPushToken_1.getPushToken();
                            }
                        })()];
                case 3:
                    pushNotificationToken = _j.sent();
                    //TODO: If user delete and re create an account with same email and password
                    //and to not re-open the app while the account was deleted the it will result
                    //into the UA not being declared.
                    //To fix this backend might return user.id_ so we can detect when it is not
                    //the same user account. ( change need to be made in webApiCaller.loginUser )
                    return [4 /*yield*/, (function () { return __awaiter(_this, void 0, void 0, function () {
                            var _a;
                            return __generator(this, function (_b) {
                                switch (_b.label) {
                                    case 0:
                                        if (pushNotificationToken === undefined) {
                                            return [2 /*return*/];
                                        }
                                        _a = pushNotificationToken;
                                        return [4 /*yield*/, declaredPushNotificationToken.get()];
                                    case 1:
                                        if (_a === (_b.sent())) {
                                            return [2 /*return*/];
                                        }
                                        log("Declaring UA");
                                        return [4 /*yield*/, webApiCaller.declareUa({
                                                "platform": env_1.env.hostOs,
                                                pushNotificationToken: pushNotificationToken
                                            })];
                                    case 2:
                                        _b.sent();
                                        return [4 /*yield*/, declaredPushNotificationToken.set(pushNotificationToken)];
                                    case 3:
                                        _b.sent();
                                        return [2 /*return*/];
                                }
                            });
                        }); })()];
                case 4:
                    //TODO: If user delete and re create an account with same email and password
                    //and to not re-open the app while the account was deleted the it will result
                    //into the UA not being declared.
                    //To fix this backend might return user.id_ so we can detect when it is not
                    //the same user account. ( change need to be made in webApiCaller.loginUser )
                    _j.sent();
                    connection.connect((function () {
                        var requestTurnCred = true;
                        switch (params.assertJsRuntimeEnv) {
                            case "browser": {
                                return id_1.id({
                                    "assertJsRuntimeEnv": "browser",
                                    requestTurnCred: requestTurnCred
                                });
                            }
                            case "react-native": {
                                return id_1.id({
                                    "assertJsRuntimeEnv": "react-native",
                                    requestTurnCred: requestTurnCred,
                                    "notConnectedUserFeedback": params.notConnectedUserFeedback
                                });
                            }
                        }
                    })());
                    appEvts_1.appEvts.evtUsableSim.attachOnce(function () { return restartApp_1.restartApp("New usable sim"); });
                    appEvts_1.appEvts.evtSimPermissionLost.attach(function () { return restartApp_1.restartApp("Permission lost for a Sim"); });
                    appEvts_1.appEvts.evtSimPasswordChanged.attach(function () { return restartApp_1.restartApp("One sim password have changed"); });
                    interactiveAppEvtHandlers_1.registerInteractiveAppEvtHandlers(appEvts_1.appEvts, remoteApiCaller.core, dialog_1.dialogApi, dialog_1.startMultiDialogProcess, restartApp_1.restartApp);
                    return [4 /*yield*/, remoteApiCaller.core.getUsableUserSims()];
                case 5:
                    userSims = _j.sent();
                    _f = (_e = Webphone_1.Webphone).createFactory;
                    _g = {
                        "sipUserAgentCreate": sipUserAgent_1.sipUserAgentCreateFactory({
                            email: email,
                            uaInstanceId: uaInstanceId,
                            "cryptoRelatedParams": paramsNeededToInstantiateUa,
                            "pushNotificationToken": (pushNotificationToken !== null && pushNotificationToken !== void 0 ? pushNotificationToken : ""),
                            connection: connection,
                            appEvts: appEvts_1.appEvts
                        }),
                        appEvts: appEvts_1.appEvts,
                        "getWdApiCallerForSpecificSim": remoteApiCaller.getWdApiCallerForSpecificSimFactory(paramsNeededToEncryptDecryptWebphoneData.encryptorDecryptor, email),
                        "coreApiCaller": remoteApiCaller.core
                    };
                    _h = "phoneCallUiCreate";
                    return [4 /*yield*/, params.phoneCallUiCreateFactory((function () {
                            switch (env_1.env.jsRuntimeEnv) {
                                case "browser": {
                                    return id_1.id({
                                        "assertJsRuntimeEnv": "browser"
                                    });
                                }
                                case "react-native": {
                                    return id_1.id({
                                        "assertJsRuntimeEnv": "react-native",
                                        userSims: userSims,
                                    });
                                }
                            }
                        })())];
                case 6:
                    prCreateWebphone = _f.apply(_e, [(_g[_h] = _j.sent(),
                            _g)]);
                    return [4 /*yield*/, Promise.all(userSims.map(function (userSim) { return prCreateWebphone.then(function (createWebphone) { return createWebphone(userSim); }); }))];
                case 7: return [2 /*return*/, (_j.sent()).sort(Webphone_1.Webphone.sortPutingFirstTheOnesWithMoreRecentActivity)];
            }
        });
    });
}

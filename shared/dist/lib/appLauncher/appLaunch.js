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
exports.appLaunch = void 0;
var appCryptoSetupHelper_1 = require("../crypto/appCryptoSetupHelper");
var createSipUserAgentFactory_1 = require("../createSipUserAgentFactory");
var createWebphoneFactory_1 = require("../createWebphoneFactory");
var restartApp_1 = require("../restartApp");
var env_1 = require("../env");
var dialog_1 = require("../../tools/modal/dialog");
var lib_1 = require("phone-number/dist/lib");
var types = require("../types");
var Webphone_1 = require("../types/Webphone");
var id_1 = require("../../tools/typeSafety/id");
var assert_1 = require("../../tools/typeSafety/assert");
var webApiCaller_1 = require("../webApiCaller");
var tryLoginWithStoredCredentialIfNotAlreadyLogedInFactory_1 = require("../tryLoginWithStoredCredentialIfNotAlreadyLogedInFactory");
var TowardUserKeys_1 = require("../localStorage/TowardUserKeys");
var Credentials_1 = require("../localStorage/Credentials");
var JustRegistered_1 = require("../localStorage/JustRegistered");
var AuthenticatedSessionDescriptorSharedData_1 = require("../localStorage/AuthenticatedSessionDescriptorSharedData");
var declaredPushNotificationToken = require("../localStorage/declaredPushNotificationToken");
var networkStateMonitoring = require("../networkStateMonitoring");
var loginPageLogic = require("../pageLogic/login");
var registerPageLogic = require("../pageLogic/register");
var minimalLaunch_1 = require("./minimalLaunch");
var modal_1 = require("../../tools/modal");
var log = true ?
    (function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        return console.log.apply(console, __spread(["[appLaunch]"], args));
    }) :
    (function () { });
function appLaunch(params) {
    var _this = this;
    assert_1.assert(!appLaunch.hasBeedCalled, "Should be called only once");
    appLaunch.hasBeedCalled = true;
    assert_1.assert(params.assertJsRuntimeEnv === env_1.env.jsRuntimeEnv, "Wrong params for js runtime environnement");
    if (params.assertJsRuntimeEnv === "react-native") {
        restartApp_1.registerActionToPerformBeforeAppRestart(function () { return params.actionToPerformBeforeAppRestart(); });
        dialog_1.provideCustomImplementationOfBaseApi(params.dialogBaseApi);
    }
    return {
        dialogApi: dialog_1.dialogApi,
        startMultiDialogProcess: dialog_1.startMultiDialogProcess,
        restartApp: restartApp_1.restartApp,
        createModal: modal_1.createModal,
        "prAuthenticationStep": (function () { return __awaiter(_this, void 0, void 0, function () {
            var networkStateMonitoringApi, webApi, tryLoginWithStoredCredentialIfNotAlreadyLogedIn, needLogin;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, networkStateMonitoring.getApi()];
                    case 1:
                        networkStateMonitoringApi = _a.sent();
                        webApi = (function () {
                            var _a = webApiCaller_1.getWebApi({
                                AuthenticatedSessionDescriptorSharedData: AuthenticatedSessionDescriptorSharedData_1.AuthenticatedSessionDescriptorSharedData,
                                networkStateMonitoringApi: networkStateMonitoringApi,
                                restartApp: restartApp_1.restartApp
                            }), getLoginLogoutApi = _a.getLoginLogoutApi, rest = __rest(_a, ["getLoginLogoutApi"]);
                            return __assign(__assign({}, rest), getLoginLogoutApi({
                                "assertJsRuntimeEnv": params.assertJsRuntimeEnv,
                                Credentials: Credentials_1.Credentials,
                                declaredPushNotificationToken: declaredPushNotificationToken
                            }));
                        })();
                        tryLoginWithStoredCredentialIfNotAlreadyLogedIn = tryLoginWithStoredCredentialIfNotAlreadyLogedInFactory_1.tryLoginWithStoredCredentialIfNotAlreadyLogedInFactory((function () {
                            switch (params.assertJsRuntimeEnv) {
                                case "browser": return id_1.id({
                                    "assertJsRuntimeEnv": params.assertJsRuntimeEnv,
                                    webApi: webApi
                                });
                                case "react-native": return id_1.id({
                                    "assertJsRuntimeEnv": params.assertJsRuntimeEnv,
                                    Credentials: Credentials_1.Credentials,
                                    webApi: webApi
                                });
                            }
                        })());
                        return [4 /*yield*/, tryLoginWithStoredCredentialIfNotAlreadyLogedIn()];
                    case 2:
                        needLogin = (_a.sent()) === "NO VALID CREDENTIALS";
                        return [2 /*return*/, __assign(__assign({}, (needLogin ? ({
                                "needLogin": true,
                                tryLoginWithStoredCredentialIfNotAlreadyLogedIn: tryLoginWithStoredCredentialIfNotAlreadyLogedIn,
                                "launchLogin": loginPageLogic.factory({
                                    webApi: webApi,
                                    dialogApi: dialog_1.dialogApi,
                                    JustRegistered: JustRegistered_1.JustRegistered,
                                    TowardUserKeys: TowardUserKeys_1.TowardUserKeys
                                }),
                                "launchRegister": registerPageLogic.factory({
                                    webApi: webApi,
                                    dialogApi: dialog_1.dialogApi,
                                    JustRegistered: JustRegistered_1.JustRegistered,
                                })
                            }) : ({
                                "needLogin": false
                            }))), { "getAccountManagementApiAndWebphoneLauncher": id_1.id(function (_a) {
                                    var prReadyToDisplayUnsolicitedDialogs = _a.prReadyToDisplayUnsolicitedDialogs;
                                    return __awaiter(_this, void 0, void 0, function () {
                                        return __generator(this, function (_b) {
                                            switch (_b.label) {
                                                case 0:
                                                    if (!needLogin) return [3 /*break*/, 2];
                                                    if (params.assertJsRuntimeEnv === "browser") {
                                                        return [2 /*return*/, restartApp_1.restartApp("User not logged in (launching app)")];
                                                    }
                                                    return [4 /*yield*/, AuthenticatedSessionDescriptorSharedData_1.AuthenticatedSessionDescriptorSharedData.evtChange
                                                            .waitFor(function (authenticatedSessionDescriptorSharedData) { return !!authenticatedSessionDescriptorSharedData; })];
                                                case 1:
                                                    _b.sent();
                                                    _b.label = 2;
                                                case 2: return [2 /*return*/, onceLoggedIn((function () {
                                                        var common_ = {
                                                            prReadyToDisplayUnsolicitedDialogs: prReadyToDisplayUnsolicitedDialogs,
                                                            networkStateMonitoringApi: networkStateMonitoringApi,
                                                            tryLoginWithStoredCredentialIfNotAlreadyLogedIn: tryLoginWithStoredCredentialIfNotAlreadyLogedIn,
                                                            webApi: webApi
                                                        };
                                                        switch (params.assertJsRuntimeEnv) {
                                                            case "browser": return id_1.id(__assign({ "assertJsRuntimeEnv": params.assertJsRuntimeEnv }, common_));
                                                            case "react-native": return id_1.id(__assign({ "assertJsRuntimeEnv": params.assertJsRuntimeEnv, "notConnectedUserFeedback": params.notConnectedUserFeedback, "prEvtPushNotificationToken": params.prEvtPushNotificationToken }, common_));
                                                        }
                                                    })())];
                                            }
                                        });
                                    });
                                }) })];
                }
            });
        }); })()
    };
}
exports.appLaunch = appLaunch;
appLaunch.hasBeedCalled = false;
function onceLoggedIn(params) {
    return __awaiter(this, void 0, void 0, function () {
        var webApi, networkStateMonitoringApi, tryLoginWithStoredCredentialIfNotAlreadyLogedIn, prReadyToDisplayUnsolicitedDialogs, _a, encryptedSymmetricKey, email, uaInstanceId, _b, paramsNeededToEncryptDecryptWebphoneData, paramsNeededToInstantiateUa, _c, _d, _e, pushNotificationToken, _f, getWdApiFactory, connectionApi, coreApi, readyToDisplayUnsolicitedDialogs, userSims, userSimEvts, usableOnly;
        var _this = this;
        return __generator(this, function (_g) {
            switch (_g.label) {
                case 0:
                    webApi = params.webApi, networkStateMonitoringApi = params.networkStateMonitoringApi, tryLoginWithStoredCredentialIfNotAlreadyLogedIn = params.tryLoginWithStoredCredentialIfNotAlreadyLogedIn, prReadyToDisplayUnsolicitedDialogs = params.prReadyToDisplayUnsolicitedDialogs;
                    return [4 /*yield*/, AuthenticatedSessionDescriptorSharedData_1.AuthenticatedSessionDescriptorSharedData.get()];
                case 1:
                    _a = _g.sent(), encryptedSymmetricKey = _a.encryptedSymmetricKey, email = _a.email, uaInstanceId = _a.uaInstanceId;
                    _c = appCryptoSetupHelper_1.appCryptoSetupHelper;
                    _d = {};
                    _e = "towardUserKeys";
                    return [4 /*yield*/, TowardUserKeys_1.TowardUserKeys.retrieve()];
                case 2: return [4 /*yield*/, _c.apply(void 0, [(_d[_e] = _g.sent(),
                            _d.encryptedSymmetricKey = encryptedSymmetricKey,
                            _d)])];
                case 3:
                    _b = _g.sent(), paramsNeededToEncryptDecryptWebphoneData = _b.paramsNeededToEncryptDecryptWebphoneData, paramsNeededToInstantiateUa = _b.paramsNeededToInstantiateUa;
                    pushNotificationToken = undefined;
                    //TODO: If user delete and re create an account with same email and password
                    //and to not re-open the app while the account was deleted the it will result
                    //into the UA not being declared.
                    //To fix this backend might return user.id_ so we can detect when it is not
                    //the same user account. ( change need to be made in webApiCaller.loginUser )
                    return [4 /*yield*/, (function () { return __awaiter(_this, void 0, void 0, function () {
                            var _a;
                            var _this = this;
                            return __generator(this, function (_b) {
                                switch (_b.label) {
                                    case 0:
                                        if (params.assertJsRuntimeEnv === "browser") {
                                            return [2 /*return*/];
                                        }
                                        return [4 /*yield*/, (function () { return __awaiter(_this, void 0, void 0, function () {
                                                var evtPushNotificationToken;
                                                return __generator(this, function (_a) {
                                                    switch (_a.label) {
                                                        case 0: return [4 /*yield*/, params.prEvtPushNotificationToken];
                                                        case 1:
                                                            evtPushNotificationToken = _a.sent();
                                                            evtPushNotificationToken.evtChangeDiff.attachOnce(function (_a) {
                                                                var newState = _a.newState, prevState = _a.prevState;
                                                                return restartApp_1.restartApp([
                                                                    "Push notification token changed: new token: " + newState + ", ",
                                                                    "previous token: " + prevState
                                                                ].join(""));
                                                            });
                                                            return [2 /*return*/, evtPushNotificationToken.state];
                                                    }
                                                });
                                            }); })()];
                                    case 1:
                                        pushNotificationToken = _b.sent();
                                        _a = pushNotificationToken;
                                        return [4 /*yield*/, declaredPushNotificationToken.get()];
                                    case 2:
                                        if (_a === (_b.sent())) {
                                            return [2 /*return*/];
                                        }
                                        log("Declaring UA");
                                        return [4 /*yield*/, webApi.declareUa({
                                                "assertJsRuntimeEnv": params.assertJsRuntimeEnv,
                                                "platform": env_1.env.hostOs,
                                                pushNotificationToken: pushNotificationToken
                                            })];
                                    case 3:
                                        _b.sent();
                                        return [4 /*yield*/, declaredPushNotificationToken.set(pushNotificationToken)];
                                    case 4:
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
                    _g.sent();
                    return [4 /*yield*/, minimalLaunch_1.minimalLaunch((function () {
                            var common_ = {
                                restartApp: restartApp_1.restartApp,
                                dialogApi: dialog_1.dialogApi,
                                startMultiDialogProcess: dialog_1.startMultiDialogProcess,
                                networkStateMonitoringApi: networkStateMonitoringApi,
                                tryLoginWithStoredCredentialIfNotAlreadyLogedIn: tryLoginWithStoredCredentialIfNotAlreadyLogedIn,
                                AuthenticatedSessionDescriptorSharedData: AuthenticatedSessionDescriptorSharedData_1.AuthenticatedSessionDescriptorSharedData,
                                "requestTurnCred": true
                            };
                            switch (params.assertJsRuntimeEnv) {
                                case "browser": return id_1.id(__assign({ "assertJsRuntimeEnv": params.assertJsRuntimeEnv }, common_));
                                case "react-native": return id_1.id(__assign({ "assertJsRuntimeEnv": params.assertJsRuntimeEnv, "notConnectedUserFeedback": params.notConnectedUserFeedback }, common_));
                            }
                        })())];
                case 5:
                    _f = _g.sent(), getWdApiFactory = _f.getWdApiFactory, connectionApi = _f.connectionApi, coreApi = _f.coreApi, readyToDisplayUnsolicitedDialogs = _f.readyToDisplayUnsolicitedDialogs, userSims = _f.userSims, userSimEvts = _f.userSimEvts;
                    prReadyToDisplayUnsolicitedDialogs.then(function () { return readyToDisplayUnsolicitedDialogs(); });
                    {
                        userSimEvts.evtNew.attachOnce(function (_a) {
                            var cause = _a.cause;
                            return cause === "SIM REGISTERED FROM LAN";
                        }, function () { return restartApp_1.restartApp("Sim registered from lan"); });
                        userSimEvts.evtNowConfirmed.attachOnce(function () { return restartApp_1.restartApp("Sim is now confirmed"); });
                        userSimEvts.evtDelete.attachOnce(function (_a) {
                            var cause = _a.cause;
                            return (cause === "PERMISSION LOSS" ||
                                cause === "USER UNREGISTER SIM");
                        }, function (_a) {
                            var cause = _a.cause;
                            return restartApp_1.restartApp("Usable sim removed from set: " + cause);
                        });
                        if (params.assertJsRuntimeEnv === "react-native") {
                            userSimEvts.evtFriendlyNameChange.attachOnce(function () { return restartApp_1.restartApp("Sim friendlyName change"); });
                        }
                    }
                    usableOnly = types.UserSim.Usable.Evts.build({ userSims: userSims, userSimEvts: userSimEvts });
                    return [2 /*return*/, {
                            "accountManagementApi": __assign(__assign({ email: email }, usableOnly), { coreApi: coreApi,
                                webApi: webApi }),
                            "getWebphones": function (_a) {
                                var phoneCallUiCreateFactory = _a.phoneCallUiCreateFactory;
                                return __awaiter(_this, void 0, void 0, function () {
                                    var createWebphone, _b, _c, _d;
                                    return __generator(this, function (_e) {
                                        switch (_e.label) {
                                            case 0:
                                                _b = createWebphoneFactory_1.createWebphoneFactory;
                                                _c = {
                                                    "createSipUserAgent": createSipUserAgentFactory_1.createSipUserAgentFactory({
                                                        email: email,
                                                        uaInstanceId: uaInstanceId,
                                                        "cryptoRelatedParams": paramsNeededToInstantiateUa,
                                                        "pushNotificationToken": pushNotificationToken !== null && pushNotificationToken !== void 0 ? pushNotificationToken : "",
                                                        connectionApi: connectionApi,
                                                        userSimEvts: userSimEvts
                                                    }),
                                                    "getWdApi": getWdApiFactory({
                                                        "encryptorDecryptor": paramsNeededToEncryptDecryptWebphoneData.encryptorDecryptor,
                                                        "userEmail": email
                                                    })
                                                };
                                                _d = "phoneCallUiCreate";
                                                return [4 /*yield*/, phoneCallUiCreateFactory({
                                                        "sims": userSims.map(function (userSim) { return ({
                                                            "imsi": userSim.sim.imsi,
                                                            "friendlyName": userSim.friendlyName,
                                                            "phoneNumber": (function () {
                                                                var _a;
                                                                var number = userSim.sim.storage.number;
                                                                return number !== undefined ? lib_1.phoneNumber.build(number, (_a = userSim.sim.country) === null || _a === void 0 ? void 0 : _a.iso) : undefined;
                                                            })(),
                                                            "serviceProvider": (function () {
                                                                var _a;
                                                                var _b = userSim.sim.serviceProvider, fromImsi = _b.fromImsi, fromNetwork = _b.fromNetwork;
                                                                return (_a = fromImsi !== null && fromImsi !== void 0 ? fromImsi : fromNetwork) !== null && _a !== void 0 ? _a : "";
                                                            })()
                                                        }); })
                                                    })];
                                            case 1:
                                                createWebphone = _b.apply(void 0, [(_c[_d] = _e.sent(),
                                                        _c["userSimEvts"] = usableOnly.userSimEvts,
                                                        _c.coreApi = coreApi,
                                                        _c)]);
                                                return [2 /*return*/, Promise.all(usableOnly.userSims.map(createWebphone)).then(function (webphones) { return webphones.sort(Webphone_1.Webphone.sortPuttingFirstTheOneThatWasLastUsed); })];
                                        }
                                    });
                                });
                            }
                        }];
            }
        });
    });
}

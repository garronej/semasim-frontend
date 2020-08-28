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
Object.defineProperty(exports, "__esModule", { value: true });
exports.managerPageLaunch = void 0;
var restartApp_1 = require("../restartApp");
var dialog_1 = require("../../tools/modal/dialog");
var networkStateMonitoring = require("../networkStateMonitoring");
var tryLoginWithStoredCredentialIfNotAlreadyLogedInFactory_1 = require("../tryLoginWithStoredCredentialIfNotAlreadyLogedInFactory");
var AuthenticatedSessionDescriptorSharedData_1 = require("../localStorage/AuthenticatedSessionDescriptorSharedData");
var webApiCaller_1 = require("../webApiCaller");
var assert_1 = require("../../tools/typeSafety/assert");
var env_1 = require("../env");
var minimalLaunch_1 = require("./minimalLaunch");
var modal_1 = require("../../tools/modal");
var types = require("../types");
function managerPageLaunch(params) {
    var _this = this;
    assert_1.assert(params.assertJsRuntimeEnv === env_1.env.jsRuntimeEnv);
    return {
        dialogApi: dialog_1.dialogApi,
        startMultiDialogProcess: dialog_1.startMultiDialogProcess,
        createModal: modal_1.createModal,
        "prReadyToAuthenticateStep": (function () { return __awaiter(_this, void 0, void 0, function () {
            var networkStateMonitoringApi, webApi, tryLoginWithStoredCredentialIfNotAlreadyLogedIn;
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
                            return __assign(__assign({}, rest), getLoginLogoutApi({ "assertJsRuntimeEnv": params.assertJsRuntimeEnv }));
                        })();
                        tryLoginWithStoredCredentialIfNotAlreadyLogedIn = tryLoginWithStoredCredentialIfNotAlreadyLogedInFactory_1.tryLoginWithStoredCredentialIfNotAlreadyLogedInFactory({
                            "assertJsRuntimeEnv": "browser",
                            webApi: webApi
                        });
                        return [2 /*return*/, {
                                "loginUser": webApi.loginUser,
                                "prAccountManagementApi": (function () { return __awaiter(_this, void 0, void 0, function () {
                                    return __generator(this, function (_a) {
                                        switch (_a.label) {
                                            case 0: return [4 /*yield*/, tryLoginWithStoredCredentialIfNotAlreadyLogedIn()];
                                            case 1:
                                                if (!((_a.sent()) === "NO VALID CREDENTIALS")) return [3 /*break*/, 3];
                                                return [4 /*yield*/, AuthenticatedSessionDescriptorSharedData_1.AuthenticatedSessionDescriptorSharedData.evtChange
                                                        .waitFor(function (authenticatedSessionDescriptorSharedData) {
                                                        return !!authenticatedSessionDescriptorSharedData;
                                                    })];
                                            case 2:
                                                _a.sent();
                                                _a.label = 3;
                                            case 3: return [2 /*return*/, onceLoggedIn({
                                                    networkStateMonitoringApi: networkStateMonitoringApi,
                                                    tryLoginWithStoredCredentialIfNotAlreadyLogedIn: tryLoginWithStoredCredentialIfNotAlreadyLogedIn,
                                                    webApi: webApi
                                                })];
                                        }
                                    });
                                }); })()
                            }];
                }
            });
        }); })()
    };
}
exports.managerPageLaunch = managerPageLaunch;
function onceLoggedIn(params) {
    return __awaiter(this, void 0, void 0, function () {
        var networkStateMonitoringApi, tryLoginWithStoredCredentialIfNotAlreadyLogedIn, webApi, _a, coreApi, readyToDisplayUnsolicitedDialogs, userSims, userSimEvts, _b, _c;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    networkStateMonitoringApi = params.networkStateMonitoringApi, tryLoginWithStoredCredentialIfNotAlreadyLogedIn = params.tryLoginWithStoredCredentialIfNotAlreadyLogedIn, webApi = params.webApi;
                    return [4 /*yield*/, minimalLaunch_1.minimalLaunch({
                            "assertJsRuntimeEnv": "browser",
                            restartApp: restartApp_1.restartApp,
                            dialogApi: dialog_1.dialogApi, startMultiDialogProcess: dialog_1.startMultiDialogProcess,
                            networkStateMonitoringApi: networkStateMonitoringApi,
                            tryLoginWithStoredCredentialIfNotAlreadyLogedIn: tryLoginWithStoredCredentialIfNotAlreadyLogedIn,
                            AuthenticatedSessionDescriptorSharedData: AuthenticatedSessionDescriptorSharedData_1.AuthenticatedSessionDescriptorSharedData,
                            "requestTurnCred": false
                        })];
                case 1:
                    _a = _d.sent(), coreApi = _a.coreApi, readyToDisplayUnsolicitedDialogs = _a.readyToDisplayUnsolicitedDialogs, userSims = _a.userSims, userSimEvts = _a.userSimEvts;
                    readyToDisplayUnsolicitedDialogs();
                    _b = {};
                    _c = "email";
                    return [4 /*yield*/, AuthenticatedSessionDescriptorSharedData_1.AuthenticatedSessionDescriptorSharedData.get()];
                case 2: return [2 /*return*/, __assign.apply(void 0, [__assign.apply(void 0, [(_b[_c] = (_d.sent()).email, _b), types.UserSim.Usable.Evts.build({ userSims: userSims, userSimEvts: userSimEvts })]), { coreApi: coreApi,
                            webApi: webApi }])];
            }
        });
    });
}

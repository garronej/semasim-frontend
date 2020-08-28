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
exports.minimalLaunch = void 0;
var remoteApiCaller = require("../toBackend/remoteApiCaller");
var connection = require("../toBackend/connection");
var registerInteractiveRemoteNotifyEvtHandlers_1 = require("../registerInteractiveRemoteNotifyEvtHandlers");
var types = require("../types/UserSim");
var assert_1 = require("../../tools/typeSafety/assert");
var env_1 = require("../env");
var Deferred_1 = require("../../tools/Deferred");
/** Assert user logged in ( AuthenticatedSessionDescriptorSharedData.isPresent ) */
function minimalLaunch(params) {
    return __awaiter(this, void 0, void 0, function () {
        var restartApp, dialogApi, startMultiDialogProcess, networkStateMonitoringApi, tryLoginWithStoredCredentialIfNotAlreadyLogedIn, AuthenticatedSessionDescriptorSharedData, requestTurnCred, _a, connectionApi, _b, getCoreApi, getWdApiFactory, coreApi, _c, _d, _e, _f, userSims, userSimEvts, dReadyToDisplayUnsolicitedDialogs;
        return __generator(this, function (_g) {
            switch (_g.label) {
                case 0:
                    restartApp = params.restartApp, dialogApi = params.dialogApi, startMultiDialogProcess = params.startMultiDialogProcess, networkStateMonitoringApi = params.networkStateMonitoringApi, tryLoginWithStoredCredentialIfNotAlreadyLogedIn = params.tryLoginWithStoredCredentialIfNotAlreadyLogedIn, AuthenticatedSessionDescriptorSharedData = params.AuthenticatedSessionDescriptorSharedData, requestTurnCred = params.requestTurnCred;
                    assert_1.assert(params.assertJsRuntimeEnv === env_1.env.jsRuntimeEnv, "Wrong params for js runtime environnement");
                    _a = assert_1.assert;
                    return [4 /*yield*/, AuthenticatedSessionDescriptorSharedData.isPresent()];
                case 1:
                    _a.apply(void 0, [_g.sent()]);
                    connectionApi = connection.connectAndGetApi({
                        requestTurnCred: requestTurnCred,
                        restartApp: restartApp,
                        "notConnectedUserFeedback": params.assertJsRuntimeEnv === "react-native" ?
                            params.notConnectedUserFeedback :
                            (function (state) {
                                //TODO: Maybe restart app here because some unpredictable bug can appear.
                                if (state.isVisible) {
                                    dialogApi.loading(state.message, 1200);
                                }
                                else {
                                    dialogApi.dismissLoading();
                                }
                            }),
                        networkStateMonitoringApi: networkStateMonitoringApi,
                        AuthenticatedSessionDescriptorSharedData: AuthenticatedSessionDescriptorSharedData,
                        tryLoginWithStoredCredentialIfNotAlreadyLogedIn: tryLoginWithStoredCredentialIfNotAlreadyLogedIn
                    });
                    _b = remoteApiCaller.factory({
                        connectionApi: connectionApi,
                        restartApp: restartApp
                    }), getCoreApi = _b.getCoreApi, getWdApiFactory = _b.getWdApiFactory;
                    _c = getCoreApi;
                    _d = {};
                    _e = "userEmail";
                    return [4 /*yield*/, AuthenticatedSessionDescriptorSharedData.get()];
                case 2:
                    coreApi = _c.apply(void 0, [(_d[_e] = (_g.sent()).email,
                            _d)]);
                    return [4 /*yield*/, coreApi.getUserSims({ "includeContacts": true })];
                case 3:
                    _f = _g.sent(), userSims = _f.userSims, userSimEvts = _f.userSimEvts;
                    dReadyToDisplayUnsolicitedDialogs = new Deferred_1.VoidDeferred();
                    registerInteractiveRemoteNotifyEvtHandlers_1.registerInteractiveRemoteNotifyEvtHandlers({
                        "getUsableSimFriendlyNames": function () { return userSims
                            .filter(types.UserSim.Usable.match)
                            .map(function (_a) {
                            var friendlyName = _a.friendlyName;
                            return friendlyName;
                        }); },
                        "sharedNotConfirmedUserSims": userSims
                            .filter(types.UserSim.Shared.NotConfirmed.match),
                        userSimEvts: userSimEvts,
                        "prReadyToDisplayUnsolicitedDialogs": dReadyToDisplayUnsolicitedDialogs.pr,
                        "remoteNotifyEvts": connectionApi.remoteNotifyEvts,
                        coreApi: coreApi,
                        dialogApi: dialogApi,
                        startMultiDialogProcess: startMultiDialogProcess,
                        restartApp: restartApp
                    });
                    return [2 /*return*/, {
                            getWdApiFactory: getWdApiFactory,
                            connectionApi: connectionApi,
                            coreApi: coreApi,
                            "readyToDisplayUnsolicitedDialogs": dReadyToDisplayUnsolicitedDialogs.resolve,
                            userSims: userSims,
                            userSimEvts: userSimEvts
                        }];
            }
        });
    });
}
exports.minimalLaunch = minimalLaunch;

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
exports.tryLoginWithStoredCredentialIfNotAlreadyLogedInFactory = void 0;
var env_1 = require("./env");
var assert_1 = require("../tools/typeSafety/assert");
var prCurrentRequestResult = undefined;
function tryLoginWithStoredCredentialIfNotAlreadyLogedInFactory(params) {
    assert_1.assert(params.assertJsRuntimeEnv === env_1.env.jsRuntimeEnv);
    var WebApiError = params.webApi.WebApiError;
    return function tryLoginWithStoredCredentialIfNotAlreadyLogedIn() {
        if (prCurrentRequestResult !== undefined) {
            return prCurrentRequestResult;
        }
        prCurrentRequestResult = (function callee() {
            return __awaiter(this, void 0, void 0, function () {
                var isUserLoggedIn, error_1, Credentials, _a, email, secret, uaInstanceId, resp_1;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            isUserLoggedIn = void 0;
                            _b.label = 1;
                        case 1:
                            _b.trys.push([1, 3, , 5]);
                            return [4 /*yield*/, params.webApi.isUserLoggedIn({ "shouldThrowOnError": true })];
                        case 2:
                            isUserLoggedIn = _b.sent();
                            return [3 /*break*/, 5];
                        case 3:
                            error_1 = _b.sent();
                            assert_1.assert(error_1 instanceof WebApiError);
                            return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 2000); })];
                        case 4:
                            _b.sent();
                            return [2 /*return*/, callee()];
                        case 5:
                            if (isUserLoggedIn) {
                                return [2 /*return*/, "LOGGED IN"];
                            }
                            if (params.assertJsRuntimeEnv === "browser") {
                                return [2 /*return*/, "NO VALID CREDENTIALS"];
                            }
                            Credentials = params.Credentials;
                            if (env_1.env.jsRuntimeEnv === "browser") {
                                return [2 /*return*/, "NO VALID CREDENTIALS"];
                            }
                            return [4 /*yield*/, Credentials.isPresent()];
                        case 6:
                            if (!(_b.sent())) {
                                return [2 /*return*/, "NO VALID CREDENTIALS"];
                            }
                            return [4 /*yield*/, Credentials.get()];
                        case 7:
                            _a = _b.sent(), email = _a.email, secret = _a.secret, uaInstanceId = _a.uaInstanceId;
                            return [4 /*yield*/, params.webApi.loginUser({
                                    "assertJsRuntimeEnv": "react-native",
                                    email: email,
                                    secret: secret,
                                    uaInstanceId: uaInstanceId,
                                    "shouldThrowOnError": true
                                }).catch(function (error) {
                                    assert_1.assert(error instanceof WebApiError);
                                    return error;
                                })];
                        case 8:
                            resp_1 = _b.sent();
                            if (!(resp_1 instanceof WebApiError)) return [3 /*break*/, 10];
                            return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 2000); })];
                        case 9:
                            _b.sent();
                            return [2 /*return*/, callee()];
                        case 10:
                            if (!(resp_1.status === "RETRY STILL FORBIDDEN")) return [3 /*break*/, 12];
                            //TODO: some log
                            return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, resp_1.retryDelayLeft); })];
                        case 11:
                            //TODO: some log
                            _b.sent();
                            return [2 /*return*/, callee()];
                        case 12:
                            if (!(resp_1.status !== "SUCCESS")) return [3 /*break*/, 14];
                            return [4 /*yield*/, Credentials.remove()];
                        case 13:
                            _b.sent();
                            return [2 /*return*/, "NO VALID CREDENTIALS"];
                        case 14: return [2 /*return*/, "LOGGED IN"];
                    }
                });
            });
        })();
        prCurrentRequestResult.then(function () { return prCurrentRequestResult = undefined; });
        return tryLoginWithStoredCredentialIfNotAlreadyLogedIn();
    };
}
exports.tryLoginWithStoredCredentialIfNotAlreadyLogedInFactory = tryLoginWithStoredCredentialIfNotAlreadyLogedInFactory;

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
exports.dialogApi = exports.startMultiDialogProcess = exports.provideCustomImplementationOfBaseApi = exports.baseTypes = void 0;
var modalStack = require("../stack");
var types = require("./types");
exports.baseTypes = types;
var getApi_1 = require("./getApi");
Object.defineProperty(exports, "provideCustomImplementationOfBaseApi", { enumerable: true, get: function () { return getApi_1.provideCustomImplementationOfApi; } });
var runExclusive = require("run-exclusive");
var noLockDialogApi = (function () {
    var currentLoading = undefined;
    var currentModal = undefined;
    var restoreLoading = undefined;
    var out = {
        "dismissLoading": function () {
            if (!!currentLoading) {
                currentLoading.stop();
                currentLoading = undefined;
            }
            if (!!restoreLoading) {
                restoreLoading = undefined;
            }
        },
        "loading": function (message, delayBeforeShow) {
            if (delayBeforeShow === void 0) { delayBeforeShow = 700; }
            if (!!currentModal) {
                restoreLoading = function () { return out.loading(message, delayBeforeShow); };
                return;
            }
            if (!!currentLoading) {
                delayBeforeShow = 0;
            }
            out.dismissLoading();
            var modal = undefined;
            var timer = setTimeout(function () {
                modal = getApi_1.getApi().createLoading(message);
                modalStack.add(modal).show();
            }, delayBeforeShow);
            currentLoading = {
                "stop": function () { return !!modal ? modal.hide() : clearTimeout(timer); },
                message: message,
                delayBeforeShow: delayBeforeShow
            };
        },
        "create": function (method, options) {
            if (!!currentModal) {
                currentModal.hide();
                return out.create(method, options);
            }
            if (!!currentLoading) {
                var message_1 = currentLoading.message;
                var delayBeforeShow_1 = currentLoading.delayBeforeShow;
                out.dismissLoading();
                restoreLoading = function () { return out.loading(message_1, delayBeforeShow_1); };
            }
            var modal = getApi_1.getApi().create(method, __assign(__assign(__assign({}, options), { "show": false }), ("animate" in options ? ({}) : ({ "animate": false }))));
            modalStack.add(modal).show();
            currentModal = modal;
            modal.evtHide.attachOnce(function () { return currentModal = undefined; });
            modal.evtHidden.attachOnce(function () {
                if (restoreLoading) {
                    restoreLoading();
                }
                modal.removeFromDom();
            });
            return modal.evtHidden.waitFor();
        }
    };
    return out;
})();
var lockFn = runExclusive.build(function (pr) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                if (!pr) {
                    return [2 /*return*/];
                }
                return [4 /*yield*/, pr];
            case 1:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); });
exports.startMultiDialogProcess = function () {
    var prLockAcquired = lockFn();
    var endMultiDialogProcess;
    lockFn(new Promise(function (resolve) { return endMultiDialogProcess = function () {
        dialogApi.dismissLoading();
        resolve();
    }; }));
    var dialogApi = {
        "create": function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            return prLockAcquired.then(function () { return noLockDialogApi.create.apply(noLockDialogApi, __spread(args)); });
        },
        "loading": function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            return prLockAcquired.then(function () { return noLockDialogApi.loading.apply(noLockDialogApi, __spread(args)); });
        },
        "dismissLoading": function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            return prLockAcquired.then(function () { return noLockDialogApi.dismissLoading.apply(noLockDialogApi, __spread(args)); });
        }
    };
    return {
        endMultiDialogProcess: endMultiDialogProcess,
        dialogApi: dialogApi
    };
};
exports.dialogApi = {
    "create": function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        return __awaiter(void 0, void 0, void 0, function () {
            var _a, endMultiDialogProcess, create;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _a = exports.startMultiDialogProcess(), endMultiDialogProcess = _a.endMultiDialogProcess, create = _a.dialogApi.create;
                        return [4 /*yield*/, create.apply(void 0, __spread(args))];
                    case 1:
                        _b.sent();
                        endMultiDialogProcess();
                        return [2 /*return*/];
                }
            });
        });
    },
    "loading": function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        return lockFn().then(function () { return noLockDialogApi.loading.apply(noLockDialogApi, __spread(args)); });
    },
    "dismissLoading": function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        return lockFn().then(function () { return noLockDialogApi.dismissLoading.apply(noLockDialogApi, __spread(args)); });
    }
};

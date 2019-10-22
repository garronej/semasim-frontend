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
var __values = (this && this.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
Object.defineProperty(exports, "__esModule", { value: true });
function getPropertyNames(o) {
    var pSet = new Set();
    var o_ = o;
    while (true) {
        Object.getOwnPropertyNames(o_).forEach(function (p) { return pSet.add(p); });
        o_ = Object.getPrototypeOf(o_);
        if (!o_) {
            break;
        }
    }
    return Array.from(pSet);
}
function logFunctionCall(callExpression, args, out) {
    var extra = {};
    args.forEach(function (value, i) {
        extra["p" + i] = value;
    });
    extra["returns"] = out;
    includeStackTrace(extra);
    console.log(callExpression + "(" + (args.length === 0 ? "" : args.map(function (_value, index) { return "p" + index; }).join(", ")) + ") -> ", extra);
}
function includeStackTrace(obj) {
    var stack = new Error().stack;
    Object.defineProperty(obj, "stackTrace", {
        "enumerable": false,
        "get": function () {
            var arr = stack.split("\n");
            for (var i = 1; i <= 4; i++) {
                arr.shift();
            }
            var out = arr.join("\n");
            console.log(out);
            return out;
        }
    });
}
var functionProxies = new WeakMap();
function observeObjectProperty(o, p, interceptOutput) {
    var objName = (function (str) { return str.charAt(0).toLowerCase() + str.slice(1); })(Object.getPrototypeOf(o).constructor.name);
    var propertyDescriptor = (function () {
        var propertyDescriptor = (function () {
            var pd = undefined;
            var o_ = o;
            while (pd === undefined) {
                pd = Object.getOwnPropertyDescriptor(o_, p);
                o_ = Object.getPrototypeOf(o_);
                if (!o_) {
                    break;
                }
            }
            return pd;
        })();
        if (propertyDescriptor === undefined) {
            throw new Error("No property " + String(p) + " on obj");
        }
        if (!propertyDescriptor.configurable) {
            throw new Error("Property " + String(p) + " of " + objName + " will not be observed (not configurable)");
        }
        var logAccess = function (type, value) {
            return console.log(objName + "." + String(p) + " " + (type === "GET" ? "->" : "<-"), (function () {
                var valueAndTrace = { value: value };
                includeStackTrace(valueAndTrace);
                return valueAndTrace;
            })());
        };
        return {
            "enumerable": propertyDescriptor.enumerable,
            "configurable": true,
            "get": function () {
                var e_1, _a, e_2, _b;
                var value = "value" in propertyDescriptor ?
                    propertyDescriptor.value :
                    propertyDescriptor.get.apply(o);
                if (value instanceof Function) {
                    if (functionProxies.has(value)) {
                        return functionProxies.get(value);
                    }
                    if (!value.name) {
                        Object.defineProperty(value, "name", __assign(__assign({}, Object.getOwnPropertyDescriptor(value, "name")), { "value": String(p) }));
                    }
                    var valueProxy = function valueProxy() {
                        var _newTarget = this && this instanceof valueProxy ? this.constructor : void 0;
                        var args = [];
                        for (var _i = 0; _i < arguments.length; _i++) {
                            args[_i] = arguments[_i];
                        }
                        var binded = Function.prototype.bind.apply(value, __spread([!!_newTarget ? null : this], args));
                        var out = !!_newTarget ? new binded() : binded();
                        if (!!interceptOutput) {
                            interceptOutput(out);
                        }
                        observe(out);
                        logFunctionCall("" + (!!_newTarget ? "new " : objName + ".") + String(p), args, out);
                        return out;
                    };
                    Object.defineProperty(valueProxy, "name", __assign(__assign({}, Object.getOwnPropertyDescriptor(value, "name")), { "value": value.name }));
                    {
                        var prototype = value.prototype;
                        if (!!prototype) {
                            try {
                                for (var _c = __values(__spread(Object.getOwnPropertyNames(prototype), Object.getOwnPropertySymbols(prototype))), _d = _c.next(); !_d.done; _d = _c.next()) {
                                    var propertyName = _d.value;
                                    Object.defineProperty(valueProxy.prototype, propertyName, Object.getOwnPropertyDescriptor(prototype, propertyName));
                                }
                            }
                            catch (e_1_1) { e_1 = { error: e_1_1 }; }
                            finally {
                                try {
                                    if (_d && !_d.done && (_a = _c.return)) _a.call(_c);
                                }
                                finally { if (e_1) throw e_1.error; }
                            }
                        }
                    }
                    var _loop_1 = function (p_1) {
                        var pd = Object.getOwnPropertyDescriptor(value, p_1);
                        if ("value" in pd && pd.value instanceof Function) {
                            Object.defineProperty(valueProxy, p_1, __assign(__assign({}, pd), { "value": (function () {
                                    var f = pd.value;
                                    var f_ = function () {
                                        var args = [];
                                        for (var _i = 0; _i < arguments.length; _i++) {
                                            args[_i] = arguments[_i];
                                        }
                                        var out = f.apply(value, args);
                                        logFunctionCall(value.name + "." + String(p_1), args, out);
                                        return out;
                                    };
                                    Object.defineProperty(f_, "name", __assign(__assign({}, Object.getOwnPropertyDescriptor(f, "name")), { "value": f.name }));
                                    return f_;
                                })() }));
                        }
                    };
                    try {
                        for (var _e = __values(Object.getOwnPropertyNames(value)), _f = _e.next(); !_f.done; _f = _e.next()) {
                            var p_1 = _f.value;
                            _loop_1(p_1);
                        }
                    }
                    catch (e_2_1) { e_2 = { error: e_2_1 }; }
                    finally {
                        try {
                            if (_f && !_f.done && (_b = _e.return)) _b.call(_e);
                        }
                        finally { if (e_2) throw e_2.error; }
                    }
                    functionProxies.set(value, valueProxy);
                    return valueProxy;
                }
                else {
                    logAccess("GET", value);
                    observe(value);
                    return value;
                }
            },
            "set": function (value) {
                logAccess("SET", value);
                return "value" in propertyDescriptor ?
                    propertyDescriptor.value = value :
                    propertyDescriptor.set.apply(o, value);
            }
        };
    })();
    Object.defineProperty(o, p, propertyDescriptor);
}
exports.observeObjectProperty = observeObjectProperty;
var observedObjects = new WeakSet();
function observeObject(o) {
    var e_3, _a;
    if (o instanceof Function) {
        throw new Error("cannot observe function");
    }
    if (!(o instanceof Object)) {
        throw new Error("not an object, cannot observe");
    }
    if (Object.getPrototypeOf(o).constructor.name === "Promise") {
        throw new Error("should not observe Promise");
    }
    if (observedObjects.has(o)) {
        return;
    }
    observedObjects.add(o);
    try {
        for (var _b = __values(getPropertyNames(o)), _c = _b.next(); !_c.done; _c = _b.next()) {
            var p = _c.value;
            try {
                observeObjectProperty(o, p);
            }
            catch (error) {
                console.log("WARNING: " + error.message);
            }
        }
    }
    catch (e_3_1) { e_3 = { error: e_3_1 }; }
    finally {
        try {
            if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
        }
        finally { if (e_3) throw e_3.error; }
    }
}
function observe(o) {
    var then = function (o) {
        if (o instanceof Function) {
            console.log("===========>warning, function not observed", o);
            return;
        }
        if (!(o instanceof Object)) {
            return;
        }
        observeObject(o);
    };
    if (o instanceof Object && Object.getPrototypeOf(o).constructor.name === "Promise") {
        o.then(function (o) { return then(o); });
    }
    else {
        then(o);
    }
}
/** will observe getUserMedia and RTCPeerConnection */
function observeWebRTC() {
    observeObjectProperty(navigator.mediaDevices, "getUserMedia");
    observeObjectProperty(window, "RTCPeerConnection", function (rtcPeerConnection) {
        console.log(rtcPeerConnection);
        if (!!rtcPeerConnection.getStats) {
            setTimeout(function () {
                rtcPeerConnection.getStats().then(function (stats) {
                    var arr = [];
                    stats.forEach(function (o) {
                        console.log(JSON.stringify(o));
                        arr.push(o);
                    });
                    console.log("<======>");
                    console.log(JSON.stringify(arr));
                });
            }, 20000);
        }
        var addEventListenerBackup = rtcPeerConnection.addEventListener, removeEventListenerBackup = rtcPeerConnection.removeEventListener;
        var proxyByOriginal = new WeakMap();
        Object.defineProperties(rtcPeerConnection, {
            "addEventListener": {
                "configurable": true,
                "enumerable": true,
                "value": function addEventListener(type, listener) {
                    var listenerProxy = function () {
                        var args = [];
                        for (var _i = 0; _i < arguments.length; _i++) {
                            args[_i] = arguments[_i];
                        }
                        console.log("RTCPeerConnectionEvent: \"" + type + "\"", args);
                        return listener.apply(rtcPeerConnection, args);
                    };
                    proxyByOriginal.set(listener, listenerProxy);
                    return addEventListenerBackup.call(rtcPeerConnection, type, listenerProxy);
                }
            },
            "removeEventListener": {
                "configurable": true,
                "enumerable": true,
                "value": function removeEventListener(type, listener) {
                    return removeEventListenerBackup.call(rtcPeerConnection, type, proxyByOriginal.get(listener));
                }
            }
        });
    });
}
exports.observeWebRTC = observeWebRTC;

"use strict";
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
var __values = (this && this.__values) || function (o) {
    var m = typeof Symbol === "function" && o[Symbol.iterator], i = 0;
    if (m) return m.call(o);
    return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
};
Object.defineProperty(exports, "__esModule", { value: true });
var e_1, _a, e_2, _b, e_3, _c;
var ttTesting = require("transfer-tools/dist/lib/testing");
var BufferNodePd = Object.getOwnPropertyDescriptor(global, "Buffer");
if (BufferNodePd !== undefined) {
    var BufferNode_1 = BufferNodePd.value;
    if (BufferNode_1 === Buffer) {
        throw new Error("Same buffer implementation");
    }
    {
        console.log("test double encode");
        var doubleEncode = function (text) {
            var encode = function (text) { return BufferNode_1.from(text, "utf8").toString("binary"); };
            var oneEncode = encode(text);
            var twoEncode = encode(oneEncode);
            /*
            if( oneEncode !== twoEncode ){
                throw new Error("no it ain't so!");
            }
            */
            return twoEncode;
        };
        var doubleDecode = function (data) { return BufferNode_1.from(BufferNode_1.from(data, "binary").toString("utf8"), "binary").toString("utf8"); };
        for (var i = 1; i <= 100; i++) {
            var text = ttTesting.genUtf8Str(100);
            if (doubleDecode(doubleEncode(text)) !== text) {
                throw new Error("no it does not work like that");
            }
        }
        console.log("PASS test double encode");
    }
    require((function () { return "fs"; })()).writeFileSync(require("path").join(".", "res", "encoding_samples.json"), BufferNode_1.from(JSON.stringify((new Array(1000)).fill("")
        .map(function () { return ttTesting.genUtf8Str(60); })
        .map(function (text) {
        var buffer = BufferNode_1.from(text, "utf8");
        return {
            text: text,
            "hex": buffer.toString("hex"),
            "base64": buffer.toString("base64"),
            "binary": buffer.toString("binary")
        };
    })), "utf8"));
    var _loop_1 = function (encoding) {
        console.log({ encoding: encoding });
        var _loop_2 = function (i) {
            var text = ttTesting.genUtf8Str(90);
            if (JSON.parse(JSON.stringify(text)) !== text) {
                throw new Error("stringify | parse error");
            }
            var _a = __read([BufferNode_1, Buffer]
                .map(function (BufferImpl) { return BufferImpl.from(text, "utf8").toString(encoding); }), 2), got = _a[0], expected = _a[1];
            if (got !== expected) {
                console.log({ got: got, expected: expected });
                throw new Error("FAIL");
            }
            var _b = __read([BufferNode_1, Buffer]
                .map(function (BufferImpl) { return BufferImpl.from(expected, encoding).toString("utf8"); }), 2), textGot = _b[0], textExpected = _b[1];
            if (textExpected !== text) {
                throw new Error("native node Buffer Impl error");
            }
            if (textGot !== text) {
                console.log({ got: got, expected: expected });
                throw new Error("FAIL to restore string");
            }
        };
        for (var i = 1; i < 100; i++) {
            _loop_2(i);
        }
    };
    try {
        for (var _d = __values(["hex", "binary", "base64"]), _e = _d.next(); !_e.done; _e = _d.next()) {
            var encoding = _e.value;
            _loop_1(encoding);
        }
    }
    catch (e_1_1) { e_1 = { error: e_1_1 }; }
    finally {
        try {
            if (_e && !_e.done && (_a = _d.return)) _a.call(_d);
        }
        finally { if (e_1) throw e_1.error; }
    }
    console.log("PASS test node buffer");
}
else {
    var arr = require("../../res/encoding_samples.json");
    if (arr.length === 0) {
        throw new Error("generate samples first");
    }
    try {
        for (var arr_1 = __values(arr), arr_1_1 = arr_1.next(); !arr_1_1.done; arr_1_1 = arr_1.next()) {
            var entry = arr_1_1.value;
            var buff = Buffer.from(entry.text, "utf8");
            try {
                for (var _f = __values(["base64", "binary", "hex"]), _g = _f.next(); !_g.done; _g = _f.next()) {
                    var enc = _g.value;
                    if (entry[enc] !== buff.toString(enc)) {
                        throw new Error("failed encode to " + enc + ", data: " + entry.hex);
                    }
                    if (Buffer.from(entry[enc], enc).toString("utf8") !== entry.text) {
                        throw new Error("failed restore from " + enc + ", data: " + entry.hex);
                    }
                }
            }
            catch (e_3_1) { e_3 = { error: e_3_1 }; }
            finally {
                try {
                    if (_g && !_g.done && (_c = _f.return)) _c.call(_f);
                }
                finally { if (e_3) throw e_3.error; }
            }
        }
    }
    catch (e_2_1) { e_2 = { error: e_2_1 }; }
    finally {
        try {
            if (arr_1_1 && !arr_1_1.done && (_b = arr_1.return)) _b.call(arr_1);
        }
        finally { if (e_2) throw e_2.error; }
    }
    console.log("PASS. Node buffer and browser buffer are the same");
}

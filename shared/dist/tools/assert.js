"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
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
function assert(condition, msg) {
    if (!condition) {
        throw new assert.AssertError(msg);
    }
}
exports.assert = assert;
(function (assert) {
    var AssertError = /** @class */ (function (_super) {
        __extends(AssertError, _super);
        function AssertError(msg) {
            var _newTarget = this.constructor;
            var _this = _super.call(this, __spread([
                "Wrong assertion"
            ], (msg !== undefined ? [msg] : [])).join(": ")) || this;
            Object.setPrototypeOf(_this, _newTarget.prototype);
            return _this;
        }
        return AssertError;
    }(Error));
    assert.AssertError = AssertError;
})(assert = exports.assert || (exports.assert = {}));
/*
(()=>{

    const x: number | string = null as any;

    assert(typeof x === "number");

    x;

    const y: {
        type: "A";
    } | {
        type: "B";
        p: number;
    }= null as any;

    assert( y.type === "B");

    y.p

})();
*/

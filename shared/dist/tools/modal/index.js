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
Object.defineProperty(exports, "__esModule", { value: true });
exports.createModal = void 0;
var getApi_1 = require("./getApi");
var stack = require("./stack");
var getApi_2 = require("./getApi");
Object.defineProperty(exports, "provideCustomImplementationOfApi", { enumerable: true, get: function () { return getApi_2.provideCustomImplementationOfApi; } });
function createModal(structure, options) {
    var modal = getApi_1.getApi().create(structure, __assign(__assign({}, options), { "show": false }));
    return stack.add(modal);
}
exports.createModal = createModal;

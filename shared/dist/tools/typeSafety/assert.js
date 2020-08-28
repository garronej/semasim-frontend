"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assert = void 0;
function assert(condition, msg) {
    if (!condition) {
        throw new Error(msg);
    }
}
exports.assert = assert;

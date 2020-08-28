"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createObjectWithGivenRef = void 0;
require("minimal-polyfills/Object.assign");
/** changeRef(ref, o) === ref */
function createObjectWithGivenRef(ref, o) {
    Object.keys(ref).forEach(function (key) { delete ref[key]; });
    Object.assign(ref, o);
    return ref;
}
exports.createObjectWithGivenRef = createObjectWithGivenRef;

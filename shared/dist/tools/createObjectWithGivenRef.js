"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("minimal-polyfills/dist/lib/Object.assign");
/** changeRef(ref, o) === ref */
function createObjectWithGivenRef(ref, o) {
    Object.keys(ref).forEach(function (key) { delete ref[key]; });
    Object.assign(ref, o);
    return ref;
}
exports.createObjectWithGivenRef = createObjectWithGivenRef;

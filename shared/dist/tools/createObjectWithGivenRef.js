"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/** changeRef(ref, o) === ref */
function createObjectWithGivenRef(ref, o) {
    Object.keys(ref).forEach(function (key) { delete ref[key]; });
    Object.assign(ref, o);
    return ref;
}
exports.createObjectWithGivenRef = createObjectWithGivenRef;

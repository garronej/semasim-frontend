"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isForWeb = exports.isAscendingAlphabeticalOrder = void 0;
function isAscendingAlphabeticalOrder(a, b) {
    if (!a || !b) {
        return a.length < b.length;
    }
    var getWeight = function (str) {
        var val = str.charAt(0).toLowerCase().charCodeAt(0);
        if (!(96 < val && val < 123)) {
            return 123;
        }
        return val;
    };
    var vA = getWeight(a);
    var vB = getWeight(b);
    if (vA === vB) {
        return isAscendingAlphabeticalOrder(a.substr(1), b.substr(1));
    }
    return vA < vB;
}
exports.isAscendingAlphabeticalOrder = isAscendingAlphabeticalOrder;
exports.isForWeb = true;

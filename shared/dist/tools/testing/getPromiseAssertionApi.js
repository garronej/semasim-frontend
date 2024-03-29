"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPromiseAssertionApi = void 0;
var typeSafety_1 = require("../typeSafety");
var inDepthComparison_1 = require("../inDepthComparison");
function getPromiseAssertionApi(params) {
    var areEquals = params === undefined ?
        function (o1, o2) { return o1 === o2; } :
        inDepthComparison_1.representsSameDataFactory({
            "takeIntoAccountArraysOrdering": params.takeIntoAccountArraysOrdering
        }).representsSameData;
    function mustResolve(params) {
        var _a;
        var timer = setTimeout(function () { return typeSafety_1.assert(false, "did not resolve in time"); }, (_a = params.delay) !== null && _a !== void 0 ? _a : 0);
        return params.promise.then(function (data) {
            clearTimeout(timer);
            if (!("expectedData" in params)) {
                return data;
            }
            typeSafety_1.assert(areEquals(data, params.expectedData), "Not equals expected value");
            return data;
        });
    }
    /** Must reject within delay ms*/
    function mustReject(params) {
        var _a;
        var timer = setTimeout(function () { return typeSafety_1.assert(false, "did not reject in time"); }, (_a = params.delay) !== null && _a !== void 0 ? _a : 0);
        return params.promise.then(function () { return typeSafety_1.assert(false, "resolved"); }, function (error) {
            clearTimeout(timer);
            if ("expectedRejectedValue" in params) {
                typeSafety_1.assert(areEquals(error, params.expectedRejectedValue));
            }
        });
    }
    function mustStayPending(p) {
        p
            .then(function () { return typeSafety_1.assert(false, "Has fulfilled"); }, function () { return typeSafety_1.assert(false, "has rejected"); });
    }
    return { mustResolve: mustResolve, mustReject: mustReject, mustStayPending: mustStayPending };
}
exports.getPromiseAssertionApi = getPromiseAssertionApi;

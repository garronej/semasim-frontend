"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function buildUrl(urlPath, params) {
    return urlPath + "?" + Object.keys(params)
        .filter(function (key) { return params[key] !== undefined; })
        .map(function (key) { return key + "=" + encodeURIComponent(params[key]); })
        .join("&");
}
exports.buildUrl = buildUrl;
function parseUrl(url) {
    if (url === void 0) { url = location.href; }
    var sPageURL = url.split("?")[1];
    if (sPageURL === undefined) {
        return {};
    }
    var sURLVariables = sPageURL.split("&");
    var out = {};
    for (var i = 0; i < sURLVariables.length; i++) {
        var sParameterName = sURLVariables[i].split("=");
        out[sParameterName[0]] = decodeURIComponent(sParameterName[1]);
    }
    return out;
}
exports.parseUrl = parseUrl;

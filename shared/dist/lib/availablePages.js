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
Object.defineProperty(exports, "__esModule", { value: true });
var PageName;
(function (PageName) {
    var _a;
    PageName.pagesNames = [
        "login",
        "register",
        "manager",
        "webphone",
        "subscription",
        "shop",
        "webviewphone"
    ];
    _a = __read(PageName.pagesNames, 7), PageName.login = _a[0], PageName.register = _a[1], PageName.manager = _a[2], PageName.webphone = _a[3], PageName.subscription = _a[4], PageName.shop = _a[5], PageName.webviewphone = _a[6];
})(PageName = exports.PageName || (exports.PageName = {}));

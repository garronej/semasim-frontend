"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __values = (this && this.__values) || function (o) {
    var m = typeof Symbol === "function" && o[Symbol.iterator], i = 0;
    if (m) return m.call(o);
    return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.data = require("../../res/currency.json");
function isValidCountryIso(countryIso) {
    //NOTE: Avoid loading if we do not need
    if (isValidCountryIso.countryIsoRecord === undefined) {
        isValidCountryIso.countryIsoRecord = (function () {
            var e_1, _a, e_2, _b;
            var out = {};
            try {
                for (var _c = __values(Object.keys(exports.data)), _d = _c.next(); !_d.done; _d = _c.next()) {
                    var currency = _d.value;
                    try {
                        for (var _e = __values(exports.data[currency].countriesIso), _f = _e.next(); !_f.done; _f = _e.next()) {
                            var countryIso_1 = _f.value;
                            out[countryIso_1] = true;
                        }
                    }
                    catch (e_2_1) { e_2 = { error: e_2_1 }; }
                    finally {
                        try {
                            if (_f && !_f.done && (_b = _e.return)) _b.call(_e);
                        }
                        finally { if (e_2) throw e_2.error; }
                    }
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (_d && !_d.done && (_a = _c.return)) _a.call(_c);
                }
                finally { if (e_1) throw e_1.error; }
            }
            return out;
        })();
        return isValidCountryIso(countryIso);
    }
    if (typeof countryIso !== "string" || !/^[a-z]{2}$/.test(countryIso)) {
        return false;
    }
    return !!isValidCountryIso.countryIsoRecord[countryIso];
}
exports.isValidCountryIso = isValidCountryIso;
(function (isValidCountryIso) {
    isValidCountryIso.countryIsoRecord = undefined;
})(isValidCountryIso = exports.isValidCountryIso || (exports.isValidCountryIso = {}));
function getCountryCurrency(countryIso) {
    var cache = getCountryCurrency.cache;
    {
        var currency = cache[countryIso];
        if (currency !== undefined) {
            return currency;
        }
    }
    cache[countryIso] = Object.keys(exports.data)
        .map(function (currency) { return ({ currency: currency, "countriesIso": exports.data[currency].countriesIso }); })
        .find(function (_a) {
        var countriesIso = _a.countriesIso;
        return !!countriesIso.find(function (_countryIso) { return _countryIso === countryIso; });
    })
        .currency;
    return getCountryCurrency(countryIso);
}
exports.getCountryCurrency = getCountryCurrency;
(function (getCountryCurrency) {
    getCountryCurrency.cache = {};
})(getCountryCurrency = exports.getCountryCurrency || (exports.getCountryCurrency = {}));
/** Must define convertFromEuro.changeRates first */
function convertFromEuro(euroAmount, currencyTo) {
    return Math.round(euroAmount * convertFromEuro.getChangeRates()[currencyTo]);
}
exports.convertFromEuro = convertFromEuro;
(function (convertFromEuro) {
    var changeRates_ = undefined;
    var lastUpdateDate = new Date(0);
    function setChangeRates(changeRates) {
        lastUpdateDate = new Date();
        changeRates_ = changeRates;
    }
    convertFromEuro.setChangeRates = setChangeRates;
    function getChangeRates() {
        if (changeRates_ === undefined) {
            throw new Error("Change rates not defined");
        }
        return changeRates_;
    }
    convertFromEuro.getChangeRates = getChangeRates;
    var updater = undefined;
    function setChangeRatesFetchMethod(fetchChangeRates, ttl) {
        updater = { fetchChangeRates: fetchChangeRates, ttl: ttl };
    }
    convertFromEuro.setChangeRatesFetchMethod = setChangeRatesFetchMethod;
    function refreshChangeRates() {
        return __awaiter(this, void 0, void 0, function () {
            var _a, error_1;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (updater === undefined) {
                            throw new Error("No method for updating rates changes have been defined");
                        }
                        if (Date.now() - lastUpdateDate.getTime() < updater.ttl) {
                            return [2 /*return*/];
                        }
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 3, , 4]);
                        _a = setChangeRates;
                        return [4 /*yield*/, updater.fetchChangeRates()];
                    case 2:
                        _a.apply(void 0, [_b.sent()]);
                        return [3 /*break*/, 4];
                    case 3:
                        error_1 = _b.sent();
                        if (lastUpdateDate.getTime() === 0) {
                            throw error_1;
                        }
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    }
    convertFromEuro.refreshChangeRates = refreshChangeRates;
})(convertFromEuro = exports.convertFromEuro || (exports.convertFromEuro = {}));
/**
 * get currency of stripe card,
 * if there is no special pricing for the currency
 * "eur" will be returned.
 *
 * NOTE: This function does seems to come out of left field
 * but this operation is done on the frontend and the backend
 * so we export it.
 *
 */
function getCardCurrency(stripeCard, pricingByCurrency) {
    var currency = getCountryCurrency(stripeCard.country.toLowerCase());
    if (!(currency in pricingByCurrency)) {
        currency = "eur";
    }
    return currency;
}
exports.getCardCurrency = getCardCurrency;
function prettyPrint(amount, currency) {
    return (amount / 100).toLocaleString(undefined, {
        "style": "currency",
        currency: currency
    });
}
exports.prettyPrint = prettyPrint;

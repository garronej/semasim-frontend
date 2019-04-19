"use strict";
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
exports.data = require("../../../res/currency.json");
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
/** Must define convertFromEuro.changeRate first */
function convertFromEuro(euroAmount, currencyTo) {
    var changeRates = convertFromEuro.changeRates;
    if (changeRates === undefined) {
        throw new Error("Changes rates have not been defined");
    }
    return Math.round(euroAmount * changeRates[currencyTo]);
}
exports.convertFromEuro = convertFromEuro;
(function (convertFromEuro) {
    convertFromEuro.changeRates = undefined;
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

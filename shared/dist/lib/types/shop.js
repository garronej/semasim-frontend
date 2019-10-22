"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
var __spread = (this && this.__spread) || function () {
    for (var ar = [], i = 0; i < arguments.length; i++) ar = ar.concat(__read(arguments[i]));
    return ar;
};
var __values = (this && this.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
Object.defineProperty(exports, "__esModule", { value: true });
var currencyLib = require("../../tools/currency");
var Cart;
(function (Cart) {
    function getPrice(cart, convertFromEuro) {
        var out = cart
            .map(function (_a) {
            var price = _a.product.price, quantity = _a.quantity;
            return Price.operation(price, function (amount) { return amount * quantity; });
        })
            .reduce(function (out, price) { return Price.addition(out, price, convertFromEuro); }, { "eur": 0 });
        //console.log("Cart.getGoodsPrice: ", JSON.stringify({ cart, out }, null, 2));
        return out;
    }
    Cart.getPrice = getPrice;
    function getOverallFootprint(cart) {
        return !!cart.find(function (_a) {
            var product = _a.product;
            return product.footprint === "VOLUME";
        }) ? "VOLUME" : "FLAT";
    }
    Cart.getOverallFootprint = getOverallFootprint;
    function getOverallWeight(cart) {
        return cart.reduce(function (out, _a) {
            var weight = _a.product.weight, quantity = _a.quantity;
            return out + weight * quantity;
        }, 0);
    }
    Cart.getOverallWeight = getOverallWeight;
})(Cart = exports.Cart || (exports.Cart = {}));
var Price;
(function (Price) {
    /**
     * Out of place.
     * If the amount for a currency is defined in one object
     * but not in the other the undefined amount will be
     * computed from the rateChange
     *
     */
    function binaryOperation(price1, price2, op, convertFromEuro) {
        var e_1, _a, e_2, _b;
        price1 = __assign({}, price1);
        price2 = __assign({}, price2);
        try {
            //NOTE: Ugly but does not involve map and less verbose.
            for (var _c = __values(__spread(Object.keys(price1), Object.keys(price2))), _d = _c.next(); !_d.done; _d = _c.next()) {
                var currency = _d.value;
                try {
                    for (var _e = (e_2 = void 0, __values([price1, price2])), _f = _e.next(); !_f.done; _f = _e.next()) {
                        var price = _f.value;
                        if (!(currency in price)) {
                            price[currency] = convertFromEuro(price["eur"], currency);
                        }
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
        var out = { "eur": 0 };
        for (var currency in price1) {
            out[currency] = op(price1[currency], price2[currency]);
        }
        return out;
    }
    Price.binaryOperation = binaryOperation;
    function operation(price, op) {
        var out = { "eur": 0 };
        for (var currency in price) {
            out[currency] = Math.round(op(price[currency]));
        }
        return out;
    }
    Price.operation = operation;
    function addition(price1, price2, convertFromEuro) {
        return binaryOperation(price1, price2, function (amount1, amount2) { return amount1 + amount2; }, convertFromEuro);
    }
    Price.addition = addition;
    /**
     * return the amount of a price in a given currency.
     * If the amount for the currency is not defined in
     * the price object it will be computer from the
     * euro amount.
     * */
    function getAmountInCurrency(price, currency, convertFromEuro) {
        return currency in price ?
            price[currency] :
            convertFromEuro(price["eur"], currency);
    }
    Price.getAmountInCurrency = getAmountInCurrency;
    function prettyPrint(price, currency, convertFromEuro) {
        return currencyLib.prettyPrint(getAmountInCurrency(price, currency, convertFromEuro), currency);
    }
    Price.prettyPrint = prettyPrint;
})(Price = exports.Price || (exports.Price = {}));
;
var ShippingFormData;
(function (ShippingFormData) {
    function toStripeShippingInformation(shippingFormData, carrier) {
        var get = function (key) {
            var component = shippingFormData.addressComponents
                .find(function (_a) {
                var _b = __read(_a.types, 1), type = _b[0];
                return type === key;
            });
            return component !== undefined ? component["long_name"] : undefined;
        };
        return {
            "name": shippingFormData.firstName + " " + shippingFormData.lastName,
            "address": {
                "line1": get("street_number") + " " + get("route"),
                "line2": shippingFormData.addressExtra,
                "postal_code": get("postal_code") || "",
                "city": get("locality") || "",
                "state": get("administrative_area_level_1") || "",
                "country": get("country") || ""
            },
            carrier: carrier,
        };
    }
    ShippingFormData.toStripeShippingInformation = toStripeShippingInformation;
})(ShippingFormData = exports.ShippingFormData || (exports.ShippingFormData = {}));

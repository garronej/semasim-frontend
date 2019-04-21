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
var __spread = (this && this.__spread) || function () {
    for (var ar = [], i = 0; i < arguments.length; i++) ar = ar.concat(__read(arguments[i]));
    return ar;
};
Object.defineProperty(exports, "__esModule", { value: true });
var availablePackaging = {
    "light": {
        "weight": 21.5,
        "eurAmount": 20
    },
    "normal": {
        "weight": 45,
        "eurAmount": 50
    }
};
function getZone(destinationCountryIso) {
    var out = (function () {
        if (getZone.national.indexOf(destinationCountryIso) >= 0) {
            return "Metropolitan France, Andorra et Monaco";
        }
        if (__spread(getZone.om1, getZone.om2).indexOf(destinationCountryIso)) {
            return "DOM";
        }
        if ([
            "be", "el", "lt", "pt", "bg", "es", "lu", "ro", "cz", "fr",
            "hu", "si", "dk", "hr", "mt", "sk", "de", "it", "nl", "fi",
            "ee", "cy", "at", "se", "ie", "lv", "pl", "uk"
        ].indexOf(destinationCountryIso) > 0) {
            return "Europe";
        }
        if ([
            "no", "by", "hu​", "md", "ua", "dz",
            "ly", "ma", "eh", "mr", "tn"
        ].indexOf(destinationCountryIso) > 0) {
            return "Eastern Europe - Maghreb - Norway";
        }
        return "Rest of the world";
    })();
    console.log("getZone(" + destinationCountryIso + ") -> " + out);
    return out;
}
(function (getZone) {
    getZone.national = ["fr", "mc", "ad"];
    getZone.om1 = ["gf", "gp", "mq", "re", "pm", "bl", "mf", "yt"];
    getZone.om2 = ["nc", "pf", "wf", "tf"];
})(getZone || (getZone = {}));
function getLaPostDelay(destinationCountryIso) {
    var out = (function () {
        if (destinationCountryIso === "de") {
            return [3, 4];
        }
        switch (destinationCountryIso) {
            case "de": return [3, 4];
            case "at": return [3, 5];
            case "be": return [3, 5];
            case "it": return [3, 5];
            case "nl": return [3, 6];
            case "pt": return [3, 6];
            case "gb": return [3, 4];
            case "ch": return [3, 5];
            case "ca": return [4, 8];
            case "us": return [4, 8];
        }
        var zone = getZone(destinationCountryIso);
        switch (zone) {
            case "Metropolitan France, Andorra et Monaco": return [1, 2];
            case "DOM": return [4, 7];
            case "Europe":
            case "Eastern Europe - Maghreb - Norway": return [6, 8];
            default: return [7, 12];
        }
    })();
    console.log("getLaPostDelay(" + destinationCountryIso + ") -> " + out);
    return out;
}
/** To use for delivery to france and DOM Flat */
function solveLaPost(_a) {
    var footprint = _a.footprint, weight = _a.weight, destinationCountryIso = _a.destinationCountryIso;
    var out = (function () {
        if (footprint === "VOLUME") {
            throw new Error("Volume not supported by La Poste ( max 3cm )");
        }
        var packaging = weight + availablePackaging.light.weight < 100 ?
            availablePackaging.light : availablePackaging.normal;
        var totalWeight = weight + packaging.weight;
        if (totalWeight > 250) {
            throw new Error("Suboptimal for parcel > 250g");
        }
        var zone = getZone(destinationCountryIso);
        if (totalWeight > 100 && zone !== "Metropolitan France, Andorra et Monaco" && zone !== "DOM") {
            throw new Error("Suboptimal for international shipping of parcel > 100g");
        }
        var eurAmount = packaging.eurAmount;
        var offer;
        if (zone === "Metropolitan France, Andorra et Monaco" || zone === "DOM") {
            offer = "Lettre prioritaire, +sticker de suivie";
            eurAmount += totalWeight < 100 ? 210 : 420;
            if (zone === "DOM") {
                //NOTE: Extra for DOM-TOM
                eurAmount += (getZone.om1.indexOf(destinationCountryIso) >= 0 ? 5 : 11)
                    * Math.floor(totalWeight / 10);
            }
            //NOTE: For tracking.
            eurAmount += 40;
        }
        else {
            offer = "Lettre suivie internationale";
            eurAmount += 580;
        }
        return {
            "carrier": "La Poste",
            offer: offer,
            "delay": getLaPostDelay(destinationCountryIso),
            eurAmount: eurAmount,
            "needLightPackage": (availablePackaging.light === packaging &&
                weight + availablePackaging.normal.weight > 100)
        };
    })();
    console.log("solveLaPoste(" + JSON.stringify({ footprint: footprint, weight: weight, destinationCountryIso: destinationCountryIso }) + " -> " + JSON.stringify(out, null, 2));
    return out;
}
function solveColissimo(_a) {
    var footprint = _a.footprint, weight = _a.weight, destinationCountryIso = _a.destinationCountryIso;
    var out = (function () {
        var zone = getZone(destinationCountryIso);
        if (zone !== "Metropolitan France, Andorra et Monaco") {
            throw new Error("Colissimo is suboptimal for shipping outside of France (zone)");
        }
        if (footprint === "FLAT" && weight + availablePackaging.light.weight < 100) {
            throw new Error("Colissimo is suboptimal for flat parcel of < 100g");
        }
        var packaging = availablePackaging.normal;
        return {
            "carrier": "Colissimo",
            "offer": "Colissimo France",
            "delay": getLaPostDelay(destinationCountryIso),
            "eurAmount": packaging.eurAmount + (function () {
                var totalWeight = weight + packaging.weight;
                if (totalWeight < 250) {
                    return 495;
                }
                else if (totalWeight < 500) {
                    return 625;
                }
                else if (totalWeight < 750) {
                    return 710;
                }
                else {
                    return 880;
                }
            })(),
            "needLightPackage": false
        };
    })();
    console.log("solveColissimo(" + JSON.stringify({ footprint: footprint, weight: weight, destinationCountryIso: destinationCountryIso }) + " -> " + JSON.stringify(out, null, 2));
    return out;
}
function solveDelivengo(_a) {
    var weight = _a.weight, destinationCountryIso = _a.destinationCountryIso;
    var out = (function () {
        var zone = getZone(destinationCountryIso);
        if (zone === "Metropolitan France, Andorra et Monaco") {
            throw new Error("Suboptimal for international");
        }
        return {
            "carrier": "Delivengo",
            "offer": "Delivengo Easy",
            "delay": getLaPostDelay(destinationCountryIso),
            "eurAmount": Math.round(1.20 * (function () {
                var totalWeight = weight + availablePackaging.normal.weight;
                var isEu = zone === "Europe";
                if (totalWeight < 250) {
                    return isEu ? 630 : 700;
                }
                else if (totalWeight < 500) {
                    return isEu ? 720 : 920;
                }
                else {
                    return isEu ? 900 : 1400;
                }
            })()),
            "needLightPackage": false
        };
    })();
    console.log("solveDelivengo(" + JSON.stringify({ weight: weight, destinationCountryIso: destinationCountryIso }) + " -> " + JSON.stringify(out, null, 2));
    return out;
}
function solve(destinationCountryIso, footprint, weight) {
    var params = { destinationCountryIso: destinationCountryIso, footprint: footprint, weight: weight };
    try {
        return solveLaPost(params);
    }
    catch (error) {
        console.log(error.message);
        try {
            return solveColissimo(params);
        }
        catch (error) {
            console.log(error.message);
            return solveDelivengo(params);
        }
    }
}
exports.solve = solve;

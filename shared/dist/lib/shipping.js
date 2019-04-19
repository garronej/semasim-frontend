"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
//TODO: move
function estimateShipping(destinationCountryIso, footprint) {
    var zone = (function () {
        if (destinationCountryIso === "fr") {
            return "france";
        }
        if (destinationCountryIso === "fr_dom") {
            return "dom";
        }
        if ([
            "be", "el", "lt", "pt", "bg", "es", "lu", "ro", "cz", "fr",
            "hu", "si", "dk", "hr", "mt", "sk", "de", "it", "nl", "fi",
            "ee", "cy", "at", "se", "ie", "lv", "pl", "uk"
        ].indexOf(destinationCountryIso) > 0) {
            return "europe";
        }
        if ([
            "no", "by", "hu​", "md", "ua", "dz",
            "ly", "ma", "eh", "mr", "tn"
        ].indexOf(destinationCountryIso) > 0) {
            return "Eastern Europe - Maghreb - Norway";
        }
        return "rest of the world";
    })();
    switch (footprint) {
        case "FLAT": {
            var isTracked = false;
            switch (zone) {
                case "france":
                    return {
                        isTracked: isTracked,
                        "delay": 2,
                        "eurAmount": 216
                    };
                case "dom":
                    return {
                        isTracked: isTracked,
                        "delay": [4, 7],
                        "eurAmount": 261
                    };
                case "europe":
                    return {
                        isTracked: isTracked,
                        "delay": [2, 3],
                        "eurAmount": 260
                    };
                default:
                    return {
                        isTracked: isTracked,
                        "delay": [3, 8],
                        "eurAmount": 260
                    };
            }
        }
        case "VOLUME": {
            var isTracked = true;
            switch (zone) {
                case "france":
                    return {
                        isTracked: isTracked,
                        "delay": 2,
                        "eurAmount": 495
                    };
                case "dom": return {
                    isTracked: isTracked,
                    "delay": [5, 7],
                    "eurAmount": 1140
                };
                case "europe": return {
                    isTracked: isTracked,
                    "delay": [3, 8],
                    "eurAmount": 1230,
                    "premium": {
                        "eurAmountExtra": 578,
                        "betterDelay": [2, 4]
                    }
                };
                case "Eastern Europe - Maghreb - Norway":
                    return {
                        isTracked: isTracked,
                        "delay": [3, 8],
                        "eurAmount": 1665
                    };
                default:
                    return {
                        isTracked: isTracked,
                        "delay": [3, 8],
                        "eurAmount": 2435,
                        "premium": {
                            "eurAmountExtra": 2165,
                            "betterDelay": [1, 5]
                        }
                    };
            }
        }
    }
}
exports.estimateShipping = estimateShipping;

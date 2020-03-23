"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function runNowAndWhenEventOccurFactory(evts) {
    function runNowAndWhenEventOccur(handler, keys) {
        keys.forEach(function (key) { return evts[key].attach(handler); });
        handler();
    }
    ;
    return { runNowAndWhenEventOccur: runNowAndWhenEventOccur };
}
exports.runNowAndWhenEventOccurFactory = runNowAndWhenEventOccurFactory;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ts_events_extended_1 = require("ts-events-extended");
var ObservableImpl = /** @class */ (function () {
    function ObservableImpl(value, areSame) {
        if (areSame === void 0) { areSame = function (oldValue, newValue) { return oldValue === newValue; }; }
        this.value = value;
        this.areSame = areSame;
        this.evtChange = new ts_events_extended_1.SyncEvent();
    }
    ObservableImpl.prototype.onPotentialChange = function (newValue) {
        if (this.areSame(this.value, newValue)) {
            return;
        }
        this.value = newValue;
        this.evtChange.post(this.value);
    };
    return ObservableImpl;
}());
exports.ObservableImpl = ObservableImpl;

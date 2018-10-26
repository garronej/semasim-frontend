"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/** Assert jQuery is loaded on the page. */
function loadUiClassHtml(html, widgetClassName) {
    var wrap = $("<div>").html(html);
    $("head").append(wrap.find("style"));
    return {
        "structure": wrap.find(".id_" + widgetClassName),
        "templates": wrap.find(".templates")
    };
}
exports.loadUiClassHtml = loadUiClassHtml;

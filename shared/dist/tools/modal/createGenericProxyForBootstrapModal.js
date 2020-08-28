"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createGenericProxyForBootstrapModal = void 0;
var evt_1 = require("evt");
/**
 * Assert bootstrap modal initialized on jQuery element.
 * bootbox already call .modal().
 * For custom modal .modal() need to be called first.
 *
 *
 * NOTE: For dialog remember to invoke removeFromDom once hidden.
 */
function createGenericProxyForBootstrapModal($initializedModalDiv) {
    var evtHide = evt_1.Evt.create();
    var evtShown = evt_1.Evt.create();
    var evtHidden = evt_1.Evt.create();
    $initializedModalDiv.on("hide.bs.modal", function () { return evtHide.post(); });
    $initializedModalDiv.on("shown.bs.modal", function () { return evtShown.post(); });
    $initializedModalDiv.on("hidden.bs.modal", function () { return evtHidden.post(); });
    var modal = {
        evtHide: evtHide, evtShown: evtShown, evtHidden: evtHidden,
        "show": function () { return $initializedModalDiv.modal("show"); },
        "hide": function () { return $initializedModalDiv.modal("hide"); },
        "removeFromDom": function () {
            $initializedModalDiv.off();
            $initializedModalDiv.data("bs.modal", null);
            $initializedModalDiv.remove();
        }
    };
    return modal;
}
exports.createGenericProxyForBootstrapModal = createGenericProxyForBootstrapModal;

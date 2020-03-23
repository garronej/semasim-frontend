
import { Modal } from "./types";
import { VoidEvt } from "evt";

/** 
 * Assert bootstrap modal initialized on jQuery element.
 * bootbox already call .modal().
 * For custom modal .modal() need to be called first.
 * 
 * 
 * NOTE: For dialog remember to invoke removeFromDom once hidden.
 */
export function createGenericProxyForBootstrapModal(
    $initializedModalDiv: JQuery
): Modal {

    const evtHide = new VoidEvt();
    const evtShown = new VoidEvt();
    const evtHidden = new VoidEvt();

    $initializedModalDiv.on("hide.bs.modal", () => evtHide.post());
    $initializedModalDiv.on("shown.bs.modal", () => evtShown.post());
    $initializedModalDiv.on("hidden.bs.modal", () => evtHidden.post());

    const modal: Modal = {
        evtHide, evtShown, evtHidden,
        "show": () => $initializedModalDiv.modal("show"),
        "hide": () => $initializedModalDiv.modal("hide"),
        "removeFromDom": () => {

            $initializedModalDiv.off();

            $initializedModalDiv.data("bs.modal", null);

            $initializedModalDiv.remove();

        }
    };

    return modal;

}
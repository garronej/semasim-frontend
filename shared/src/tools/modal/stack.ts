
import { Modal } from "./types";

const stack: Modal[] = [];

const onHideKey = " __hide_handler__ ";

//NOTE: Assert provided modal is not shown.
export function add(
    modal: Modal
): {
    show(): Promise<void>;
    hide(): Promise<void>;
} {


    return {
        "show": () => new Promise<void>(async resolve => {

            if (stack.indexOf(modal) >= 0) {
                resolve();
                return;
            }

            stack.push(modal);

            modal[onHideKey] = () => {

                const index = stack.indexOf(modal);

                const wasOnTop = index === stack.length - 1;

                stack.splice(index, 1)

                if (wasOnTop && stack.length !== 0) {

                    const modalToRestore = stack[stack.length - 1];

                    modalToRestore[" scheduled to be shown "] = true;

                    /*
                    NOTE: To prevent flickering we do not restore 
                    the previous modal if an other one is immediately
                    opened ( form with successive bootbox_custom )
                    */
                    setTimeout(() => {

                        delete modalToRestore[" scheduled to be shown "];

                        if (modalToRestore !== stack[stack.length - 1]) {
                            return;
                        }

                        modalToRestore.show();

                    }, 100);

                }

            };


            //modal.one("hide.bs.modal", modal[onHideKey]);
            modal.evtHide.attachOnce(modal[onHideKey]);

            if (stack.length !== 1) {

                const currentModal = stack[stack.length - 2];

                if (!currentModal[" scheduled to be shown "]) {

                    //currentModal.off("hide.bs.modal", undefined, currentModal[onHideKey]);

                    {

                        const handler = currentModal.evtHide.getHandlers()
                            .find(({ callback }) => callback === currentModal[onHideKey])
                            ;


                        //NOTE: I think this can never be undefined by who know.
                        if (!!handler) {
                            handler.detach();
                        }

                    }

                    //NOTE: If no transition hidden is instant.
                    //const prHidden = new Promise(resolve => currentModal.one("hidden.bs.modal", () => resolve()));
                    const prHidden = new Promise(resolve => currentModal.evtHidden.attachOnce(()=> resolve()));

                    //currentModal.modal("hide");
                    currentModal.hide();

                    //currentModal.one("hide.bs.modal", currentModal[onHideKey]);
                    currentModal.evtHide.attachOnce(currentModal[onHideKey])

                    await prHidden;

                }

            }



            //modal.one("shown.bs.modal", () => resolve());
            modal.evtShown.attachOnce(()=> resolve());

            //modal.modal("show");
            modal.show();

        }),
        "hide": () => new Promise<void>(resolve => {

            if (stack.indexOf(modal) < 0) {
                resolve();
                return;
            }

            //modal.one("hidden.bs.modal", () => resolve());
            modal.evtHidden.attachOnce(()=> resolve());

            //modal.modal("hide");
            modal.hide();

        })
    }



}

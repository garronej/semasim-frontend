
//TODO: Assert jQuery bootstrap loaded on the page.

const stack: JQuery[] = [];

const onHideKey = " __hide_handler__ ";

export function add(
    modal: JQuery,
    options: { keyboard: boolean; backdrop: boolean | "static"; }
): {
    show(): Promise<void>;
    hide(): Promise<void>;
} {

    //NOTE: null only when called by bootbox_custom.
    if (options !== null) {

        modal.modal({
            ...options,
            "show": false
        });

    }

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

                        modalToRestore.modal("show");

                    }, 100);

                }

            };

            modal.one("hide.bs.modal", modal[onHideKey]);

            if (stack.length !== 1) {

                const currentModal = stack[stack.length - 2];

                if (!currentModal[" scheduled to be shown "]) {

                    currentModal.off("hide.bs.modal", undefined, currentModal[onHideKey]);

                    //If no transition hidden is instant.
                    const prHidden= new Promise(resolve => currentModal.one("hidden.bs.modal", () => resolve()));

                    currentModal.modal("hide");

                    currentModal.one("hide.bs.modal", currentModal[onHideKey]);

                    await prHidden;

                }

            }

            modal.one("shown.bs.modal", () => resolve());

            modal.modal("show");

        }),
        "hide": () => new Promise<void>(resolve => {

            if (stack.indexOf(modal) < 0) {
                resolve();
                return;
            }

            modal.one("hidden.bs.modal", () => resolve());

            modal.modal("hide");

        })
    }



}

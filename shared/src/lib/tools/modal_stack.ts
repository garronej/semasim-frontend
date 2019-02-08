
//TODO: Assert jQuery bootstrap loaded on the page.

const stack: JQuery[]= [];

const onHideKey= " __hide_handler__ ";

export function add(
    modal: JQuery,
    options: { keyboard: boolean; backdrop: boolean | "static"; }
): {
    show(): Promise<void>;
    hide(): Promise<void>;
} {

    if (options !== null) {

        modal.modal({
            ...options,
            "show": false
        });

    }

    return {
        "show": () => new Promise<void>(async resolve => {

            if( stack.indexOf(modal) >= 0 ){
                return;
            }

            stack.push(modal);

            modal[onHideKey] = () => {

                const index = stack.indexOf(modal);

                const wasOnTop = index === stack.length - 1;

                stack.splice(index, 1)

                if (wasOnTop && stack.length !== 0) {

                    stack[stack.length - 1].modal("show");

                }

            };

            modal.one("hide.bs.modal", modal[onHideKey]);

            if (stack.length !== 1) {

                const currentModal = stack[stack.length-2];

                currentModal.off("hide.bs.modal", undefined, currentModal[onHideKey]);

                currentModal.modal("hide");

                currentModal.one("hide.bs.modal", currentModal[onHideKey]);

                await new Promise(resolve => currentModal.one("hidden.bs.modal", () => resolve()));

            }

            modal.modal("show");

            modal.one("shown.bs.modal", () => resolve() ); 

        }),
        "hide": () => new Promise<void>(resolve => {

            if( stack.indexOf(modal) < 0 ){
                return;
            }

            modal.modal("hide");

            modal.one("hidden.bs.modal", () => resolve());

        })
    }



}

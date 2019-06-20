
//TODO: Assert jQuery bootstrap and bootbox loaded on the page.

import * as modal_stack from "./modal_stack";

declare const bootbox: any;

type currentLoading = {
    stop: () => void;
    message: string;
    delayBeforeShow: number;
};

let currentLoading: currentLoading | undefined = undefined;

let currentModal: JQuery | undefined = undefined;

let restoreLoading: (() => void) | undefined = undefined;

export function dismissLoading() {

    if (currentLoading) {
        currentLoading.stop();
        currentLoading = undefined;
    }

    if (restoreLoading) {
        restoreLoading = undefined;
    }

}

export function loading(
    message: string,
    delayBeforeShow = 700
) {

    if (currentModal) {

        restoreLoading = () => loading(message, delayBeforeShow);

        return;

    }

    if( currentLoading ){
        delayBeforeShow= 0;
    }

    dismissLoading();

    let modal: JQuery | undefined = undefined;

    const timer = setTimeout(
        () => {

            let options = {
                "message": [
                    '<p class="text-center">',
                    '<i class="fa fa-spin fa-spinner"></i>&nbsp;&nbsp;',
                    `<span class="${loading.spanClass}">${message}</span>`,
                    `</p>`
                ].join(""),
                "closeButton": false
            };

            modal = run("dialog", [options], true);


        },
        delayBeforeShow
    );

    currentLoading = {
        "stop": () => modal ? modal.modal("hide") : clearTimeout(timer),
        message,
        delayBeforeShow
    };

}

export namespace loading {

    export const spanClass= "loading_message";

}


function run(method: string, args: any[], isLoading = false): JQuery {

    if (!isLoading && currentModal) {

        currentModal.modal("hide");

        return run(method, args, false);

    }

    if (!isLoading && currentLoading) {

        let message = currentLoading.message;

        let delayBeforeShow = currentLoading.delayBeforeShow;

        dismissLoading();

        restoreLoading = () => loading(message, delayBeforeShow);

    }


    const options= typeof args[0] === "string" ? ({
        "message": args[0],
        "callback": args[1]
    }): args[0];

    if( !("animate" in options) ){
        options.animate = false;
    }

    options.show= false;

    //let modal: JQuery = bootbox[method].apply(bootbox, args);
    let modal: JQuery = bootbox[method](options);

    modal_stack.add(modal, null as any).show();

    if (!isLoading) {

        currentModal = modal;

    }

    modal.one("hide.bs.modal", () => {

        if (!isLoading) {

            currentModal = undefined;

        }

    });

    modal.one("hidden.bs.modal", () => {

        if (restoreLoading) {
            restoreLoading();
        }

        modal.data("bs.modal", null);

        modal.remove();

    });

    return modal;

}

export function dialog(options: object): JQuery {
    return run("dialog", [options]);
}

export function alert(...args: any[]): JQuery {
    return run("alert", args);
}

export function prompt(options: object): JQuery {
    return run("prompt", [options]);
}

export function confirm(options: object): JQuery {
    return run("confirm", [options]);
}

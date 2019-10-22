
//NOTE: Assert jQuery bootstrap and bootbox loaded on the page 
//( if used from the web, if a custom implementation is provided bootbox doesn't need to be defined )
declare const bootbox: any;

import { Api } from "./types";
import { createGenericProxyForBootstrapModal } from "../createGenericProxyForBootstrapModal";

let customImplementationOfApi: Api | undefined = undefined;

export function provideCustomImplementationOfApi(api: Api) {
    customImplementationOfApi = api;
}

const bootboxBasedImplementationOfBaseApi: Api = {
    "create": (dialogType, options) => {

        const bootstrapModal: JQuery = bootbox[dialogType](options);

        return createGenericProxyForBootstrapModal(bootstrapModal);

    },
    "createLoading": message => bootboxBasedImplementationOfBaseApi.create(
        "dialog",
        {
            "message": [
                '<p class="text-center">',
                '<i class="fa fa-spin fa-spinner"></i>&nbsp;&nbsp;',
                `<span class="${loading.spanClass}">${message}</span>`,
                `</p>`
            ].join(""),
            "closeButton": false,
            "onEscape": false,
            "animate": false,
            "show": false
        }
    )
};


//TODO: See if needed.
namespace loading {

    export const spanClass = "loading_message";

}

export const getApi= ()=> customImplementationOfApi || bootboxBasedImplementationOfBaseApi;

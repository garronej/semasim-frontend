

import { Api } from "./types";
import { createGenericProxyForBootstrapModal } from "./createGenericProxyForBootstrapModal";


//NOTE: Assert jQuery bootstrap on the page ( if use via web )


let customImplementationOfApi: Api | undefined = undefined;

export function provideCustomImplementationOfApi(api: Api) {
    customImplementationOfApi = api;
}

const bootstrapBasedImplementationOfApi: Api = {
    "create": ($uninitializedModalDiv, options) => {

        $uninitializedModalDiv.modal( options);

        return createGenericProxyForBootstrapModal($uninitializedModalDiv);

    }
};


export const getApi= ()=> customImplementationOfApi || bootstrapBasedImplementationOfApi;

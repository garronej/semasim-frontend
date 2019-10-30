
import { connectSidHttpHeaderName } from "../types/connectSidHttpHeaderName";
import { env } from "../env";

import { get as JSON_CUSTOM_factory } from "transfer-tools/dist/lib/JSON_CUSTOM";
import { webApiPath } from "../../gateway/webApiPath";

const serializer = JSON_CUSTOM_factory();

export class WebApiError extends Error {
    constructor(
        public readonly methodName: string, 
        public readonly httpErrorStatus: number | undefined
    ) {
        super(`Web api error ${httpErrorStatus} calling ${methodName}`);

        Object.setPrototypeOf(this, WebApiError.prototype);
    }

}


export async function sendRequest<Params, Response>(
    methodName: string,
    params: Params,
    connectSid: string | undefined,
): Promise<Response> {

    const fetchResp = await fetch(
        `https://web.${env.baseDomain}${webApiPath}/${methodName}`,
        {
            "method": "POST",
            "cache": "no-cache",
            "credentials": "same-origin",
            "headers": {
                "Content-Type": "application/json-custom; charset=utf-8",
                ...(
                    connectSid !== undefined ?
                        ({ [connectSidHttpHeaderName]: connectSid }) :
                        ({})
                )
            },
            "redirect": "error",
            "body": serializer.stringify(params)
        }
    ).catch((error) => {

        console.log(`Fetch error: ${methodName} ${JSON.stringify(params)} ${error.message}`);

        return new WebApiError(methodName, undefined);

    });

    if( fetchResp instanceof WebApiError ){
        throw fetchResp;
    }

    if (fetchResp.status !== 200) {

        throw new WebApiError(methodName, fetchResp.status);

    }

    const resp: Response = serializer.parse(await fetchResp.text());

    console.log(methodName, { params, resp });

    return resp;

}


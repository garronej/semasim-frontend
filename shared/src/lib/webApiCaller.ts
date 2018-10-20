
import * as apiDeclaration from "../web_api_declaration";
import * as ttJC from "transfer-tools/dist/lib/JSON_CUSTOM";

//NOTE: Assert jQuery loaded on the page

const JSON_CUSTOM= ttJC.get();

async function sendRequest<Params, Response>(
    methodName, params: Params
): Promise<Response> {
    return new Promise<Response>(
        resolve => (window["$"] as JQueryStatic).ajax({
            "url": `/${apiDeclaration.apiPath}/${methodName}`,
            "method": "POST",
            "contentType": "application/json; charset=UTF-8",
            "data": JSON_CUSTOM.stringify(params),
            "dataType": "text",
            "statusCode": {
                "400": () => alert("Bad request ( bug in the client )"),
                "401": () => window.location.reload(),
                "500": () => alert("Bug on the server, sorry :("),
                "200": (data: string) => resolve(JSON_CUSTOM.parse(data))
            }
        })
    );
}


export function registerUser(
    email: string,
    password: string
) {

    const methodName = apiDeclaration.registerUser.methodName;
    type Params = apiDeclaration.registerUser.Params;
    type Response = apiDeclaration.registerUser.Response;

    return sendRequest<Params, Response>(
        methodName,
        { email, password }
    );

}

export function validateEmail(
    email: string,
    activationCode: string
) {

    const methodName = apiDeclaration.validateEmail.methodName;
    type Params = apiDeclaration.validateEmail.Params;
    type Response = apiDeclaration.validateEmail.Response;

    return sendRequest<Params, Response>(
        methodName,
        { email, activationCode }
    );

}

export function loginUser(
    email: string,
    password: string
) {

    const methodName = apiDeclaration.loginUser.methodName;
    type Params = apiDeclaration.loginUser.Params;
    type Response = apiDeclaration.loginUser.Response;

    return sendRequest<Params, Response>(
        methodName,
        { email, password }
    );

}

export function logoutUser() {

    const methodName = apiDeclaration.logoutUser.methodName;
    type Params = apiDeclaration.logoutUser.Params;
    type Response = apiDeclaration.logoutUser.Response;

    return sendRequest<Params, Response>(
        methodName,
        undefined
    );

}

/** Return true if email has account */
export function sendRenewPasswordEmail(
    email: string
) {

    const methodName = apiDeclaration.sendRenewPasswordEmail.methodName;
    type Params = apiDeclaration.sendRenewPasswordEmail.Params;
    type Response = apiDeclaration.sendRenewPasswordEmail.Response;

    return sendRequest<Params, Response>(
        methodName,
        { email }
    );

}

export function renewPassword(
    email: string,
    newPassword: string,
    token: string
) {

    const methodName = apiDeclaration.renewPassword.methodName;
    type Params = apiDeclaration.renewPassword.Params;
    type Response = apiDeclaration.renewPassword.Response;

    return sendRequest<Params, Response>(
        methodName,
        { email, newPassword, token }
    );

}


/*
function buildUrl(
    methodName: string,
    params: Record<string, string | undefined>
): string {

    let query: string[] = [];

    for (let key of Object.keys(params)) {

        let value = params[key];

        if (value === undefined) continue;

        query[query.length] = `${key}=${params[key]}`;

    }

    let url = `https://${c.backendHostname}:${c.webApiPort}/${c.webApiPath}/${methodName}?${query.join("&")}`;

    console.log(`GET ${url}`);

    return url;
}
*/
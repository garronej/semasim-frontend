
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
            //"contentType": "application/json; charset=UTF-8",
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

export function getCountryIso() {

    const methodName = apiDeclaration.getCountryIso.methodName;
    type Params = apiDeclaration.getCountryIso.Params;
    type Response = apiDeclaration.getCountryIso.Response;

    return sendRequest<Params, Response>(
        methodName,
        undefined
    );

}

export function getChangesRates() {

    const methodName = apiDeclaration.getChangesRates.methodName;
    type Params = apiDeclaration.getChangesRates.Params;
    type Response = apiDeclaration.getChangesRates.Response;

    return sendRequest<Params, Response>(
        methodName,
        undefined
    );

}

export function getSubscriptionInfos() {

    const methodName = apiDeclaration.getSubscriptionInfos.methodName;
    type Params = apiDeclaration.getSubscriptionInfos.Params;
    type Response = apiDeclaration.getSubscriptionInfos.Response;

    return sendRequest<Params, Response>(
        methodName,
        undefined
    );

}

export async function subscribeOrUpdateSource(sourceId?: string) {

    const methodName = apiDeclaration.subscribeOrUpdateSource.methodName;
    type Params = apiDeclaration.subscribeOrUpdateSource.Params;
    type Response = apiDeclaration.subscribeOrUpdateSource.Response;

    await sendRequest<Params, Response>(
        methodName,
        { sourceId }
    );

}

export async function unsubscribe() {

    const methodName = apiDeclaration.unsubscribe.methodName;
    type Params = apiDeclaration.unsubscribe.Params;
    type Response = apiDeclaration.unsubscribe.Response;

    await sendRequest<Params, Response>(
        methodName,
        undefined
    );

}

export function createStripeCheckoutSessionForShop(
    cart: import("./types/shop").Cart,
    shippingFormData: import("./types/shop").ShippingFormData,
    currency: string,
    success_url: string,
    cancel_url: string
) {

    const methodName = apiDeclaration.createStripeCheckoutSessionForShop.methodName;
    type Params = apiDeclaration.createStripeCheckoutSessionForShop.Params;
    type Response = apiDeclaration.createStripeCheckoutSessionForShop.Response;

    return sendRequest<Params, Response>(
        methodName,
        {
            "cartDescription": cart.map(
                ({ product, quantity }) => ({
                    "productName": product.name,
                    quantity
                })
            ),
            shippingFormData,
            currency,
            success_url,
            cancel_url
        }
    );

}

export function createStripeCheckoutSessionForSubscription(
    currency: string,
    success_url: string,
    cancel_url: string
) {

    const methodName = apiDeclaration.createStripeCheckoutSessionForSubscription.methodName;
    type Params = apiDeclaration.createStripeCheckoutSessionForSubscription.Params;
    type Response = apiDeclaration.createStripeCheckoutSessionForSubscription.Response;

    return sendRequest<Params, Response>(
        methodName,
        {
            currency,
            success_url,
            cancel_url
        }
    );

}

export function getOrders() {

    const methodName = apiDeclaration.getOrders.methodName;
    type Params = apiDeclaration.getOrders.Params;
    type Response = apiDeclaration.getOrders.Response;

    return sendRequest<Params, Response>(
        methodName,
        undefined
    );

}

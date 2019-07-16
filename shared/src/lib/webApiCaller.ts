
import * as apiDeclaration from "../web_api_declaration";
import * as ttJC from "transfer-tools/dist/lib/JSON_CUSTOM";
import { webApiPath } from "../gateway/webApiPath";

//NOTE: Assert jQuery loaded on the page

const JSON_CUSTOM = ttJC.get();

async function sendRequest<Params, Response>(
    methodName, params: Params
): Promise<Response> {
    return new Promise<Response>(
        resolve => (window["$"] as JQueryStatic).ajax({
            "url": `${webApiPath}/${methodName}`,
            "method": "POST",
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


export const registerUser = (() => {

    const methodName = apiDeclaration.registerUser.methodName;
    type Params = apiDeclaration.registerUser.Params;
    type Response = apiDeclaration.registerUser.Response;

    return function (
        email: string,
        secret: string,
        towardUserEncryptKeyStr: string,
        encryptedSymmetricKey: string
    ) {

        return sendRequest<Params, Response>(
            methodName,
            {
                email,
                secret,
                towardUserEncryptKeyStr,
                encryptedSymmetricKey
            }
        );

    };

})();

export const validateEmail = (() => {

    const methodName = apiDeclaration.validateEmail.methodName;
    type Params = apiDeclaration.validateEmail.Params;
    type Response = apiDeclaration.validateEmail.Response;

    return function (
        email: string,
        activationCode: string
    ) {

        return sendRequest<Params, Response>(
            methodName,
            { email, activationCode }
        );

    };

})();

export const loginUser = (() => {

    const methodName = apiDeclaration.loginUser.methodName;
    type Params = apiDeclaration.loginUser.Params;
    type Response = apiDeclaration.loginUser.Response;

    return function (
        email: string,
        secret: string
    ) {

        return sendRequest<Params, Response>(
            methodName,
            { email, secret }
        );

    }


})();

export const logoutUser = (() => {

    const methodName = apiDeclaration.logoutUser.methodName;
    type Params = apiDeclaration.logoutUser.Params;
    type Response = apiDeclaration.logoutUser.Response;

    return function () {

        return sendRequest<Params, Response>(
            methodName,
            undefined
        );

    };

})();

/** Return true if email has account */
export const sendRenewPasswordEmail = (() => {

    const methodName = apiDeclaration.sendRenewPasswordEmail.methodName;
    type Params = apiDeclaration.sendRenewPasswordEmail.Params;
    type Response = apiDeclaration.sendRenewPasswordEmail.Response;

    return function (
        email: string
    ) {

        return sendRequest<Params, Response>(
            methodName,
            { email }
        );

    };

})();

export const renewPassword = (() => {

    const methodName = apiDeclaration.renewPassword.methodName;
    type Params = apiDeclaration.renewPassword.Params;
    type Response = apiDeclaration.renewPassword.Response;

    return function (
        email: string,
        newSecret: string,
        newTowardUserEncryptKeyStr: string,
        newEncryptedSymmetricKey: string,
        token: string
    ) {

        return sendRequest<Params, Response>(
            methodName,
            {
                email,
                newSecret,
                newTowardUserEncryptKeyStr,
                newEncryptedSymmetricKey,
                token
            }
        );

    };

})();

export const getCountryIso = (() => {

    const methodName = apiDeclaration.getCountryIso.methodName;
    type Params = apiDeclaration.getCountryIso.Params;
    type Response = apiDeclaration.getCountryIso.Response;

    return function () {

        return sendRequest<Params, Response>(
            methodName,
            undefined
        );

    };


})();

export const getChangesRates = (() => {

    const methodName = apiDeclaration.getChangesRates.methodName;
    type Params = apiDeclaration.getChangesRates.Params;
    type Response = apiDeclaration.getChangesRates.Response;

    return function () {

        return sendRequest<Params, Response>(
            methodName,
            undefined
        );

    };

})();

export const getSubscriptionInfos = (() => {

    const methodName = apiDeclaration.getSubscriptionInfos.methodName;
    type Params = apiDeclaration.getSubscriptionInfos.Params;
    type Response = apiDeclaration.getSubscriptionInfos.Response;

    return function () {

        return sendRequest<Params, Response>(
            methodName,
            undefined
        );

    };


})();

export const subscribeOrUpdateSource = (() => {

    const methodName = apiDeclaration.subscribeOrUpdateSource.methodName;
    type Params = apiDeclaration.subscribeOrUpdateSource.Params;
    type Response = apiDeclaration.subscribeOrUpdateSource.Response;

    return async function (sourceId?: string) {

        await sendRequest<Params, Response>(
            methodName,
            { sourceId }
        );

    };


})();

export const unsubscribe = (() => {

    const methodName = apiDeclaration.unsubscribe.methodName;
    type Params = apiDeclaration.unsubscribe.Params;
    type Response = apiDeclaration.unsubscribe.Response;

    return async function () {

        await sendRequest<Params, Response>(
            methodName,
            undefined
        );

    };

})();

export const createStripeCheckoutSessionForShop = (() => {

    const methodName = apiDeclaration.createStripeCheckoutSessionForShop.methodName;
    type Params = apiDeclaration.createStripeCheckoutSessionForShop.Params;
    type Response = apiDeclaration.createStripeCheckoutSessionForShop.Response;

    return function (
        cart: import("./types/shop").Cart,
        shippingFormData: import("./types/shop").ShippingFormData,
        currency: string,
        success_url: string,
        cancel_url: string
    ) {

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

    };

})();


export const createStripeCheckoutSessionForSubscription = (() => {

    const methodName = apiDeclaration.createStripeCheckoutSessionForSubscription.methodName;
    type Params = apiDeclaration.createStripeCheckoutSessionForSubscription.Params;
    type Response = apiDeclaration.createStripeCheckoutSessionForSubscription.Response;

    return function (
        currency: string,
        success_url: string,
        cancel_url: string
    ) {

        return sendRequest<Params, Response>(
            methodName,
            {
                currency,
                success_url,
                cancel_url
            }
        );

    };

})();

export const getOrders = (() => {

    const methodName = apiDeclaration.getOrders.methodName;
    type Params = apiDeclaration.getOrders.Params;
    type Response = apiDeclaration.getOrders.Response;

    return function () {

        return sendRequest<Params, Response>(
            methodName,
            undefined
        );

    };

})();

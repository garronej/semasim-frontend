
import * as apiDeclaration from "../../web_api_declaration";
import { sendRequest as sendRequestMayThrow, WebApiError } from "./sendRequest";
import { AuthenticatedSessionDescriptorSharedData } from "../localStorage/AuthenticatedSessionDescriptorSharedData";
import { Credentials } from "../localStorage/Credentials";
import * as env from "../env";
import { SyncEvent } from "ts-events-extended";
import { restartApp } from "../restartApp";

import * as networkStateMonitoring from "../networkStateMonitoring";



export { WebApiError }

const evtError = new SyncEvent<WebApiError>();


evtError.attach(
    ({ methodName, httpErrorStatus }) => {

        switch (env.jsRuntimeEnv) {
            case "browser": {

                switch (httpErrorStatus) {
                    case 401: restartApp(); break;;
                    case 500: alert("Internal server error"); break;
                    case 400: alert("Request malformed"); break;
                    case undefined: alert("Can't reach the server"); break;
                    default: alert(`${methodName} httpErrorStatus: ${httpErrorStatus}`);

                }

            } break;
            case "react-native": {

                console.log(`WebApi Error: ${methodName} ${httpErrorStatus}`);

                restartApp();

            } break;
        }


    }
);





let canRequestThrow = false;

export function setCanRequestThrowToTrueForNextMethodCall() {
    canRequestThrow = true;
}

const sendRequest = async <Params, Response>(methodName: string, params: Params) => {

    {

        const networkStateMonitoringApi = await networkStateMonitoring.getApi();

        if (!networkStateMonitoringApi.getIsOnline()) {
            await networkStateMonitoringApi.evtStateChange.waitFor();
        }

    }

    try {

        return sendRequestMayThrow<Params, Response>(
            methodName,
            params,
            env.jsRuntimeEnv === "react-native" && await AuthenticatedSessionDescriptorSharedData.isPresent() ?
                (await AuthenticatedSessionDescriptorSharedData.get()).connect_sid : undefined
        );

    } catch (error) {

        if (!(error instanceof WebApiError)) {
            throw error;
        }

        if (canRequestThrow) {
            canRequestThrow = false;
            throw error;
        }

        evtError.post(error);

        return new Promise<never>(() => { });

    }


}



export const registerUser = (() => {

    const { methodName } = apiDeclaration.registerUser;
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

    const { methodName } = apiDeclaration.validateEmail;
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


/** uaInstanceId should be provided on android/iOS and undefined on the web */
export const loginUser = (() => {

    const { methodName } = apiDeclaration.loginUser;
    type Params = apiDeclaration.loginUser.Params;
    type Response = apiDeclaration.loginUser.Response;

    return async function (
        email: string,
        secret: string,
        uaInstanceId: string | undefined
    ) {

        email = email.toLowerCase();

        const response = await sendRequest<Params, Response>(
            methodName,
            { email, secret, uaInstanceId }
        );

        if (response.status !== "SUCCESS") {
            return response;
        }

        if (env.jsRuntimeEnv === "react-native") {

            await Credentials.set({
                email,
                secret,
                "uaInstanceId": uaInstanceId!
            });

        }

        await AuthenticatedSessionDescriptorSharedData.set({
            "connect_sid": response.connect_sid,
            email,
            "encryptedSymmetricKey": response.encryptedSymmetricKey,
            "uaInstanceId": uaInstanceId === undefined ?
                response.webUaInstanceId! : uaInstanceId

        });

        return { "status": response.status };

    }

})();

export const isUserLoggedIn = (() => {

    const { methodName } = apiDeclaration.isUserLoggedIn;
    type Params = apiDeclaration.isUserLoggedIn.Params;
    type Response = apiDeclaration.isUserLoggedIn.Response;

    return async function () {

        const isLoggedIn = await sendRequest<Params, Response>(
            methodName,
            undefined
        );

        if (!isLoggedIn) {

            await AuthenticatedSessionDescriptorSharedData.remove();

        }

        return isLoggedIn;

    };

})();

export const declareUa = (() => {

    const { methodName } = apiDeclaration.declareUa;
    type Params = apiDeclaration.declareUa.Params;
    type Response = apiDeclaration.declareUa.Response;

    return async function (params: Params) {

        await sendRequest<Params, Response>(
            methodName,
            params
        );

    };

})();

export const logoutUser = (() => {

    const { methodName } = apiDeclaration.logoutUser;
    type Params = apiDeclaration.logoutUser.Params;
    type Response = apiDeclaration.logoutUser.Response;

    return async function () {

        await sendRequest<Params, Response>(
            methodName,
            undefined
        );

        await AuthenticatedSessionDescriptorSharedData.remove();

        if (env.jsRuntimeEnv === "react-native") {

            await Credentials.remove();

        }

    };

})();

/** Return true if email has account */
export const sendRenewPasswordEmail = (() => {

    const { methodName } = apiDeclaration.sendRenewPasswordEmail;
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

    const { methodName } = apiDeclaration.renewPassword;
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

    const { methodName } = apiDeclaration.getCountryIso;
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

    const { methodName } = apiDeclaration.getChangesRates;
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

    const { methodName } = apiDeclaration.getSubscriptionInfos;
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

    const { methodName } = apiDeclaration.subscribeOrUpdateSource;
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

    const { methodName } = apiDeclaration.unsubscribe;
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

    const { methodName } = apiDeclaration.createStripeCheckoutSessionForShop;
    type Params = apiDeclaration.createStripeCheckoutSessionForShop.Params;
    type Response = apiDeclaration.createStripeCheckoutSessionForShop.Response;

    return function (
        cart: import("../types/shop").Cart,
        shippingFormData: import("../types/shop").ShippingFormData,
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

    const { methodName } = apiDeclaration.createStripeCheckoutSessionForSubscription;
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

    const { methodName } = apiDeclaration.getOrders;
    type Params = apiDeclaration.getOrders.Params;
    type Response = apiDeclaration.getOrders.Response;

    return function () {

        return sendRequest<Params, Response>(
            methodName,
            undefined
        );

    };

})();



import * as apiDeclaration from "../../web_api_declaration";
import { sendRequest as sendRequestMayThrow, WebApiError } from "./sendRequest";
import { env } from "../env";
import { Evt } from "evt";

import { assert } from "../../tools/typeSafety/assert";

export type WebApi =
    Exclude<ReturnType<typeof getWebApi>, "getLoginLogoutApi"> &
    ReturnType<ReturnType<typeof getWebApi>["getLoginLogoutApi"]>
    ;

export function getWebApi(
    params: {
        AuthenticatedSessionDescriptorSharedData: typeof import("../localStorage/AuthenticatedSessionDescriptorSharedData").AuthenticatedSessionDescriptorSharedData;
        restartApp: import("../restartApp").RestartApp;
        networkStateMonitoringApi: import("../networkStateMonitoring").NetworkStateMonitoring;
    }
) {

    assert(!getWebApi.hasBeenCalled);

    getWebApi.hasBeenCalled = true;


    //const { Credentials, AuthenticatedSessionDescriptorSharedData } = params;
    const { AuthenticatedSessionDescriptorSharedData, restartApp, networkStateMonitoringApi } = params;

    const evtError = new Evt<WebApiError>();

    evtError.attach(
        ({ methodName, httpErrorStatus }) => {

            switch (env.jsRuntimeEnv) {
                case "browser": {

                    switch (httpErrorStatus) {
                        case 401: restartApp("Wep api 401"); break;;
                        case 500: alert("Internal server error"); break;
                        case 400: alert("Request malformed"); break;
                        case undefined: alert("Can't reach the server"); break;
                        default: alert(`${methodName} httpErrorStatus: ${httpErrorStatus}`);

                    }

                } break;
                case "react-native": {

                    restartApp(`WebApi Error: ${methodName} ${httpErrorStatus}`);

                } break;
            }


        }
    );

    const sendRequest = async <Params, Response>(
        params_: {
            methodName: string;
            params: Params;
            shouldThrowOnError: undefined | boolean
        }) => {

        const { methodName, params, shouldThrowOnError } = params_;

        if (!networkStateMonitoringApi.getIsOnline()) {
            await networkStateMonitoringApi.evtStateChange.waitFor();
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

            if (shouldThrowOnError) {
                throw error;
            }

            evtError.post(error);

            return new Promise<never>(() => { });

        }

    };

    return {
        WebApiError,
        "registerUser": (() => {

            const { methodName } = apiDeclaration.registerUser;
            type Params = apiDeclaration.registerUser.Params;
            type Response = apiDeclaration.registerUser.Response;

            return function (
                params_: {
                    email: string;
                    secret: string;
                    towardUserEncryptKeyStr: string;
                    encryptedSymmetricKey: string;
                    shouldThrowOnError?: boolean;

                }
            ) {

                const { shouldThrowOnError, ...params } = params_;

                return sendRequest<Params, Response>({
                    methodName,
                    params,
                    shouldThrowOnError
                });

            };

        })(),

        "validateEmail": (() => {

            const { methodName } = apiDeclaration.validateEmail;
            type Params = apiDeclaration.validateEmail.Params;
            type Response = apiDeclaration.validateEmail.Response;

            return function (
                params_: {
                    email: string;
                    activationCode: string;
                    shouldThrowOnError?: boolean;
                }
            ) {

                const { shouldThrowOnError, ...params } = params_;

                return sendRequest<Params, Response>({
                    methodName,
                    params,
                    shouldThrowOnError
                });

            };

        })(),

        "getLoginLogoutApi": (
            dependencyInjectionParams: {
                assertJsRuntimeEnv: "browser";
            } | {
                assertJsRuntimeEnv: "react-native";
                Credentials: typeof import("../localStorage/Credentials").Credentials;
                declaredPushNotificationToken: typeof import("../localStorage/declaredPushNotificationToken")
            }
        ) => {

            assert(
                dependencyInjectionParams.assertJsRuntimeEnv === env.jsRuntimeEnv,
                "Wrong params for js runtime environnement"
            );

            return ({
                /** uaInstanceId should be provided on android/ios and undefined on the web */
                "loginUser": (() => {

                    const { methodName } = apiDeclaration.loginUser;
                    type Params = apiDeclaration.loginUser.Params;
                    type Response = apiDeclaration.loginUser.Response;

                    return async function (
                        params_: {
                            email: string;
                            secret: string;
                            shouldThrowOnError?: boolean;
                        } & ({
                            assertJsRuntimeEnv: "browser";
                        } | {
                            assertJsRuntimeEnv: "react-native";
                            uaInstanceId: string;
                        })
                    ) {

                        assert(params_.assertJsRuntimeEnv === env.jsRuntimeEnv);

                        params_.email = params_.email.toLowerCase();

                        const response = await sendRequest<Params, Response>({
                            methodName,
                            "params": {
                                "email": params_.email,
                                "secret": params_.secret,
                                "uaInstanceId": (() => {
                                    switch (params_.assertJsRuntimeEnv) {
                                        case "browser": return undefined;
                                        case "react-native": return params_.uaInstanceId
                                    }
                                })()
                            },
                            "shouldThrowOnError": params_.shouldThrowOnError
                        });


                        if (response.status !== "SUCCESS") {

                            if (
                                response.status !== "RETRY STILL FORBIDDEN" &&
                                dependencyInjectionParams.assertJsRuntimeEnv === "react-native"
                            ) {
                                await dependencyInjectionParams.Credentials.remove();
                            }

                            return response;
                        }

                        if (params_.assertJsRuntimeEnv === "react-native") {

                            assert(params_.assertJsRuntimeEnv === dependencyInjectionParams.assertJsRuntimeEnv);

                            const { Credentials, declaredPushNotificationToken } = dependencyInjectionParams;

                            await (async () => {

                                const previousCred = await Credentials.isPresent() ?
                                    await Credentials.get() : undefined
                                    ;

                                if (
                                    !!previousCred &&
                                    previousCred.email === params_.email &&
                                    previousCred.secret === params_.secret &&
                                    previousCred.uaInstanceId === params_.uaInstanceId
                                ) {
                                    return;
                                }

                                await Promise.all([
                                    Credentials.set({
                                        "email": params_.email,
                                        "secret": params_.secret,
                                        "uaInstanceId": params_.uaInstanceId!
                                    }),
                                    declaredPushNotificationToken.remove()
                                ]);

                            })();

                        }

                        await AuthenticatedSessionDescriptorSharedData.set({
                            "connect_sid": response.connect_sid,
                            "email": params_.email,
                            "encryptedSymmetricKey": response.encryptedSymmetricKey,
                            "uaInstanceId": (() => {
                                switch (params_.assertJsRuntimeEnv) {
                                    case "browser": return response.webUaInstanceId!;
                                    case "react-native": return params_.uaInstanceId;
                                }
                            })()


                        });

                        return { "status": response.status };

                    }

                })(),
                "logoutUser": (() => {

                    const { methodName } = apiDeclaration.logoutUser;
                    type Params = apiDeclaration.logoutUser.Params;
                    type Response = apiDeclaration.logoutUser.Response;

                    return async function (
                        params_?: {
                            shouldThrowOnError?: boolean;
                        }

                    ) {

                        await sendRequest<Params, Response>({
                            methodName,
                            "params": undefined,
                            "shouldThrowOnError": params_?.shouldThrowOnError
                        });

                        await AuthenticatedSessionDescriptorSharedData.remove();

                        if (dependencyInjectionParams.assertJsRuntimeEnv === "react-native") {
                            await dependencyInjectionParams.Credentials.remove();
                        }


                    };

                })()

            });
        },





        "isUserLoggedIn": (() => {

            const { methodName } = apiDeclaration.isUserLoggedIn;
            type Params = apiDeclaration.isUserLoggedIn.Params;
            type Response = apiDeclaration.isUserLoggedIn.Response;

            return async function (
                params_?: {
                    shouldThrowOnError?: boolean;
                }
            ) {

                if (!(await AuthenticatedSessionDescriptorSharedData.isPresent())) {
                    return false;
                }

                const isLoggedIn = await sendRequest<Params, Response>({
                    methodName,
                    "params": undefined,
                    "shouldThrowOnError": params_?.shouldThrowOnError
                });

                if (!isLoggedIn) {

                    await AuthenticatedSessionDescriptorSharedData.remove();

                }

                return isLoggedIn;

            };

        })(),
        "declareUa": (() => {

            const { methodName } = apiDeclaration.declareUa;
            type Params = apiDeclaration.declareUa.Params;
            type Response = apiDeclaration.declareUa.Response;

            return async function (
                params_: Params & {
                    assertJsRuntimeEnv: "react-native";
                    shouldThrowOnError?: boolean;
                }
            ) {

                assert(params_.assertJsRuntimeEnv === env.jsRuntimeEnv);

                const { assertJsRuntimeEnv, shouldThrowOnError, ...params } = params_;

                await sendRequest<Params, Response>({
                    methodName,
                    params,
                    shouldThrowOnError
                });

            };

        })(),
        /** Return true if email has account */
        "sendRenewPasswordEmail": (() => {

            const { methodName } = apiDeclaration.sendRenewPasswordEmail;
            type Params = apiDeclaration.sendRenewPasswordEmail.Params;
            type Response = apiDeclaration.sendRenewPasswordEmail.Response;

            return function (
                params_: {
                    email: string;
                    shouldThrowOnError?: boolean;
                }
            ) {

                const { shouldThrowOnError, ...params } = params_;

                return sendRequest<Params, Response>({
                    methodName,
                    params,
                    shouldThrowOnError
                });

            };

        })(),
        "renewPassword": (() => {

            const { methodName } = apiDeclaration.renewPassword;
            type Params = apiDeclaration.renewPassword.Params;
            type Response = apiDeclaration.renewPassword.Response;

            return function (
                params_: {
                    email: string;
                    newSecret: string;
                    newTowardUserEncryptKeyStr: string;
                    newEncryptedSymmetricKey: string;
                    token: string;
                    shouldThrowOnError?: boolean;
                }
            ) {


                const { shouldThrowOnError, ...params } = params_;

                return sendRequest<Params, Response>({
                    methodName,
                    params,
                    shouldThrowOnError
                });

            };

        })(),
        "getCountryIso": (() => {

            const { methodName } = apiDeclaration.getCountryIso;
            type Params = apiDeclaration.getCountryIso.Params;
            type Response = apiDeclaration.getCountryIso.Response;

            return function (
                params_?: {
                    shouldThrowOnError?: boolean;
                }
            ) {

                return sendRequest<Params, Response>({
                    methodName,
                    "params": undefined,
                    "shouldThrowOnError": params_?.shouldThrowOnError
                });

            };


        })(),
        "getChangesRates": (() => {

            const { methodName } = apiDeclaration.getChangesRates;
            type Params = apiDeclaration.getChangesRates.Params;
            type Response = apiDeclaration.getChangesRates.Response;

            return function (
                params_?: {
                    shouldThrowOnError?: boolean;
                }
            ) {

                return sendRequest<Params, Response>({
                    methodName,
                    "params": undefined,
                    "shouldThrowOnError": params_?.shouldThrowOnError
                });

            };

        })(),
        "getSubscriptionInfos": (() => {

            const { methodName } = apiDeclaration.getSubscriptionInfos;
            type Params = apiDeclaration.getSubscriptionInfos.Params;
            type Response = apiDeclaration.getSubscriptionInfos.Response;

            return function (
                params_?: {
                    shouldThrowOnError?: boolean;
                }
            ) {

                return sendRequest<Params, Response>({
                    methodName,
                    "params": undefined,
                    "shouldThrowOnError": params_?.shouldThrowOnError
                });

            };


        })(),
        "subscribeOrUpdateSource": (() => {

            const { methodName } = apiDeclaration.subscribeOrUpdateSource;
            type Params = apiDeclaration.subscribeOrUpdateSource.Params;
            type Response = apiDeclaration.subscribeOrUpdateSource.Response;

            return async function (
                params_: {
                    sourceId?: string;
                    shouldThrowOnError?: boolean;
                }
            ) {

                const { sourceId, shouldThrowOnError } = params_;

                await sendRequest<Params, Response>({
                    methodName,
                    "params": { sourceId },
                    shouldThrowOnError
                });

            };

        })(),
        "unsubscribe": (() => {

            const { methodName } = apiDeclaration.unsubscribe;
            type Params = apiDeclaration.unsubscribe.Params;
            type Response = apiDeclaration.unsubscribe.Response;

            return async function (
                params_?: {
                    shouldThrowOnError?: boolean;
                }
            ) {

                await sendRequest<Params, Response>({
                    methodName,
                    "params": undefined,
                    "shouldThrowOnError": params_?.shouldThrowOnError
                });

            };

        })(),
        "createStripeCheckoutSessionForShop": (() => {

            const { methodName } = apiDeclaration.createStripeCheckoutSessionForShop;
            type Params = apiDeclaration.createStripeCheckoutSessionForShop.Params;
            type Response = apiDeclaration.createStripeCheckoutSessionForShop.Response;

            return function (
                params_: {
                    cart: import("../types/shop").Cart;
                    shippingFormData: import("../types/shop").ShippingFormData;
                    currency: string;
                    success_url: string;
                    cancel_url: string;
                    shouldThrowOnError?: boolean;
                }
            ) {

                const { cart,
                    shippingFormData,
                    currency,
                    success_url,
                    cancel_url,
                    shouldThrowOnError
                } = params_;

                return sendRequest<Params, Response>({
                    methodName,
                    "params": {
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
                    },
                    shouldThrowOnError
                });

            };

        })(),
        "createStripeCheckoutSessionForSubscription": (() => {

            const { methodName } = apiDeclaration.createStripeCheckoutSessionForSubscription;
            type Params = apiDeclaration.createStripeCheckoutSessionForSubscription.Params;
            type Response = apiDeclaration.createStripeCheckoutSessionForSubscription.Response;

            return function (
                params_: {
                    currency: string;
                    success_url: string;
                    cancel_url: string;
                    shouldThrowOnError?: boolean;
                }
            ) {

                const { shouldThrowOnError, ...params } = params_;

                return sendRequest<Params, Response>({
                    methodName,
                    params,
                    shouldThrowOnError
                });

            };

        })(),
        "getOrders": (() => {

            const { methodName } = apiDeclaration.getOrders;
            type Params = apiDeclaration.getOrders.Params;
            type Response = apiDeclaration.getOrders.Response;

            return function (
                params_?: {
                    shouldThrowOnError?: boolean;
                }
            ) {

                return sendRequest<Params, Response>({
                    methodName,
                    "params": undefined,
                    "shouldThrowOnError": params_?.shouldThrowOnError
                });

            };

        })()

    };


}

export namespace getWebApi {

    export let hasBeenCalled = false;

}









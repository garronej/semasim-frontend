import * as apiDeclaration from "../../web_api_declaration";
import { WebApiError } from "./sendRequest";
export declare type WebApi = Exclude<ReturnType<typeof getWebApi>, "getLoginLogoutApi"> & ReturnType<ReturnType<typeof getWebApi>["getLoginLogoutApi"]>;
export declare function getWebApi(params: {
    AuthenticatedSessionDescriptorSharedData: typeof import("../localStorage/AuthenticatedSessionDescriptorSharedData").AuthenticatedSessionDescriptorSharedData;
    restartApp: import("../restartApp").RestartApp;
    networkStateMonitoringApi: import("../networkStateMonitoring").NetworkStateMonitoring;
}): {
    WebApiError: typeof WebApiError;
    registerUser: (params_: {
        email: string;
        secret: string;
        towardUserEncryptKeyStr: string;
        encryptedSymmetricKey: string;
        shouldThrowOnError?: boolean | undefined;
    }) => Promise<apiDeclaration.registerUser.Response>;
    validateEmail: (params_: {
        email: string;
        activationCode: string;
        shouldThrowOnError?: boolean | undefined;
    }) => Promise<boolean>;
    getLoginLogoutApi: (dependencyInjectionParams: {
        assertJsRuntimeEnv: "browser";
    } | {
        assertJsRuntimeEnv: "react-native";
        Credentials: typeof import("../localStorage/Credentials").Credentials;
        declaredPushNotificationToken: typeof import("../localStorage/declaredPushNotificationToken");
    }) => {
        /** uaInstanceId should be provided on android/ios and undefined on the web */
        loginUser: (params_: {
            email: string;
            secret: string;
            shouldThrowOnError?: boolean;
        } & ({
            assertJsRuntimeEnv: "browser";
        } | {
            assertJsRuntimeEnv: "react-native";
            uaInstanceId: string;
        })) => Promise<{
            status: "NO SUCH ACCOUNT";
        } | {
            status: "WRONG PASSWORD";
            retryDelay: number;
        } | {
            status: "RETRY STILL FORBIDDEN";
            retryDelayLeft: number;
        } | {
            status: "NOT VALIDATED YET";
        } | {
            status: "SUCCESS";
        }>;
        logoutUser: (params_?: {
            shouldThrowOnError?: boolean | undefined;
        } | undefined) => Promise<void>;
    };
    isUserLoggedIn: (params_?: {
        shouldThrowOnError?: boolean | undefined;
    } | undefined) => Promise<boolean>;
    declareUa: (params_: apiDeclaration.declareUa.Params & {
        assertJsRuntimeEnv: "react-native";
        shouldThrowOnError?: boolean | undefined;
    }) => Promise<void>;
    /** Return true if email has account */
    sendRenewPasswordEmail: (params_: {
        email: string;
        shouldThrowOnError?: boolean | undefined;
    }) => Promise<boolean>;
    renewPassword: (params_: {
        email: string;
        newSecret: string;
        newTowardUserEncryptKeyStr: string;
        newEncryptedSymmetricKey: string;
        token: string;
        shouldThrowOnError?: boolean | undefined;
    }) => Promise<boolean>;
    getCountryIso: (params_?: {
        shouldThrowOnError?: boolean | undefined;
    } | undefined) => Promise<apiDeclaration.getCountryIso.Response>;
    getChangesRates: (params_?: {
        shouldThrowOnError?: boolean | undefined;
    } | undefined) => Promise<apiDeclaration.getChangesRates.Response>;
    getSubscriptionInfos: (params_?: {
        shouldThrowOnError?: boolean | undefined;
    } | undefined) => Promise<import("../types/subscription").SubscriptionInfos>;
    subscribeOrUpdateSource: (params_: {
        sourceId?: string | undefined;
        shouldThrowOnError?: boolean | undefined;
    }) => Promise<void>;
    unsubscribe: (params_?: {
        shouldThrowOnError?: boolean | undefined;
    } | undefined) => Promise<void>;
    createStripeCheckoutSessionForShop: (params_: {
        cart: import("../types/shop").Cart;
        shippingFormData: import("../types/shop").ShippingFormData;
        currency: string;
        success_url: string;
        cancel_url: string;
        shouldThrowOnError?: boolean | undefined;
    }) => Promise<apiDeclaration.createStripeCheckoutSessionForShop.Response>;
    createStripeCheckoutSessionForSubscription: (params_: {
        currency: string;
        success_url: string;
        cancel_url: string;
        shouldThrowOnError?: boolean | undefined;
    }) => Promise<apiDeclaration.createStripeCheckoutSessionForSubscription.Response>;
    getOrders: (params_?: {
        shouldThrowOnError?: boolean | undefined;
    } | undefined) => Promise<apiDeclaration.getOrders.Response>;
};
export declare namespace getWebApi {
    let hasBeenCalled: boolean;
}

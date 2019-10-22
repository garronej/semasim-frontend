import * as apiDeclaration from "../../web_api_declaration";
import { WebApiError } from "./sendRequest";
export { WebApiError };
export declare function setCanRequestThrowToTrueForNextMethodCall(): void;
export declare const registerUser: (email: string, secret: string, towardUserEncryptKeyStr: string, encryptedSymmetricKey: string) => Promise<apiDeclaration.registerUser.Response>;
export declare const validateEmail: (email: string, activationCode: string) => Promise<boolean>;
/** uaInstanceId should be provided on android/iOS and undefined on the web */
export declare const loginUser: (email: string, secret: string, uaInstanceId: string | undefined) => Promise<{
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
    "status": "SUCCESS";
}>;
export declare const isUserLoggedIn: () => Promise<boolean>;
export declare const declareUa: (params: apiDeclaration.declareUa.Params) => Promise<void>;
export declare const logoutUser: () => Promise<void>;
/** Return true if email has account */
export declare const sendRenewPasswordEmail: (email: string) => Promise<boolean>;
export declare const renewPassword: (email: string, newSecret: string, newTowardUserEncryptKeyStr: string, newEncryptedSymmetricKey: string, token: string) => Promise<boolean>;
export declare const getCountryIso: () => Promise<apiDeclaration.getCountryIso.Response>;
export declare const getChangesRates: () => Promise<apiDeclaration.getChangesRates.Response>;
export declare const getSubscriptionInfos: () => Promise<import("../types/subscription").SubscriptionInfos>;
export declare const subscribeOrUpdateSource: (sourceId?: string | undefined) => Promise<void>;
export declare const unsubscribe: () => Promise<void>;
export declare const createStripeCheckoutSessionForShop: (cart: import("../types/shop").Cart.Entry[], shippingFormData: import("../types/shop").ShippingFormData, currency: string, success_url: string, cancel_url: string) => Promise<apiDeclaration.createStripeCheckoutSessionForShop.Response>;
export declare const createStripeCheckoutSessionForSubscription: (currency: string, success_url: string, cancel_url: string) => Promise<apiDeclaration.createStripeCheckoutSessionForSubscription.Response>;
export declare const getOrders: () => Promise<{
    date: Date;
    orderCart: {
        orderProduct: {
            name: string;
            description: string;
            cartImageUrl: string;
        };
        quantity: number;
    }[];
    isShipped: boolean;
    trackingUrl: string | undefined;
    stripeShippingInformation: import("../types/shop").StripeShippingInformation;
}[]>;

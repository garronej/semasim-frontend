import * as apiDeclaration from "../web_api_declaration";
export declare const registerUser: (email: string, secret: string, towardUserEncryptKeyStr: string, encryptedSymmetricKey: string) => Promise<apiDeclaration.registerUser.Response>;
export declare const validateEmail: (email: string, activationCode: string) => Promise<boolean>;
export declare const loginUser: (email: string, secret: string) => Promise<apiDeclaration.loginUser.Response>;
export declare const logoutUser: () => Promise<undefined>;
/** Return true if email has account */
export declare const sendRenewPasswordEmail: (email: string) => Promise<boolean>;
export declare const renewPassword: (email: string, newSecret: string, newTowardUserEncryptKeyStr: string, newEncryptedSymmetricKey: string, token: string) => Promise<boolean>;
export declare const getCountryIso: () => Promise<apiDeclaration.getCountryIso.Response>;
export declare const getChangesRates: () => Promise<apiDeclaration.getChangesRates.Response>;
export declare const getSubscriptionInfos: () => Promise<import("./types/subscription").SubscriptionInfos>;
export declare const subscribeOrUpdateSource: (sourceId?: string | undefined) => Promise<void>;
export declare const unsubscribe: () => Promise<void>;
export declare const createStripeCheckoutSessionForShop: (cart: import("./types/shop").Cart.Entry[], shippingFormData: import("./types/shop").ShippingFormData, currency: string, success_url: string, cancel_url: string) => Promise<apiDeclaration.createStripeCheckoutSessionForShop.Response>;
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
    stripeShippingInformation: import("./types/shop").StripeShippingInformation;
}[]>;

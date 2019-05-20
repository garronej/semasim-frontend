import * as apiDeclaration from "../web_api_declaration";
export declare function registerUser(email: string, password: string): Promise<apiDeclaration.registerUser.Response>;
export declare function validateEmail(email: string, activationCode: string): Promise<boolean>;
export declare function loginUser(email: string, password: string): Promise<apiDeclaration.loginUser.Response>;
export declare function logoutUser(): Promise<undefined>;
/** Return true if email has account */
export declare function sendRenewPasswordEmail(email: string): Promise<boolean>;
export declare function renewPassword(email: string, newPassword: string, token: string): Promise<boolean>;
export declare function getCountryIso(): Promise<apiDeclaration.getCountryIso.Response>;
export declare function getChangesRates(): Promise<apiDeclaration.getChangesRates.Response>;
export declare function getSubscriptionInfos(): Promise<import("./types/subscription").SubscriptionInfos>;
export declare function subscribeOrUpdateSource(sourceId?: string): Promise<void>;
export declare function unsubscribe(): Promise<void>;
export declare function createStripeCheckoutSessionForShop(cart: import("./types/shop").Cart, shippingFormData: import("./types/shop").ShippingFormData, currency: string, success_url: string, cancel_url: string): Promise<apiDeclaration.createStripeCheckoutSessionForShop.Response>;
export declare function createStripeCheckoutSessionForSubscription(currency: string, success_url: string, cancel_url: string): Promise<apiDeclaration.createStripeCheckoutSessionForSubscription.Response>;
export declare function getOrders(): Promise<{
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

import * as apiDeclaration from "../web_api_declaration";
export declare function registerUser(email: string, password: string): Promise<apiDeclaration.registerUser.Response>;
export declare function validateEmail(email: string, activationCode: string): Promise<boolean>;
export declare function loginUser(email: string, password: string): Promise<apiDeclaration.loginUser.Response>;
export declare function logoutUser(): Promise<undefined>;
/** Return true if email has account */
export declare function sendRenewPasswordEmail(email: string): Promise<boolean>;
export declare function renewPassword(email: string, newPassword: string, token: string): Promise<boolean>;
export declare function getCountryIso(): Promise<apiDeclaration.getCountryIso.Response>;
export declare namespace guessCountryIso {
    let cacheOut: string | undefined;
}
export declare function getChangesRates(): Promise<apiDeclaration.getChangesRates.Response>;
export declare function getSubscriptionInfos(): Promise<import("./types").SubscriptionInfos>;
export declare function subscribeOrUpdateSource(sourceId?: string): Promise<void>;
export declare function unsubscribe(): Promise<void>;
export declare function createStripeCheckoutSession(cart: import("./types").shop.Cart, shippingFormData: import("./types").shop.ShippingFormData, currency: string): Promise<apiDeclaration.createStripeCheckoutSession.Response>;

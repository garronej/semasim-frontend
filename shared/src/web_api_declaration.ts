
export const apiPath = "api";


export namespace registerUser {

    export const methodName = "register-user";

    export type Params = {
        email: string;
        password: string;
    };

    export type Response = "CREATED" | "CREATED NO ACTIVATION REQUIRED" | "EMAIL NOT AVAILABLE";

}

export namespace validateEmail {

    export const methodName= "validate-email";

    export type Params = {
        email: string;
        activationCode: string;
    };

    export type Response = boolean;

}

export namespace loginUser {

    export const methodName = "login-user";

    export type Params = {
        email: string;
        password: string;
    };

    /** isGranted */
    export type Response = {
        status: "SUCCESS";
    } | {
        status: "NO SUCH ACCOUNT";
    } | {
        status: "WRONG PASSWORD";
        retryDelay: number;
    } | {
        status: "RETRY STILL FORBIDDEN"
        retryDelayLeft: number;
    } | {
        status: "NOT VALIDATED YET"
    };

}

export namespace logoutUser {

    export const methodName = "logout-user";

    export type Params = undefined;

    export type Response = undefined;

}

export namespace sendRenewPasswordEmail {

    export const methodName = "send-renew-password-email";

    export type Params = {
        email: string;
    };

    /** true if email exist */
    export type Response = boolean;

}

export namespace renewPassword {

    export const methodName= "renew-password";

    export type Params= {
        email: string;
        newPassword: string;
        token: string;
    };

    /** return false if the token have expired */
    export type Response= boolean;

}

export namespace getCountryIso {

    export const methodName = "guess-country-iso";

    export type Params = undefined;

    export type Response = {
        language: string | undefined;
        location: string | undefined;
    };

}

export namespace getChangesRates {

    export const methodName= "get-changes-rates";

    export type Params = undefined;

    export type Response= { [currency: string]: number; };

}

export namespace getSubscriptionInfos {

    export const methodName = "get-subscription-infos";

    export type Params = undefined;

    export type Response = import("./lib/types/subscription").SubscriptionInfos;

}

export namespace subscribeOrUpdateSource {

    export const methodName = "subscribe-or-update-source";

    export type Params = { sourceId?: string; };

    export type Response = undefined;

}

export namespace unsubscribe {

    export const methodName = "unsubscribe";

    export type Params = undefined;

    export type Response = undefined;

}

export namespace createStripeCheckoutSessionForShop {

    export const methodName = "create-stripe-checkout-session-for-shop";

    export type Params= {
        cartDescription: { productName: string; quantity: number; }[];
        shippingFormData: import("./lib/types/shop").ShippingFormData;
        currency: string;
        success_url: string;
        cancel_url: string;
    };

    export type Response= {
        stripePublicApiKey: string;
        checkoutSessionId: string;
    };

}

export namespace createStripeCheckoutSessionForSubscription {

    export const methodName = "create-stripe-checkout-session-for-subscription";

    export type Params= { 
        currency: string; 
        success_url: string;
        cancel_url: string;
    };

    export type Response= {
        stripePublicApiKey: string;
        checkoutSessionId: string;
    };

}

export namespace getOrders {

    export const methodName = "get-orders";

    export type Params = undefined;

    export type Response = {
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
        stripeShippingInformation: import("./lib/types/shop").StripeShippingInformation;
    }[];


}



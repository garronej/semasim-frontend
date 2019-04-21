export declare const apiPath = "api";
export declare namespace registerUser {
    const methodName = "register-user";
    type Params = {
        email: string;
        password: string;
    };
    type Response = "CREATED" | "CREATED NO ACTIVATION REQUIRED" | "EMAIL NOT AVAILABLE";
}
export declare namespace validateEmail {
    const methodName = "validate-email";
    type Params = {
        email: string;
        activationCode: string;
    };
    type Response = boolean;
}
export declare namespace loginUser {
    const methodName = "login-user";
    type Params = {
        email: string;
        password: string;
    };
    /** isGranted */
    type Response = {
        status: "SUCCESS";
    } | {
        status: "NO SUCH ACCOUNT";
    } | {
        status: "WRONG PASSWORD";
        retryDelay: number;
    } | {
        status: "RETRY STILL FORBIDDEN";
        retryDelayLeft: number;
    } | {
        status: "NOT VALIDATED YET";
    };
}
export declare namespace logoutUser {
    const methodName = "logout-user";
    type Params = undefined;
    type Response = undefined;
}
export declare namespace sendRenewPasswordEmail {
    const methodName = "send-renew-password-email";
    type Params = {
        email: string;
    };
    /** true if email exist */
    type Response = boolean;
}
export declare namespace renewPassword {
    const methodName = "renew-password";
    type Params = {
        email: string;
        newPassword: string;
        token: string;
    };
    /** return false if the token have expired */
    type Response = boolean;
}
export declare namespace getCountryIso {
    const methodName = "guess-country-iso";
    type Params = undefined;
    type Response = {
        language: string | undefined;
        location: string | undefined;
    };
}
export declare namespace getChangesRates {
    const methodName = "get-changes-rates";
    type Params = undefined;
    type Response = {
        [currency: string]: number;
    };
}
export declare namespace getSubscriptionInfos {
    const methodName = "get-subscription-infos";
    type Params = undefined;
    type Response = import("./lib/types").SubscriptionInfos;
}
export declare namespace subscribeOrUpdateSource {
    const methodName = "subscribe-or-update-source";
    type Params = {
        sourceId?: string;
    };
    type Response = undefined;
}
export declare namespace unsubscribe {
    const methodName = "unsubscribe";
    type Params = undefined;
    type Response = undefined;
}
export declare namespace createStripeCheckoutSession {
    const methodName = "create-stripe-checkout-session";
    type Params = {
        cartDescription: {
            productName: string;
            quantity: number;
        }[];
        shippingFormData: import("./lib/types").shop.ShippingFormData;
        currency: string;
    };
    type Response = {
        stripePublicApiKey: string;
        checkoutSessionId: string;
    };
}
export declare namespace getOrders {
    const methodName = "get-orders";
    type Params = undefined;
    type Response = {
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
        stripeShippingInformation: import("./lib/types").shop.StripeShippingInformation;
    }[];
}

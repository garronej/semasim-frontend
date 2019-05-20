
export type SubscriptionInfos = SubscriptionInfos.Regular | {
    customerStatus: "EXEMPTED";
};

export namespace SubscriptionInfos {

    export type Regular = {
        customerStatus: "REGULAR";
        stripePublicApiKey: string;
        pricingByCurrency: { [currency: string]: number; };
        source?: SubscriptionInfos.Source;
        subscription?: SubscriptionInfos.Subscription;
        due?: SubscriptionInfos.Due;
    };

    export type Source = {
        isChargeable: boolean;
        lastDigits: string;
        expiration: string;
        currency: string;
    };

    export type Subscription = {
        cancel_at_period_end: boolean;
        current_period_end: Date;
        currency: string;
    };

    export type Due = {
        value: number;
        currency: string;
    };

}
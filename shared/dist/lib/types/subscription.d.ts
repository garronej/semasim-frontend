export declare type SubscriptionInfos = SubscriptionInfos.Regular | {
    customerStatus: "EXEMPTED";
};
export declare namespace SubscriptionInfos {
    type Regular = {
        customerStatus: "REGULAR";
        stripePublicApiKey: string;
        pricingByCurrency: {
            [currency: string]: number;
        };
        source?: SubscriptionInfos.Source;
        subscription?: SubscriptionInfos.Subscription;
        due?: SubscriptionInfos.Due;
    };
    type Source = {
        isChargeable: boolean;
        lastDigits: string;
        expiration: string;
        currency: string;
    };
    type Subscription = {
        cancel_at_period_end: boolean;
        current_period_end: Date;
        currency: string;
    };
    type Due = {
        value: number;
        currency: string;
    };
}

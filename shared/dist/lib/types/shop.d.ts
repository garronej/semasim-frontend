export declare type Footprint = "FLAT" | "VOLUME";
/**
 * images: w/h = 1.5 & w >= 445px
 * cart image: w/h = 1.5 & h >= 80px
 */
export declare type Product = {
    name: string;
    shortDescription: string;
    description: string;
    cartImageUrl: string;
    imageUrls: string[];
    price: Price;
    footprint: Footprint;
    weight: number;
};
export declare type Cart = Cart.Entry[];
export declare namespace Cart {
    type Entry = {
        product: Product;
        quantity: number;
    };
    function getPrice(cart: Cart, convertFromEuro: ConvertFromEuro): Price;
    function getOverallFootprint(cart: Cart): Footprint;
    function getOverallWeight(cart: Cart): number;
}
export declare type ConvertFromEuro = (euroAmount: number, currencyTo: string) => number;
export declare type Price = {
    "eur": number;
} & {
    [currency: string]: number;
};
export declare namespace Price {
    /**
     * Out of place.
     * If the amount for a currency is defined in one object
     * but not in the other the undefined amount will be
     * computed from the rateChange
     *
     */
    function binaryOperation(price1: Price, price2: Price, op: (amount1: number, amount2: number) => number, convertFromEuro: ConvertFromEuro): Price;
    function operation(price: Price, op: (amount: number) => number): Price;
    function addition(price1: Price, price2: Price, convertFromEuro: ConvertFromEuro): Price;
    /**
     * return the amount of a price in a given currency.
     * If the amount for the currency is not defined in
     * the price object it will be computer from the
     * euro amount.
     * */
    function getAmountInCurrency(price: Price, currency: string, convertFromEuro: ConvertFromEuro): number;
    function prettyPrint(price: Price, currency: string, convertFromEuro: ConvertFromEuro): string;
}
export declare type ShippingFormData = {
    firstName: string;
    lastName: string;
    addressComponents: {
        long_name: string;
        short_name: string;
        types: string[];
    }[];
    addressExtra: string | undefined;
};
export declare namespace ShippingFormData {
    function toStripeShippingInformation(shippingFormData: ShippingFormData, carrier: string): StripeShippingInformation;
}
export declare type StripeShippingInformation = {
    name: string;
    address: {
        line1: string;
        line2?: string;
        postal_code: string;
        city: string;
        state: string;
        country: string;
    };
    carrier: string;
};

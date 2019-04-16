export declare const data: {
    [currency: string]: {
        symbol: string;
        name: string;
        countriesIso: string[];
    };
};
export declare function isValidCountryIso(countryIso: string): boolean;
export declare namespace isValidCountryIso {
    let countryIsoRecord: {
        [countryIso: string]: true;
    } | undefined;
}
export declare function getCountryCurrency(countryIso: string): string;
export declare namespace getCountryCurrency {
    const cache: {
        [countryIso: string]: string;
    };
}
export declare function convertFromEuro(euroAmount: number, currencyTo: string): number;
export declare namespace convertFromEuro {
    let changeRates: {
        [currency: string]: number;
    } | undefined;
}
/**
 * get currency of stripe card,
 * if there is no special pricing for the currency
 * "eur" will be returned.
 *
 * NOTE: This function does seems to come out of left field
 * but this operation is done on the frontend and the backend
 * so we export it.
 *
 */
export declare function getCardCurrency(stripeCard: {
    country: string;
}, pricingByCurrency: {
    [currency: string]: number;
}): string;
export declare function prettyPrint(amount: number, currency: string): string;

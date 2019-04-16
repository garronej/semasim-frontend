//NOTE: Assert jQuery loaded on the page
declare const require: (path: string) => any;

export const data: { 
    [currency: string]: { 
        symbol: string; 
        name: string; 
        countriesIso: string[] 
    }; 
}= require("../../../res/currency.json");

export function isValidCountryIso(countryIso: string): boolean {

    //NOTE: Avoid loading if we do not need
    if( isValidCountryIso.countryIsoRecord === undefined ){

        isValidCountryIso.countryIsoRecord= (()=>{

            const out: typeof isValidCountryIso.countryIsoRecord = {};

            for (const currency of Object.keys(data)) {

                for( const countryIso of data[currency].countriesIso ){

                    out[countryIso]= true;

                }

            }

            return out;

        })();

        return isValidCountryIso(countryIso);

    }

    if( typeof countryIso !== "string" || !/^[a-z]{2}$/.test(countryIso) ){
        return false;
    }

    return !!isValidCountryIso.countryIsoRecord[countryIso];

}

export namespace isValidCountryIso {

    export let countryIsoRecord: { [countryIso: string]: true; } | undefined = undefined;

}

export function getCountryCurrency(countryIso: string): string {

    const cache = getCountryCurrency.cache;

    {

        const currency = cache[countryIso];

        if (currency !== undefined) {
            return currency;
        }

    }

    cache[countryIso] = Object.keys(data)
        .map(currency => ({ currency, "countriesIso": data[currency].countriesIso }))
        .find(({ countriesIso }) => !!countriesIso.find(_countryIso => _countryIso === countryIso))!
        .currency;

    return getCountryCurrency(countryIso);

}
export namespace getCountryCurrency {

    export const cache: { [countryIso: string]: string; } = {};

}

export function convertFromEuro(euroAmount: number, currencyTo: string) {

    const changeRates = convertFromEuro.changeRates;

    if (changeRates === undefined) {
        throw new Error("Changes rates have not been defined");
    }

    return euroAmount * changeRates[currencyTo];

}

export namespace convertFromEuro {

    export let changeRates: { [currency: string]: number } | undefined = undefined;

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
export function getCardCurrency(
    stripeCard: { country: string; },
    pricingByCurrency: { [currency: string]: number; }
): string {

    let currency = getCountryCurrency(
        stripeCard.country.toLowerCase()
    );

    if (!(currency in pricingByCurrency)) {
        currency = "eur";
    }

    return currency;

}

export function prettyPrint(amount: number, currency: string): string {

    return (amount / 100).toLocaleString(
        undefined,
        {
            "style": "currency",
            currency
        }
    );

}


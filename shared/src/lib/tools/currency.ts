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

/** Must define convertFromEuro.changeRates first */
export function convertFromEuro(euroAmount: number, currencyTo: string) {
    return Math.round(euroAmount * convertFromEuro.getChangeRates()[currencyTo]);
}

export namespace convertFromEuro {

    export type ChangeRates= { [currency: string]: number };

    let changeRates_: ChangeRates | undefined = undefined;

    let lastUpdateDate: Date= new Date(0);

    export function setChangeRates(changeRates: ChangeRates){
        lastUpdateDate= new Date();
        changeRates_ = changeRates;
    }

    export function getChangeRates(): ChangeRates {

        if( changeRates_ === undefined ){
            throw new Error("Change rates not defined");
        }

        return changeRates_;

    }

    let updater: { 
        fetchChangeRates: ()=> Promise<ChangeRates>; 
        ttl: number 
    } | undefined = undefined;

    export function setChangeRatesFetchMethod(
        fetchChangeRates: ()=> Promise<ChangeRates>,
        ttl: number
    ){
        updater = { fetchChangeRates, ttl };
    }

    export async function refreshChangeRates() {

        if (updater === undefined) {
            throw new Error("No method for updating rates changes have been defined");
        }

        if (Date.now() - lastUpdateDate.getTime() < updater.ttl) {
            return;
        }

        try {

            setChangeRates(
                await updater.fetchChangeRates()
            );

        } catch (error) {

            if (lastUpdateDate.getTime() === 0) {
                throw error;
            }

        }

    }

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



//NOTE: Assert jQuery loaded on the page

export function convertFromEuro(euroAmount: number, currencyTo: string) {

    const rates = convertFromEuro.rates;

    if (rates === undefined) {
        throw new Error("fetch rate changes first");
    }

    return euroAmount * rates[currencyTo];

}

export namespace convertFromEuro {

    export let rates: { [currency: string]: number } | undefined = undefined;

    export async function fetchChangesRates() {

        if (rates !== undefined) {
            return;
        }

        const { rates: _rates } = await new Promise(
            (resolve, reject) => (window["$"] as JQueryStatic).ajax({
                "url": "https://api.exchangeratesapi.io/latest",
                "method": "GET",
                "dataType": "text",
                "error": (_jqXHR, textStatus, errorThrown) => reject(new Error(`${textStatus} ${errorThrown}`)),
                "statusCode": {
                    "200": (data: string) => resolve(JSON.parse(data))
                }
            })
        );

        rates = {};

        for (const upperCaseCurrency in _rates) {

            rates[upperCaseCurrency.toLowerCase()] = _rates[upperCaseCurrency] * 100;

        }

    }

}


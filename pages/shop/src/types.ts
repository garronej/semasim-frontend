export type Footprint= "FLAT" | "VOLUME";

/**
 * images: w/h = 1.5 & w >= 445px
 * cart image: w/h = 1.5 & h >= 80px
 */
export type Product = {
    name: string;
    shortDescription: string;
    description: string;
    cartImageUrl: string;
    imageUrls: string[];
    price: Price;
    footprint: Footprint;
};


export type Cart = Cart.Entry[];

export namespace Cart {

    export type Entry = {
        product: Product;
        quantity: number;
    };

    export function getPrice(cart: Cart, convertFromEuro: ConvertFromEuro): Price {

        const out = cart
            .map(({ product: { price }, quantity }) => Price.operation(price, amount => amount * quantity))
            .reduce((out, price) => Price.addition(out, price, convertFromEuro), { "eur": 0 })
            ;

        //console.log("Cart.getGoodsPrice: ", JSON.stringify({ cart, out }, null, 2));

        return out;

    }

    export function getOverallFootprint(cart: Cart): Footprint {
        return !!cart.find(({ product }) => product.footprint === "VOLUME") ? "VOLUME" : "FLAT";
    }

}

export type ConvertFromEuro = (euroAmount: number, currencyTo: string) => number;

export type Price = { "eur": number; } & { [currency: string]: number; };

export namespace Price {

    /*
    export const getZero: () => Price = (() => {

        const zero: Price = (() => {

            const out: Price = { "eur": 0 };

            for (const iso in currencyByCountry) {

                out[currencyByCountry[iso]] = 0;

            }

            return out;

        })();

        return () => ({ ...zero });

    })();
    */

    /** 
     * Out of place.
     * If the amount for a currency is defined in one object
     * but not in the other the undefined amount will be 
     * computed from the rateChange
     * 
     */
    export function binaryOperation(
        price1: Price,
        price2: Price,
        op: (amount1: number, amount2: number) => number,
        convertFromEuro: ConvertFromEuro,
    ): Price {

        price1 = { ...price1 };
        price2 = { ...price2 };


        //NOTE: Ugly but does not involve map and less verbose.
        for (const currency of [...Object.keys(price1), ...Object.keys(price2)]) {
            for (const price of [price1, price2]) {
                if (!(currency in price)) {
                    price[currency] = convertFromEuro(price["eur"], currency);
                }
            }
        }

        const out: Price = { "eur": 0 };

        for (const currency in price1) {

            out[currency] = op(price1[currency], price2[currency]);

        }

        return out;

    }

    export function operation(
        price: Price,
        op: (amount: number) => number
    ): Price {

        const out: Price = { "eur": 0 };

        for (const currency in price) {

            out[currency] = op(price[currency]);

        }

        return out;

    }

    export function addition(
        price1: Price,
        price2: Price,
        convertFromEuro: ConvertFromEuro
    ): Price {
        return binaryOperation(
            price1,
            price2,
            (amount1, amount2) => amount1 + amount2,
            convertFromEuro
        );
    }

    /** 
     * return the amount of a price in a given currency.
     * If the amount for the currency is not defined in
     * the price object it will be computer from the
     * euro amount.
     * */
    export function getAmountInCurrency(
        price: Price,
        currency: string,
        convertFromEuro: ConvertFromEuro
    ) {
        return currency in price ?
            price[currency] :
            convertFromEuro(price["eur"], currency)
            ;
    }

    export function prettyPrint(
        price: Price,
        currency: string,
        convertFromEuro: ConvertFromEuro
    ): string {

        return (getAmountInCurrency(
            price,
            currency,
            convertFromEuro
        ) / 100).toLocaleString(
            undefined,
            {
                "style": "currency",
                currency
            }
        );

    }


};


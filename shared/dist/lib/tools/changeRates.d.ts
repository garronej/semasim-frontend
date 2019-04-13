export declare function convertFromEuro(euroAmount: number, currencyTo: string): number;
export declare namespace convertFromEuro {
    let rates: {
        [currency: string]: number;
    } | undefined;
    function fetchChangesRates(): Promise<void>;
}

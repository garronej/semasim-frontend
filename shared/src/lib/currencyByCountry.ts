
declare const require: (path: string) => any;

export const currencyByCountry: { [iso: string]: string; }= require("../../res/currency.json");


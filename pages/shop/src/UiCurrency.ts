
//NOTE: Assert Select2 v4.0.6-rc.0 loaded.

import { loadUiClassHtml } from "../../../shared/dist/lib/loadUiClassHtml";
import { SyncEvent } from "ts-events-extended";
import * as currencyLib from "../../../shared/dist/lib/tools/currency";

declare const require: any;

const html = loadUiClassHtml(
    require("../templates/UiCurrency.html"),
    "UiCurrency"
);

require("../templates/UiCurrency.less");

export class UiCurrency {

    public readonly structure = html.structure.clone();

    public readonly evtChange = new SyncEvent<string>();

    constructor(currency: string) {

        this.structure.find("select")["select2"]();

        this.change(currency);

    }

    public change(currency: string) {

        const { symbol, name } = currencyLib.data[currency];

        this.structure.find(".id_currency").text(`${symbol} ( ${name} )`);

        this.evtChange.post(currency);

    }

}

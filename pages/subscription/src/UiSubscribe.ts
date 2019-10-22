import { loadUiClassHtml } from "frontend-shared/dist/lib/loadUiClassHtml";
import { VoidSyncEvent } from "frontend-shared/node_modules/ts-events-extended";
import * as currencyLib from "frontend-shared/dist/tools/currency";

declare const require: (path: string) => any;

const html = loadUiClassHtml(
    require("../templates/UiSubscribe.html"),
    "UiSubscribe"
);

export class UiSubscribe {

    public readonly structure = html.structure.clone();

    public readonly evtRequestSubscribe = new VoidSyncEvent();

    constructor(currency: string, amount: number) {

        this.structure.find(".id_amount").text(
            currencyLib.prettyPrint(amount, currency)
        );

        this.structure.find("button")
            .on("click", () => this.evtRequestSubscribe.post())
            ;

    }

}


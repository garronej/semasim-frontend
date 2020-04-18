import { loadUiClassHtml } from "frontend-shared/dist/lib/loadUiClassHtml";
import { Evt } from "frontend-shared/node_modules/evt";
import * as currencyLib from "frontend-shared/dist/tools/currency";

declare const require: (path: string) => any;

const html = loadUiClassHtml(
    require("../templates/UiSubscribe.html"),
    "UiSubscribe"
);

export class UiSubscribe {

    public readonly structure = html.structure.clone();

    public readonly evtRequestSubscribe = Evt.asNonPostable(Evt.create());

    constructor(currency: string, amount: number) {

        this.structure.find(".id_amount").text(
            currencyLib.prettyPrint(amount, currency)
        );

        this.structure.find("button")
            .on("click", () => Evt.asPostable(this.evtRequestSubscribe).post())
            ;

    }

}


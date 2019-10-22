import { loadUiClassHtml } from "frontend-shared/dist/lib/loadUiClassHtml";
import * as types from "frontend-shared/dist/lib/types/subscription";
import * as currencyLib from "frontend-shared/dist/tools/currency";

declare const require: (path: string) => any;

const html = loadUiClassHtml(
    require("../templates/UiNegativeBalanceWarning.html"),
    "UiNegativeBalanceWarning"
);

export class UiNegativeBalanceWarning {

    public readonly structure = html.structure.clone();

    constructor(due: types.SubscriptionInfos.Due) {


        this.structure.find(".id_val")
            .text(currencyLib.prettyPrint(due.value, due.currency))
            ;

    }

}


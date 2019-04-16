import { loadUiClassHtml } from "../../../shared/dist/lib/loadUiClassHtml";
import * as types from "../../../shared/dist/lib/types";
import * as currencyLib from "../../../shared/dist/lib/tools/currency";

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


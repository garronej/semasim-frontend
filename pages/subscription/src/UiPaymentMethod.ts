import { loadUiClassHtml } from "frontend-shared/dist/lib/loadUiClassHtml";
import * as types from "frontend-shared/dist/lib/types/subscription";
import { Evt } from "frontend-shared/node_modules/evt";

declare const require: (path: string) => any;

const html = loadUiClassHtml(
    require("../templates/UiPaymentMethod.html"),
    "UiPaymentMethod"
);

require("../templates/UiPaymentMethod.less");

export class UiPaymentMethod {

    public readonly structure = html.structure.clone();
    public readonly evtRequestUpdate = Evt.asNonPostable(Evt.create());

    constructor(s: types.SubscriptionInfos.Source) {

        this.structure.find(".alert")[s.isChargeable ? "hide" : "show"]();
        this.structure.find(".id_last4").text(s.lastDigits);
        this.structure.find(".id_expire").text(s.expiration);

        this.structure.find("button")
            .on("click", () => Evt.asPostable(this.evtRequestUpdate).post())
            ;

    }


}


import { loadUiClassHtml } from "../../../shared/dist/lib/loadUiClassHtml";
import * as types from "../../../shared/dist/lib/types/subscription";
import { VoidSyncEvent } from "ts-events-extended";

declare const require: (path: string) => any;

const html = loadUiClassHtml(
    require("../templates/UiPaymentMethod.html"),
    "UiPaymentMethod"
);

require("../templates/UiPaymentMethod.less");

export class UiPaymentMethod {

    public readonly structure = html.structure.clone();
    public readonly evtRequestUpdate = new VoidSyncEvent();

    constructor(s: types.SubscriptionInfos.Source) {

        this.structure.find(".alert")[s.isChargeable ? "hide" : "show"]();
        this.structure.find(".id_last4").text(s.lastDigits);
        this.structure.find(".id_expire").text(s.expiration);

        this.structure.find("button")
            .on("click", () => this.evtRequestUpdate.post())
            ;

    }


}


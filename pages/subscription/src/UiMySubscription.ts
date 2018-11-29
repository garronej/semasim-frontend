import { loadUiClassHtml } from "../../../shared/dist/lib/tools/loadUiClassHtml";
import { VoidSyncEvent } from "ts-events-extended";
import * as types from "../../../shared/dist/lib/types";
import * as moment from "moment";

declare const require: (path: string) => any;

const html = loadUiClassHtml(
    require("../templates/UiMySubscription.html"),
    "UiMySubscription"
);

require("../templates/UiMySubscription.less");

export class UiMySubscription {

    public readonly structure = html.structure.clone();
    public readonly evtRequestCancel = new VoidSyncEvent();
    public readonly evtRequestReEnable = new VoidSyncEvent();

    constructor(s: types.SubscriptionInfos.Subscription) {

        const formatDate = (date: Date) =>
            moment.unix(~~(date.getTime() / 1000))
                .format("YYYY-MM-DD");

        this.structure.find(".id_boundaries").text((() => {

            let out = `Since ${formatDate(s.start)}`;

            if (s.cancel_at_period_end) {

                out += `, will expire the ${formatDate(s.current_period_end)}`;

            }

            return out;

        })());

        this.structure.find(".payment-next")[s.cancel_at_period_end ? "hide" : "show"]();


        if (!s.cancel_at_period_end) {

            this.structure.find(".id_nextBillDate").html(formatDate(s.current_period_end));
            this.structure.find("id_buttonLabel").html("Want to cancel your subscription?");
            this.structure.find("button").html("Cancel subscription");
            this.structure.find("button").on("click", () => this.evtRequestCancel.post());

        } else {

            this.structure.find("id_buttonLabel").html( "At the end of the current period your subscription will expire");
            this.structure.find("button").html("Re-enable automatic renewal");
            this.structure.find("button").on("click", () => this.evtRequestReEnable.post());

        }

    }


}


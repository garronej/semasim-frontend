
import { loadUiClassHtml } from "frontend-shared/dist/lib/loadUiClassHtml";
import { Evt } from "frontend-shared/node_modules/evt";
import * as types from "frontend-shared/dist/lib/types/subscription";
import * as moment from "moment";
import * as currencyLib from "frontend-shared/dist/tools/currency";

declare const require: (path: string) => any;

const html = loadUiClassHtml(
    require("../templates/UiMySubscription.html"),
    "UiMySubscription"
);

require("../templates/UiMySubscription.less");

export class UiMySubscription {

    public readonly structure = html.structure.clone();
    public readonly evtScheduleCancel = Evt.asNonPostable(Evt.create());
    public readonly evtReactivate = Evt.asNonPostable(Evt.create());

    constructor(s: types.SubscriptionInfos.Subscription, amount: number) {

        const formatDate = (date: Date) =>
            moment.unix(~~(date.getTime() / 1000))
                .format("YYYY-MM-DD");
            
        if( s.cancel_at_period_end ){


            this.structure.find(".id_days_left").text((() => { 

                return ~~((s.current_period_end.getTime() - Date.now())/ ( 24 * 3600 * 1000 ));

            })());

            this.structure.find(".payment-next").hide();

            this.structure.find("button").html("Reactivate subscription");
            this.structure.find("button").on("click", () => Evt.asPostable(this.evtReactivate).post());

        }else{

            this.structure.find(".id_days_left").parent().hide();

            this.structure.find(".payment-next").show();

            this.structure.find(".id_amount").text(
                currencyLib.prettyPrint(
                    amount,
                    s.currency
                )
            );

            this.structure.find(".id_nextBillDate").html(formatDate(s.current_period_end));
            this.structure.find("button").html("Cancel subscription");
            this.structure.find("button").on("click", () => Evt.asPostable(this.evtScheduleCancel).post());

        }


    }


}


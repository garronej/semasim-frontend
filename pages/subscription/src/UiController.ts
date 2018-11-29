import * as webApiCaller from "../../../shared/dist/lib/webApiCaller";
import { loadUiClassHtml } from "../../../shared/dist/lib/tools/loadUiClassHtml";
import * as bootbox_custom from "../../../shared/dist/lib/tools/bootbox_custom";
import { SyncEvent } from "ts-events-extended";
import * as types from "../../../shared/dist/lib/types";

import { UiMySubscription } from "./UiMySubscription";
import { UiSubscribe } from "./UiSubscribe";
import { UiPaymentMethod } from "./UiPaymentMethod";
import { UiDownloadButtons } from "./UiDownloadButtons";
import { UiNegativeBalanceWarning } from "./UiNegativeBalanceWarning";

declare const require: (path: string) => any;
declare const StripeCheckout: any;
declare const Cookies: any;

const html = loadUiClassHtml(
    require("../templates/UiController.html"),
    "UiController"
);

require("../templates/UiController.less");

export class UiController {

    public readonly structure = html.structure.clone();

    constructor(subscriptionInfos: types.SubscriptionInfos) {



        const { source, subscription, due } = subscriptionInfos;

        if (!!due) {

            const uiNegativeBalanceWarning = new UiNegativeBalanceWarning(due);

            this.structure.find("id_placeholder_UiNegativeBalanceWarning")
                .append(uiNegativeBalanceWarning.structure)
                ;


        }

        if (!!subscription) {

            const uiMySubscription = new UiMySubscription(subscription);

            uiMySubscription.evtRequestCancel.attachOnce(async () => {

                bootbox_custom.loading("Canceling your subscription");

                await webApiCaller.unsubscribe();

                bootbox_custom.dismissLoading();

                location.reload();

            });

            uiMySubscription.evtRequestReEnable.attachOnce(async () => {

                bootbox_custom.loading("Re enabling your subscription");

                await webApiCaller.subscribeOrUpdateSource();

                bootbox_custom.dismissLoading();

            });

            this.structure.find(".id_placeholder_UiMySubscription")
                .append(uiMySubscription.structure)
                ;

            const uiDownloadButton = new UiDownloadButtons();

            this.structure.find(".id_placeholder_UiDownloadButtons")
                .append(uiDownloadButton.structure);

        } else {

            const uiSubscribe = new UiSubscribe();

            uiSubscribe.evtRequestSubscribe.attach(async () => {

                const { sourceId } = await this.getSource();

                if (sourceId === undefined) {

                    return;

                }

                bootbox_custom.loading("Enabling your subscription");

                await webApiCaller.subscribeOrUpdateSource(sourceId);

                bootbox_custom.dismissLoading();

                location.reload();

            });

            this.structure.find(".id_placeholder_UiSubscribe")
                .append(uiSubscribe.structure)
                ;


        }

        if (!!source) {

            const uiPaymentMethod = new UiPaymentMethod(source);

            uiPaymentMethod.evtRequestUpdate.attach(async () => {

                const { sourceId } = await this.getSource();

                if (sourceId === undefined) {
                    return;
                }

                bootbox_custom.loading("Updating your payment method");

                await webApiCaller.subscribeOrUpdateSource(sourceId);

                bootbox_custom.dismissLoading();

                location.reload();

            });

            this.structure.find(".id_placeholder_UiPaymentMethod")
                .append(uiPaymentMethod.structure);

        }

    }

    private getSource = (() => {

        const evtSourceId = new SyncEvent<string | undefined>();

        const handler = StripeCheckout.configure({
            "key": 'pk_test_Ai9vCY4RKGRCcRdXHCRMuZ4i',
            "image": 'https://stripe.com/img/documentation/checkout/marketplace.png',
            "locale": 'auto',
            "allowRememberMe": false,
            "name": 'Semasim',
            "email": Cookies.get("email"),
            "description": "Android app access",
            "zipCode": true,
            "panelLabel": "Subscribe {{amount}}/month",
            "amount": 345,
            "source": ({ id }) => evtSourceId.post(id),
            "closed": () => evtSourceId.post(undefined)
        });

        // Close Checkout on page navigation:
        window.addEventListener("popstate", () => handler.close());

        return async () => {

            handler.open()

            return { "sourceId": await evtSourceId.waitFor() };

        };



    })();

}


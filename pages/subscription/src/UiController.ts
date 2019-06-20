//NOTE: Assert StripeCheckout loaded on the page.

import * as webApiCaller from "../../../shared/dist/lib/webApiCaller";
import { loadUiClassHtml } from "../../../shared/dist/lib/loadUiClassHtml";
import * as bootbox_custom from "../../../shared/dist/tools/bootbox_custom";
import { SyncEvent, VoidSyncEvent } from "ts-events-extended";
import * as types from "../../../shared/dist/lib/types/subscription";
import * as currencyLib from "../../../shared/dist/tools/currency";
import { assetsRoot } from "../../../shared/dist/lib/env";
import * as cookies from "../../../shared/dist/lib/cookies/logic/frontend";

import { UiMySubscription } from "./UiMySubscription";
import { UiSubscribe } from "./UiSubscribe";
import { UiPaymentMethod } from "./UiPaymentMethod";
import { UiDownloadButtons } from "./UiDownloadButtons";
import { UiNegativeBalanceWarning } from "./UiNegativeBalanceWarning";

declare const require: (path: string) => any;
declare const StripeCheckout: any;
declare const Stripe: any;

const html = loadUiClassHtml(
    require("../templates/UiController.html"),
    "UiController"
);

require("../templates/UiController.less");

export class UiController {

    public readonly structure = html.structure.clone();

    public readonly evtDone = new VoidSyncEvent();

    private async interact_checkout(
        currency: string
    ) {

        bootbox_custom.loading("Redirecting to payment page");

        const url = window.location.href.split("?")[0];

        const {
            stripePublicApiKey,
            checkoutSessionId: sessionId
        } = await webApiCaller.createStripeCheckoutSessionForSubscription(
            currency,
            `${url}?success=true`, 
            `${url}?success=false`
        );

        const stripe = Stripe(stripePublicApiKey);

        stripe.redirectToCheckout({ sessionId })
            .then(result => {

                if (!!result.error) {
                    alert(result.error.message);
                }
            });

    }

    constructor(
        subscriptionInfos: types.SubscriptionInfos,
        guessedCountryIso: string | undefined
    ) {

        console.log(JSON.stringify(subscriptionInfos, null, 2));

        const uiDownloadButton = new UiDownloadButtons();

        this.structure.find(".id_placeholder_UiDownloadButtons")
            .append(uiDownloadButton.structure);

        if (subscriptionInfos.customerStatus === "EXEMPTED") {

            bootbox_custom.alert("You get free access to the service, enjoy :)");

            return;

        }

        const { pricingByCurrency, source, subscription, due } = subscriptionInfos;

        const retreaveUserSourceViaStripeCheckout = (() => {

            const evtSourceId = new SyncEvent<
                { id: string; currency: string; } |
                undefined
            >();

            const handler = StripeCheckout.configure({
                "key": subscriptionInfos.stripePublicApiKey,
                "image": `${assetsRoot}img/shop.png`,
                "locale": "auto",
                "allowRememberMe": false,
                "name": 'Semasim',
                "email": cookies.AuthenticatedSessionDescriptorSharedData.get().email,
                "description": "Android app access",
                "zipCode": true,
                "panelLabel": "ok", //TODO: Display the price here, show the dialog only if other currency.
                "source": source => evtSourceId.post({
                    "id": source.id,
                    "currency": currencyLib.getCardCurrency(
                        source.card,
                        pricingByCurrency
                    )
                }),
                "closed": () => evtSourceId.post(undefined)
            });

            // Close Checkout on page navigation:
            window.addEventListener("popstate", () => handler.close());

            return () => {

                handler.open();

                return evtSourceId.waitFor();

            };

        })();

        if (!!due) {

            const uiNegativeBalanceWarning = new UiNegativeBalanceWarning(due);

            this.structure.find("id_placeholder_UiNegativeBalanceWarning")
                .append(uiNegativeBalanceWarning.structure)
                ;


        }

        if (!!subscription) {

            const uiMySubscription = new UiMySubscription(
                subscription,
                pricingByCurrency[subscription.currency]
            );

            uiMySubscription.evtScheduleCancel.attachOnce(async () => {

                bootbox_custom.loading("Canceling your subscription");

                await webApiCaller.unsubscribe();

                bootbox_custom.dismissLoading();

                location.reload();

            });

            uiMySubscription.evtReactivate.attachOnce(async () => {

                if (!source!.isChargeable) {

                    bootbox_custom.alert("Please update your payment method first");

                    return;

                }

                bootbox_custom.loading("Re enabling your subscription");

                await webApiCaller.subscribeOrUpdateSource();

                bootbox_custom.dismissLoading();

                this.evtDone.post();

            });

            this.structure.find(".id_placeholder_UiMySubscription")
                .append(uiMySubscription.structure)
                ;


        } else {

            uiDownloadButton.structure.hide();

            let defaultCurrency = guessedCountryIso !== undefined ?
                currencyLib.getCountryCurrency(guessedCountryIso) :
                "eur";

            if (!(defaultCurrency in pricingByCurrency)) {
                defaultCurrency = "eur";
            }

            const uiSubscribe = new UiSubscribe(
                defaultCurrency,
                pricingByCurrency[defaultCurrency]
            );

            uiSubscribe.evtRequestSubscribe.attach(async () => {

                if( 1 === 1 ){

                    this.interact_checkout("eur");

                }

                console.log("we should not be here");


                let newSourceId: string | undefined = undefined;
                let currency: string;

                if (!source || !source.isChargeable) {

                    const newSource = await retreaveUserSourceViaStripeCheckout();

                    if (newSource === undefined) {

                        return;

                    }

                    newSourceId = newSource.id;
                    currency = newSource.currency;

                } else {

                    currency = source.currency;

                }


                //TODO: only display if currency was guessed wrong.
                const shouldProceed = await new Promise<boolean>(
                    resolve => bootbox_custom.confirm({
                        "title": "Enable subscription",
                        "message": [
                            `Confirm subscription for `,
                            currencyLib.prettyPrint(
                                pricingByCurrency[currency], 
                                currency
                            ),
                            `/Month`
                        ].join(""),
                        "callback": result => resolve(result)
                    })
                );

                if (!shouldProceed) {
                    return;
                }


                bootbox_custom.loading("Enabling your subscription");

                await webApiCaller.subscribeOrUpdateSource(newSourceId);

                bootbox_custom.dismissLoading();

                this.evtDone.post();

            });

            this.structure.find(".id_placeholder_UiSubscribe")
                .append(uiSubscribe.structure)
                ;

        }

        if (!!source) {

            const uiPaymentMethod = new UiPaymentMethod(source);

            uiPaymentMethod.evtRequestUpdate.attach(async () => {

                const source = await retreaveUserSourceViaStripeCheckout();

                if (source === undefined) {
                    return;
                }

                bootbox_custom.loading("Updating your payment method");

                await webApiCaller.subscribeOrUpdateSource(source.id);

                bootbox_custom.dismissLoading();

                location.reload();

            });

            this.structure.find(".id_placeholder_UiPaymentMethod")
                .append(uiPaymentMethod.structure);

        }


    }


}


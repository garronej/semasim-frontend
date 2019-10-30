//NOTE: Assert StripeCheckout loaded on the page.

import * as webApiCaller from "frontend-shared/dist/lib/webApiCaller";
import { loadUiClassHtml } from "frontend-shared/dist/lib/loadUiClassHtml";
import { dialogApi } from "frontend-shared/dist/tools/modal/dialog";
import { SyncEvent, VoidSyncEvent } from "frontend-shared/node_modules/ts-events-extended";
import * as types from "frontend-shared/dist/lib/types/subscription";
import * as currencyLib from "frontend-shared/dist/tools/currency";
import { env } from "frontend-shared/dist/lib/env";
import { AuthenticatedSessionDescriptorSharedData } from "frontend-shared/dist/lib/localStorage/AuthenticatedSessionDescriptorSharedData";

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

        dialogApi.loading("Redirecting to payment page");

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

        console.log(JSON.stringify(subscriptionInfos));

        const uiDownloadButton = new UiDownloadButtons();

        this.structure.find(".id_placeholder_UiDownloadButtons")
            .append(uiDownloadButton.structure);

        if (subscriptionInfos.customerStatus === "EXEMPTED") {

            dialogApi.create("alert", { "message": "You get free access to the service, enjoy :)" });

            return;

        }

        const { pricingByCurrency, source, subscription, due } = subscriptionInfos;

        const retreaveUserSourceViaStripeCheckout = (() => {

            const evtSourceId = new SyncEvent<
                { id: string; currency: string; } |
                undefined
            >();

            let handler: any;

            AuthenticatedSessionDescriptorSharedData.get().then(
                email => handler = StripeCheckout.configure({
                    "key": subscriptionInfos.stripePublicApiKey,
                    "image": `${env.assetsRoot}img/shop.png`,
                    "locale": "auto",
                    "allowRememberMe": false,
                    "name": 'Semasim',
                    email,
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
                })
            );

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

                dialogApi.loading("Canceling your subscription");

                await webApiCaller.unsubscribe();

                dialogApi.dismissLoading();

                location.reload();

            });

            uiMySubscription.evtReactivate.attachOnce(async () => {

                if (!source!.isChargeable) {

                    dialogApi.create("alert", { "message": "Please update your payment method first" });

                    return;

                }

                dialogApi.loading("Re enabling your subscription");

                await webApiCaller.subscribeOrUpdateSource();

                dialogApi.dismissLoading();

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

                //TODO: Lot of work left.

                if (typeof WeakMap === "undefined") {

                    dialogApi.create(
                        "alert", {
                        "message": [
                            `We are very sorry but your phone is not compatible with`,
                            `out payment platform. Please go to web.semasim.com and`,
                            `subscribe from there.`,
                            `Once you are done kill the app and login again`
                        ].join(" ")
                    });

                    return;

                }

                if (1 === 1) {

                    this.interact_checkout("eur");

                    return;

                }

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
                    resolve => dialogApi.create("confirm",{
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


                dialogApi.loading("Enabling your subscription");

                await webApiCaller.subscribeOrUpdateSource(newSourceId);

                dialogApi.dismissLoading();

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

                dialogApi.loading("Updating your payment method");

                await webApiCaller.subscribeOrUpdateSource(source.id);

                dialogApi.dismissLoading();

                location.reload();

            });

            this.structure.find(".id_placeholder_UiPaymentMethod")
                .append(uiPaymentMethod.structure);

        }


    }


}


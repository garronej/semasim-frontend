
import { loadUiClassHtml } from "frontend-shared/dist/lib/loadUiClassHtml";
import { UiCart } from "./UiCart";
import { UiProduct } from "./UiProduct";
import { getProducts } from "frontend-shared/dist/lib/shopProducts";
import { env } from "frontend-shared/dist/lib/env";
import { UiShipTo } from "./UiShipTo";
import { getCountryCurrency } from "frontend-shared/dist/tools/currency";
import { UiCurrency } from "./UiCurrency";
import { UiShippingForm } from "./UiShippingForm";
import { dialogApi } from "frontend-shared/dist/tools/modal/dialog";
import * as webApiCaller from "frontend-shared/dist/lib/webApiCaller";
import * as types from "frontend-shared/dist/lib/types/shop";

declare const Stripe: any;

declare const require: (path: string) => any;

const html = loadUiClassHtml(
    require("../templates/UiController.html"),
    "UiController"
);

export class UiController {

    public readonly structure = html.structure.clone();

    constructor(defaultCountryIso: string | undefined) {

        if (defaultCountryIso === undefined) {
            //TODO: change to "fr"
            defaultCountryIso = "us";
        }

        const currency = getCountryCurrency(defaultCountryIso);

        const uiCurrency = new UiCurrency(currency);

        $(".navbar-right").prepend(uiCurrency.structure);

        const uiShipTo = new UiShipTo(defaultCountryIso);

        uiShipTo.evtChange.attach(
            shipToCountryIso => uiCurrency.change(
                getCountryCurrency(shipToCountryIso)
            )
        );

        //We break the rules of our framework here by inserting outside of the ui structure...
        $(".navbar-right").prepend(uiShipTo.structure);

        const uiCart = new UiCart(currency, defaultCountryIso);

        {

            const uiShippingAddress = new UiShippingForm();

            uiCart.evtUserClickCheckout.attach(
                async () => {

                    const shippingFormData = await uiShippingAddress.interact_getAddress();

                    if( shippingFormData === undefined ){
                        return;
                    }

                    const currency = await uiCurrency.interact_getCurrency();

                    this.interact_checkout(
                        uiCart.getCart(),
                        shippingFormData,
                        currency
                    );

                }
            );

        }

        uiCurrency.evtChange.attach(
            currency => uiCart.updateLocals({ currency })
        );

        uiShipTo.evtChange.attach(
            shipToCountryIso => uiCart.updateLocals({ shipToCountryIso })
        );

        this.structure.find(".id_container").append(uiCart.structure);

        for (const product of getProducts(env.assetsRoot)) {

            const uiProduct = new UiProduct(product, currency);

            uiCurrency.evtChange.attach(
                currency => uiProduct.updateCurrency(currency)
            );

            uiProduct.evtUserClickAddToCart.attach(() => {

                uiCart.addProduct(product);

                $("html, body").animate({ "scrollTop": 0 }, "slow");

            });

            this.structure.find(".id_container")
                .append(uiProduct.structure);

        }


    }

    private async interact_checkout(
        cart: types.Cart, 
        shippingFormData: types.ShippingFormData,
        currency: string
    ) {

        dialogApi.loading("Redirecting to payment page");

        const url = window.location.href.split("?")[0];

        const {
            stripePublicApiKey,
            checkoutSessionId: sessionId
        } = await webApiCaller.createStripeCheckoutSessionForShop(
            cart,
            shippingFormData,
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

}






import { loadUiClassHtml } from "../../../shared/dist/lib/loadUiClassHtml";
import { UiCart } from "./UiCart";
import { UiProduct } from "./UiProduct";
import { getProducts } from "../../../shared/dist/lib/shopProducts";
import * as env from "../../../shared/dist/lib/env";
import { UiShipTo } from "./UiShipTo";
import { getCountryCurrency } from "../../../shared/dist/lib/tools/currency";
import { UiCurrency } from "./UiCurrency";
import { UiShippingForm } from "./UiShippingForm";
import * as bootbox_custom from "../../../shared/dist/lib/tools/bootbox_custom";
import * as webApiCaller from "../../../shared/dist/lib/webApiCaller";
import * as types from "../../../shared/dist/lib/types";

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

            const uiProduct = new UiProduct(product, currency, defaultCountryIso);

            uiCurrency.evtChange.attach(
                currency => uiProduct.updateLocals({ currency })
            );

            uiShipTo.evtChange.attach(
                shipToCountryIso => uiProduct.updateLocals({ shipToCountryIso })
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
        cart: types.shop.Cart, 
        shippingFormData: types.shop.ShippingFormData,
        currency: string
    ) {

        bootbox_custom.loading("Redirecting to payment page");

        const {
            stripePublicApiKey,
            checkoutSessionId: sessionId
        } = await webApiCaller.createStripeCheckoutSession(
            cart,
            shippingFormData,
            currency
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





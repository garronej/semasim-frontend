
import { loadUiClassHtml } from "../../../shared/dist/lib/loadUiClassHtml";
import { UiCart } from "./UiCart";
import { UiProduct } from "./UiProduct";
import { products } from "./productListing";
import { UiShipTo } from "./UiShipTo";
import { getCountryCurrency } from "../../../shared/dist/lib/tools/currency";
import { UiCurrency } from "./UiCurrency";

declare const require: (path: string) => any;

const html = loadUiClassHtml(
    require("../templates/UiController.html"),
    "UiController"
);

export class UiController {

    public readonly structure = html.structure.clone();

    constructor(guessedCountryIso: string | undefined) {

        if( guessedCountryIso === undefined ){
            //TODO: change to "fr"
            guessedCountryIso= "us";
        }

        const currency = getCountryCurrency(guessedCountryIso);

        const uiCurrency= new UiCurrency(currency);

        $(".navbar-right").prepend(uiCurrency.structure);

        const uiShipTo = new UiShipTo(guessedCountryIso);

        uiShipTo.evtChange.attach(
            shipToCountryIso => uiCurrency.change(
                getCountryCurrency(shipToCountryIso)
            )
        );

        //We break the rules of our framework here by inserting outside of the ui structure...
        $(".navbar-right").prepend(uiShipTo.structure);


        const uiShoppingBag = new UiCart(currency, guessedCountryIso);

        uiCurrency.evtChange.attach(
            currency => uiShoppingBag.updateLocals({ currency })
        );

        uiShipTo.evtChange.attach(
            shipToCountryIso => uiShoppingBag.updateLocals({ shipToCountryIso })
        );


        this.structure.find(".id_container").append(uiShoppingBag.structure);

        for (const product of products) {

            const uiProduct = new UiProduct(product, currency, guessedCountryIso);

            uiCurrency.evtChange.attach(
                currency => uiProduct.updateLocals({ currency })
            );

            uiShipTo.evtChange.attach(
                shipToCountryIso => uiProduct.updateLocals({ shipToCountryIso })
            );

            uiProduct.evtUserClickAddToCart.attach(() => {

                uiShoppingBag.addProduct(product);

                $("html, body").animate({ "scrollTop": 0 }, "slow");

            });

            this.structure.find(".id_container")
                .append(uiProduct.structure);

        }


    }

}





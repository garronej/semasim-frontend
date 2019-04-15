
import { loadUiClassHtml } from "../../../shared/dist/lib/loadUiClassHtml";
import { UiCart } from "./UiCart";
import { UiProduct } from "./UiProduct";
import { products } from "./productListing";
import { UiShipTo } from "./UiShipTo";

declare const require: (path: string) => any;

const html = loadUiClassHtml(
    require("../templates/UiController.html"),
    "UiController"
);

export class UiController {

    public readonly structure = html.structure.clone();

    constructor() {

        const currency = "eur";
        const shipToCountryIso = "fr";

        const uiShipTo = new UiShipTo(shipToCountryIso);

        //We break the rules of our framework here by inserting outside of the ui structure...
        $(".navbar-right").prepend(uiShipTo.structure);

        const uiShoppingBag = new UiCart(currency, shipToCountryIso);

        uiShipTo.evtChange.attach(
            shipToCountryIso => uiShoppingBag.updateLocals({ shipToCountryIso })
        );

        this.structure.find(".id_container").append(uiShoppingBag.structure);

        for (const product of products) {

            const uiProduct = new UiProduct(product, currency, shipToCountryIso);

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





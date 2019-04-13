
import { loadUiClassHtml } from "../../../shared/dist/lib/loadUiClassHtml";
import { UiCart } from "./UiCart";
import { UiProduct } from "./UiProduct";
import { products } from "./productListing";

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

        const uiShoppingBag = new UiCart(currency, shipToCountryIso);

        this.structure.find(".id_container")
            .append(uiShoppingBag.structure);

        for (const product of products) {

            const uiProduct = new UiProduct(product, currency, shipToCountryIso);

            uiProduct.evtUserClickAddToCart.attach(() =>{

                uiShoppingBag.addProduct(product);

                $("html, body").animate({ "scrollTop": 0 }, "slow");

            });

            this.structure.find(".id_container")
                .append(uiProduct.structure);

        }


    }

}





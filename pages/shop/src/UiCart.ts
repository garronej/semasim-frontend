
import { loadUiClassHtml } from "../../../shared/dist/lib/loadUiClassHtml";
import { VoidSyncEvent } from "ts-events-extended";
import * as types from "./types";
import { assetsRoot } from "../../../shared/dist/lib/env";
import { estimateShipping } from "./shipping";
import { convertFromEuro } from "../../../shared/dist/lib/tools/changeRates";

declare const require: (path: string) => any;

const html = loadUiClassHtml(
    require("../templates/UiCart.html"),
    "UiCart"
);

require("../templates/UiCart.less");

export class UiCart {

    public readonly structure = html.structure.clone();

    public readonly evtUserClickCheckout = new VoidSyncEvent();

    private readonly uiCartEntries: UiCartEntry[] = [];

    private currency!: string;
    private shipToCountryIso!: string;

    constructor(currency: string, shipToCountryIso: string) {

        this.structure.find(".id_checkout")
            .on("click", () => this.evtUserClickCheckout.post())
            ;

        this.updateLocals({ currency, shipToCountryIso });

    }

    public getCart(): types.Cart {
        return this.uiCartEntries
            .map(({ cartEntry }) => cartEntry)
            ;
    }


    public updateLocals(locals: { currency?: string; shipToCountryIso?: string; }) {

        const { currency, shipToCountryIso }= locals;

        if( currency !== undefined ){
            this.currency = currency;
        }

        if( shipToCountryIso !== undefined ){
            this.shipToCountryIso = shipToCountryIso;
        }

        for (const uiShoppingBagEntry of this.uiCartEntries) {
            uiShoppingBagEntry.updateLocals({ currency, shipToCountryIso});
        }

        this.updateTotal();

    }

    private updateTotal() {

        const cart = this.getCart();

        if (cart.length === 0) {
            this.structure.hide();
        } else {
            this.structure.show();
        }
        
        //TODO: Do something with shipping, offer extra
        const shipping = estimateShipping(
            this.shipToCountryIso, 
            types.Cart.getOverallFootprint(cart)
        );

        const displayedCartPrice = types.Price.addition(
            types.Cart.getPrice(cart, convertFromEuro),
            { "eur": shipping.eurAmount },
            convertFromEuro
        );

        const displayedShippingPrice = { "eur": 0 };

        this.structure.find(".id_goods_price").text(
            types.Price.prettyPrint(
                displayedCartPrice,
                this.currency,
                convertFromEuro
            )
        );

        this.structure.find(".id_delivery_price").text(
            types.Price.prettyPrint(
                displayedShippingPrice,
                this.currency,
                convertFromEuro
            )
        );

        this.structure.find(".id_cart_total").text(
            types.Price.prettyPrint(
                types.Price.addition(
                    displayedCartPrice,
                    displayedShippingPrice,
                    convertFromEuro
                ),
                this.currency,
                convertFromEuro
            )
        );

    }

    public addProduct(product: types.Product) {

        {

            const uiCartEntry = this.uiCartEntries.find(
                ({ cartEntry }) => cartEntry.product === product
            );

            if (!!uiCartEntry) {

                uiCartEntry.simulatePlusClick();

                return;

            }

        }

        const uiCartEntry = new UiCartEntry(
            { product, "quantity": 1 },
            this.currency,
            this.shipToCountryIso
        );

        this.uiCartEntries.push(uiCartEntry);

        this.structure.find(".shopping-cart").append(uiCartEntry.structure);

        uiCartEntry.evtUserClickDelete.attachOnce(() => {

            this.uiCartEntries.splice(
                this.uiCartEntries.indexOf(uiCartEntry),
                1
            );

            uiCartEntry.structure.detach();

            this.updateTotal();

        });

        uiCartEntry.evtQuantityChanged.attach(() =>
            this.updateTotal()
        );

        this.updateTotal();

    }

}


class UiCartEntry {

    public readonly structure = html.templates.find(".id_UiCartEntry").clone();

    public readonly evtUserClickDelete = new VoidSyncEvent();
    public readonly evtQuantityChanged = new VoidSyncEvent();


    private currency!: string;
    private shipToCountryIso!: string

    public simulatePlusClick() {
        this.structure.find(".plus-btn").trigger("click");
    }

    constructor(
        public readonly cartEntry: types.Cart.Entry,
        currency: string,
        shipToCountryIso: string
    ) {

        this.structure.find(".delete-btn").css(
            "background",
            `url("${assetsRoot}svg/delete-icn.svg") no-repeat center`
        );

        for (const selector of ["plus", "minus"]) {
            this.structure.find(`.${selector}-btn img`).attr(
                "src",
                `${assetsRoot}svg/${selector}.svg`
            );
        }

        this.structure.find(".image img").attr(
            "src",
            cartEntry.product.cartImageUrl
        );

        this.structure.find(".id_item_name").text(cartEntry.product.name);

        this.structure.find(".id_short_description").text(cartEntry.product.shortDescription);
        {

            const $input = this.structure.find(".quantity input");

            $input.val(cartEntry.quantity);

            const updateCounter = (op: "++" | "--") => ((event: JQueryEventObject) => {

                event.preventDefault();

                const oldValue = cartEntry.quantity;

                const newValue = (op === "++" ? oldValue < 100 : oldValue > 1) ?
                    (oldValue + (op === "++" ? 1 : -1)) :
                    (op === "++" ? 100 : 1);

                if (newValue === oldValue) {
                    return;
                }

                $input.val(newValue);

                cartEntry.quantity = newValue;

                this.updateDisplayedPrice();

                this.evtQuantityChanged.post();

            });

            this.structure.find(".minus-btn").on("click", updateCounter("--"));
            this.structure.find(".plus-btn").on("click", updateCounter("++"));

        }

        this.structure.find(".delete-btn").one("click", () => this.evtUserClickDelete.post());

        this.updateLocals({ currency, shipToCountryIso });

    }


    public updateLocals(locals: { currency?: string; shipToCountryIso?: string; }) {

        const { currency, shipToCountryIso } = locals;

        if (currency !== undefined) {
            this.currency = currency;
        }

        if (shipToCountryIso !== undefined) {
            this.shipToCountryIso = shipToCountryIso;
        }

        this.updateDisplayedPrice();

    }

    private updateDisplayedPrice() {

        this.structure.find(".total-price").html(
            types.Price.prettyPrint(
                types.Price.addition(
                    types.Price.operation(
                        this.cartEntry.product.price,
                        amount => amount * this.cartEntry.quantity
                    ),
                    {
                        "eur": estimateShipping(
                            this.shipToCountryIso,
                            this.cartEntry.product.footprint
                        ).eurAmount
                    },
                    convertFromEuro
                ),
                this.currency,
                convertFromEuro
            )
        );

    }

}




import { loadUiClassHtml } from "frontend-shared/dist/lib/loadUiClassHtml";
import { Evt } from "frontend-shared/node_modules/evt";
import * as types from "frontend-shared/dist/lib/types/shop";
import { env } from "frontend-shared/dist/lib/env";
import { solve as solveShipping } from "frontend-shared/dist/lib/shipping";
import { convertFromEuro } from "frontend-shared/dist/tools/currency";

declare const require: (path: string) => any;

const html = loadUiClassHtml(
    require("../templates/UiCart.html"),
    "UiCart"
);

require("../templates/UiCart.less");

export class UiCart {

    public readonly structure = html.structure.clone();

    public readonly evtUserClickCheckout =  Evt.asNonPostable(Evt.create());

    private readonly uiCartEntries: UiCartEntry[] = [];

    private currency!: string;
    private shipToCountryIso!: string;

    constructor(currency: string, shipToCountryIso: string) {

        this.structure.find(".id_checkout")
            .on("click", () => Evt.asPostable(this.evtUserClickCheckout).post())
            ;

        this.updateLocals({ currency, shipToCountryIso });

    }

    public getCart(): types.Cart {
        return this.uiCartEntries
            .map(({ cartEntry }) => cartEntry)
            ;
    }


    public updateLocals(locals: { currency?: string; shipToCountryIso?: string; }) {

        const { currency, shipToCountryIso } = locals;

        if (currency !== undefined) {
            this.currency = currency;

            for (const uiShoppingBagEntry of this.uiCartEntries) {
                uiShoppingBagEntry.updateCurrency(currency);
            }

        }

        if (shipToCountryIso !== undefined) {

            this.shipToCountryIso = shipToCountryIso;

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

        const shipping = solveShipping(
            this.shipToCountryIso,
            types.Cart.getOverallFootprint(cart),
            types.Cart.getOverallWeight(cart)
        );

        const cartPrice = types.Cart.getPrice(
            cart,
            convertFromEuro
        );

        console.log("TODO: display delay ", shipping.delay);

        this.structure.find(".id_cart_price").text(
            types.Price.prettyPrint(
                cartPrice,
                this.currency,
                convertFromEuro
            )
        );

        this.structure.find(".id_shipping_price").text(
            types.Price.prettyPrint(
                { "eur": shipping.eurAmount },
                this.currency,
                convertFromEuro
            )
        );

        this.structure.find(".id_cart_total").text(
            types.Price.prettyPrint(
                types.Price.addition(
                    cartPrice,
                    { "eur": shipping.eurAmount },
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
            this.currency
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

    public readonly evtUserClickDelete = Evt.asNonPostable(Evt.create());
    public readonly evtQuantityChanged = Evt.asNonPostable(Evt.create());


    private currency!: string;

    public simulatePlusClick() {
        this.structure.find(".plus-btn").trigger("click");
    }

    constructor(
        public readonly cartEntry: types.Cart.Entry,
        currency: string
    ) {

        this.structure.find(".delete-btn").css(
            "background",
            `url("${env.assetsRoot}svg/delete-icn.svg") no-repeat center`
        );

        for (const selector of ["plus", "minus"]) {
            this.structure.find(`.${selector}-btn img`).attr(
                "src",
                `${env.assetsRoot}svg/${selector}.svg`
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

                Evt.asPostable(this.evtQuantityChanged).post();

            });

            this.structure.find(".minus-btn").on("click", updateCounter("--"));
            this.structure.find(".plus-btn").on("click", updateCounter("++"));

        }

        this.structure.find(".delete-btn").one("click", () => Evt.asPostable(this.evtUserClickDelete).post());

        this.updateCurrency(currency);

    }

    public updateCurrency(currency: string) {

        this.currency = currency;

        this.updateDisplayedPrice();

    }


    private updateDisplayedPrice() {

        this.structure.find(".total-price").html(
            types.Price.prettyPrint(
                types.Price.operation(
                    this.cartEntry.product.price,
                    amount => amount * this.cartEntry.quantity
                ),
                this.currency,
                convertFromEuro
            )
        );

    }

}



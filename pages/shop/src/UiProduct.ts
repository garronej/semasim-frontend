import { loadUiClassHtml } from "frontend-shared/dist/lib/loadUiClassHtml";
import { VoidEvt } from "frontend-shared/node_modules/evt";
import * as types from "frontend-shared/dist/lib/types/shop";
import { convertFromEuro } from "frontend-shared/dist/tools/currency";

declare const require: (path: string) => any;

const html = loadUiClassHtml(
    require("../templates/UiProduct.html"),
    "UiProduct"
);

require("../templates/UiProduct.less");

export class UiProduct {
    

    private static getCounter = (() => {

        let counter = 0;

        return () => counter++;

    })();

    public readonly structure = html.structure.clone();

    public readonly evtUserClickAddToCart = new VoidEvt();

    private currency!: string;

    constructor(
        public readonly product: types.Product,
        currency: string
    ) {

        {

            const carouselId = `carousel-${UiProduct.getCounter()}`;

            const $divCarousel = this.structure.find(".carousel");

            $divCarousel.attr("id", carouselId);


            for (let i = 0; i < product.imageUrls.length; i++) {

                $divCarousel.find(".carousel-indicators").append(() => {

                    const $li = html.templates.find("li").clone();

                    $li.attr("data-target", carouselId);
                    $li.attr("data-slide-to", `${i}`);

                    if (i === 0) {
                        $li.addClass("active");
                    }

                    return $li;


                });


                $divCarousel.find(".carousel-inner").append(() => {

                    const $div = html.templates.find(".item").clone();

                    if (i === 0) {
                        $div.addClass("active");
                    }

                    $div.find("img").attr("src", product.imageUrls[i]);

                    return $div;

                });



            }

            {

                const $divs= $divCarousel.find(".carousel-control");

                $divs.attr("href", `#${carouselId}`);

                if( product.imageUrls.length === 1 ){
                    $divs.hide();
                }

            }

            $divCarousel.carousel({ "interval": 0 });

        }


        this.structure.find(".id_short_description").text(product.shortDescription);

        this.structure.find(".id_product_name").text(product.name);

        this.structure.find(".id_product_description").text(product.description);

        this.structure.find(".id_add_to_cart")
            .on("click", () => this.evtUserClickAddToCart.post())
            ;

        this.updateCurrency( currency );

    }

    public updateCurrency( currency: string ){

        this.currency = currency;

        this.updatePrice();

    }


    private updatePrice() {

        this.structure.find(".id_product_price").text(
            types.Price.prettyPrint(
                this.product.price,
                this.currency,
                convertFromEuro
            )
        );

    }



}



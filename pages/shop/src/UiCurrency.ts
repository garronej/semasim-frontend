//NOTE: Assert Select2 v4.0.6-rc.0 loaded.

import { loadUiClassHtml } from "frontend-shared/dist/lib/loadUiClassHtml";
import { SyncEvent, VoidSyncEvent } from "frontend-shared/node_modules/ts-events-extended";
import * as currencyLib from "frontend-shared/dist/tools/currency";
import { dialogApi } from "frontend-shared/dist/tools/modal/dialog";

declare const require: any;

const html = loadUiClassHtml(
    require("../templates/UiCurrency.html"),
    "UiCurrency"
);

require("../templates/UiCurrency.less");

export class UiCurrency {

    public readonly structure = html.structure.clone();

    public readonly evtChange = new SyncEvent<string>();

    private readonly evt$select_on_change= new VoidSyncEvent();

    constructor(defaultCurrency: string) {

        this.structure.one("show.bs.dropdown", () => {

            const $select = this.structure.find("select");

            const sortedCurrencies = Object.keys(currencyLib.data)
                .map(currency => ({ currency, "count": currencyLib.data[currency].countriesIso.length }))
                .sort((a, b) => b.count - a.count)
                .map(({ currency }) => currency);

            for (const currency of sortedCurrencies) {

                const $option = html.templates.find("option").clone();

                $option.attr("value", currency);

                const { symbol, name } = currencyLib.data[currency];

                $option.html(`${symbol} - ${name}`);

                $select.append($option);

            }

            $select["select2"]();

            $select.on("change", ()=> this.evt$select_on_change.post());

            this.evt$select_on_change.attach(() => {

                this.structure.find("a").trigger("click");

                this.change($select.val());

            });

        });

        this.structure.on("shown.bs.dropdown", () => {

            const $select = this.structure.find("select");

            if( $select.val() === this.currency ){
                return;
            }

            this.evt$select_on_change.attachOnceExtract(()=>{});

            $select.val(this.currency).trigger("change");

        });

        //NOTE: Preventing dropdown from closing.
        {

            let target: Element;

            $("body").on("click", e => { target = e.target });

            this.structure.on("hide.bs.dropdown", () => {

                if (this.structure.find("a").is(target)) {
                    return true;
                }

                if (this.structure.has(target).length !== 0) {
                    return false;
                }

                if ($(".select2-dropdown").has(target).length !== 0) {
                    return false;
                }

                return true;

            });

        }

        this.change(defaultCurrency);

    }

    public currency!: string;

    public change(currency: string) {

        this.currency = currency;

        this.structure.find(".id_currency").text(
            currencyLib.data[currency].symbol
        );

        this.evtChange.post(currency);

    }

    public async interact_getCurrency(): Promise<string> {

        const doChange= await new Promise<boolean>(resolve =>
            dialogApi.create("dialog",{
                "title": "Currency",
                "message": `Pay in ${currencyLib.data[this.currency].name} ?`,
                "closeButton": false,
                "buttons": {
                    "btn1": {
                        "label": `Yes, pay in ${currencyLib.data[this.currency].symbol}`,
                        "className": "btn-success",
                        "callback": () => resolve(false)
                    },
                    "btn2": {
                        "label": "No, pay with an other currency",
                        "className": 'btn-warning',
                        "callback":  () => resolve(true)
                    }
                },
                "onEscape": false
            })
        );

        if( !doChange ){
            return this.currency;
        }

        this.structure.one("shown.bs.dropdown", 
            () => this.structure.find("select")["select2"]("open")
        );

        this.structure.find("a").trigger("click");

        await new Promise<void>(resolve=>
            this.structure.one("hide.bs.dropdown", () => resolve())
        );

        return this.currency;

    }

}


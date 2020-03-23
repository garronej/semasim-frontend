
import { loadUiClassHtml } from "frontend-shared/dist/lib/loadUiClassHtml";
import { Evt } from "frontend-shared/node_modules/evt";

declare const require: any;

const html = loadUiClassHtml(
    require("../templates/UiShipTo.html"),
    "UiShipTo"
);

require("../templates/UiShipTo.less");

export class UiShipTo {

    public readonly structure = html.structure.clone();

    public readonly evtChange = new Evt<string>();

    private static getCounter = () => {

        let counter = 0;

        return () => counter++;

    };

    //NOTE: Safe to access, set at creation.
    public shipToCountryIso= "";

    constructor(shipToCountryIso: string) {

        this.structure.one("show.bs.dropdown", () => 
            (new window["NiceCountryInput"]($countrySelector)).init()
        );

        const $countrySelector = this.structure.find(".id_countrySelector");

        const cbName = `UiShipTo_onChangeCallback_${UiShipTo.getCounter()}`;

        $countrySelector
            .attr("data-selectedcountry", shipToCountryIso.toUpperCase())
            .attr("data-onchangecallback", cbName)
            ;

        window[cbName] = (iso: string) => {

            //NOTE: To close the dropdown
            $("body").trigger("click");

            this.change(iso.toLowerCase());

            this.evtChange.post(this.shipToCountryIso!);

        };

        this.change(shipToCountryIso);

        //NOTE: Prevent dropdown from closing when select country is clicked.
        this.structure.find(".dropdown-menu").on("click", () => false);

    }

    private change(shipToCountryIso: string) {

        const $divFlag = this.structure.find(".id_flag");

        if (this.shipToCountryIso !== "") {

            $divFlag.removeClass(this.shipToCountryIso);

        }

        this.shipToCountryIso = shipToCountryIso;

        $divFlag.addClass(this.shipToCountryIso);

    }

}

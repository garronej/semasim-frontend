import { loadUiClassHtml } from "../../../shared/dist/lib/loadUiClassHtml";
import { SyncEvent } from "ts-events-extended";

declare const require: any;

const html = loadUiClassHtml(
    require("../templates/UiShipTo.html"),
    "UiShipTo"
);

require("../templates/UiShipTo.less");

export class UiShipTo {

    public readonly structure = html.structure.clone();

    public readonly evtChange = new SyncEvent<string>();

    private static getCounter = () => {

        let counter = 0;

        return () => counter++;

    };

    constructor(shipToCountryIso: string) {

        const $countrySelector = this.structure.find(".id_countrySelector");

        const cbName = `UiShipTo_onChangeCallback_${UiShipTo.getCounter()}`;

        $countrySelector
            .attr("data-selectedcountry", shipToCountryIso.toUpperCase())
            .attr("data-onchangecallback", cbName)
            ;

        window[cbName] = (iso: string) => {

            //NOTE: To close the dropdown
            $("body").trigger("click");

            this.update(iso.toLowerCase());

            this.evtChange.post(this.shipToCountryIso!);

        };

        this.update(shipToCountryIso);

        //NOTE: Prevent dropdown from closing when select country is clicked.
        this.structure.find(".dropdown-menu").on("click", () => false);

        //NOTE: NiceCountryInput should be initialized only once the structure
        //have been inserted in the DOM
        setTimeout(() =>
            (new window["NiceCountryInput"]($countrySelector)).init(),
            0
        );

    }

    private shipToCountryIso: string | undefined = undefined;

    private update(shipToCountryIso: string) {

        const $divFlag = this.structure.find(".id_flag");

        if (this.shipToCountryIso !== undefined) {

            $divFlag.removeClass(this.shipToCountryIso);

        }

        this.shipToCountryIso = shipToCountryIso;

        $divFlag.addClass(this.shipToCountryIso);

    }

}

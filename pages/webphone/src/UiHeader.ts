import { VoidSyncEvent } from "ts-events-extended";
import { loadHtml } from "./loadHtml";
declare const require: any;

const html = loadHtml(
    require("../templates/UiHeader.html"),
    "UiHeader"
);

export class UiHeader {

    public readonly structure= html.structure.clone();
    private readonly templates= html.templates.clone();

    public evtUp = new VoidSyncEvent();

    constructor(
        public readonly data: UiHeader.Data
    ) {

        this.structure.find("a.id_number").popover({
            "html": true,
            "trigger": "hover",
            "placement": "right",
            "container": "body",
            "title": "SIM cart Info",
            "content": () => this.templates.find("div.id_popover").html()
        });

        this.structure.find("button.id_up").on("click", () => this.evtUp.post());

        this.structure.find("div.id_flag").addClass(this.data.geoInfo.country);
        this.structure.find("span.id_geoInfo").html(`${this.data.geoInfo.subdivisions},&nbsp;`);

        this.templates.find("div.id_popover div.id_flag").addClass(this.data.simCountry);

        this.structure.find("span.id_number").html(
            (intlTelInputUtils as any).formatNumber(
                this.data.number,
                null,
                intlTelInputUtils.numberFormat.NATIONAL
            )
        );

        this.templates.find("div.id_popover span.id_number").html(
            (intlTelInputUtils as any).formatNumber(
                this.data.number,
                null,
                intlTelInputUtils.numberFormat.INTERNATIONAL
            )
        );

        this.templates.find("div.id_popover span.id_network").html(this.data.network);

    }

}

export namespace UiHeader {

    //Sim country is a restricted types
    export type Data = {
        readonly number: string;
        readonly geoInfo: GeoInfo;
        readonly network: string;
        readonly simCountry: string;
    };

    export type GeoInfo = {
        readonly country: string;
        readonly subdivisions: string;
    };

}

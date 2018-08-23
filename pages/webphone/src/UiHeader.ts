import { VoidSyncEvent } from "ts-events-extended";
import { loadUiClassHtml } from "../../../shared/dist/lib/tools/loadUiClassHtml";

import * as types from "../../../shared/dist/lib/types";

declare const require: any;

const html = loadUiClassHtml(
    require("../templates/UiHeader.html"),
    "UiHeader"
);

export class UiHeader {

    public readonly structure = html.structure.clone();
    private readonly templates = html.templates.clone();

    public evtUp = new VoidSyncEvent();

    /** to call when userSim has changed */
    public update(){
        //TODO
    }

    constructor(
        public readonly userSim: types.UserSim.Usable
    ) {

        this.structure.find("a.id_friendly_name").popover({
            "html": true,
            "trigger": "hover",
            "placement": "right",
            "container": "body",
            "title": "SIM card infos",
            "content": () => this.templates.find("div.id_popover").html()
        }).find("span").text(this.userSim.friendlyName);

        this.structure.find("button.id_up").on("click", () => this.evtUp.post());

        this.templates.find("div.id_popover div.id_flag").addClass(
            this.userSim.sim.country ? this.userSim.sim.country.iso : ""
        );

        this.templates.find("div.id_popover span.id_network").html(
            this.userSim.sim.serviceProvider.fromImsi || 
            this.userSim.sim.serviceProvider.fromNetwork || 
            "Unknown"
        );

        this.templates.find("div.id_popover span.id_number").text(() => {

            if (!!this.userSim.sim.storage.number) {

                return (intlTelInputUtils as any).formatNumber(
                    this.userSim.sim.storage.number,
                    this.userSim.sim.country ? this.userSim.sim.country.iso : null,
                    intlTelInputUtils.numberFormat.NATIONAL
                );

            } else {

                return "Unknown";

            }

        });

        this.structure.find("span.id_geoInfo").html((()=>{

            let loc = this.userSim.gatewayLocation;

            let arr: string[] = [];

            if (loc.subdivisions) {
                arr.push(loc.subdivisions);
            }

            if (loc.city) {
                arr.push(loc.city);
            }

            return `${arr.join(", ")}&nbsp;`;


        })());

        this.structure.find("div.id_flag").addClass(
            this.userSim.gatewayLocation.countryIso || ""
        );

    }

}

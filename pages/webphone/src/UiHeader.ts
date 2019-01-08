import { loadUiClassHtml } from "../../../shared/dist/lib/tools/loadUiClassHtml";
import { phoneNumber } from "phone-number";

import * as types from "../../../shared/dist/lib/types";

declare const require: any;

const html = loadUiClassHtml(
    require("../templates/UiHeader.html"),
    "UiHeader"
);

export class UiHeader {

    public readonly structure = html.structure.clone();
    private readonly templates = html.templates.clone();

    public setIsOnline(isOnline: boolean): void{

        this.structure.find(".id_icon_sim_up")[isOnline?"show":"hide"]();
        //this.structure.find(".id_icon_sim_down")[isOnline?"hide":"show"]();

        for( const selector of [ ".id_offline", ".id_icon_sim_down" ]){
            this.structure.find(selector)[isOnline ? "hide" : "show"]();
        }

    }

    constructor(
        public readonly userSim: types.UserSim.Usable
    ) {

        this.setIsOnline(userSim.isOnline);

        this.structure.find("a.id_friendly_name").popover({
            "html": true,
            "trigger": "hover",
            "placement": "right",
            "container": "body",
            "title": "SIM card infos",
            "content": () => this.templates.find("div.id_popover").html()
        }).find("span").text(this.userSim.friendlyName);

        this.structure.find("span.id_number").text(() => {

            if (!!this.userSim.sim.storage.number) {

                return phoneNumber.prettyPrint(
                    phoneNumber.build(
                        this.userSim.sim.storage.number,
                        this.userSim.sim.country ? this.userSim.sim.country.iso : undefined
                    ),
                    this.userSim.sim.country ? this.userSim.sim.country.iso : "DEFAULT"
                );

            } else {

                return "";

            }

        });

        this.templates.find("div.id_popover div.id_flag").addClass(
            this.userSim.sim.country ? this.userSim.sim.country.iso : ""
        );

        this.templates.find("div.id_popover span.id_network").html(
            this.userSim.sim.serviceProvider.fromImsi ||
            this.userSim.sim.serviceProvider.fromNetwork ||
            "Unknown"
        );

        this.templates.find("span.id_geoInfo").html((() => {

            let loc = this.userSim.gatewayLocation;

            return loc.city || loc.subdivisions || loc.countryIso || "?";

        })());

        /*
        this.structure.find("div.id_flag").addClass(
            this.userSim.gatewayLocation.countryIso || ""
        );
        */

    }

}

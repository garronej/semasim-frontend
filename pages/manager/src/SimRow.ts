import { VoidSyncEvent } from "ts-events-extended";
import { declaration } from "../../../api";
import Types = declaration.Types;

declare const require: (path: string) => any;

require("../templates/SimRow.less");

export class SimRow {

    public readonly structure: JQuery;

    public evtSelected = new VoidSyncEvent();

    public isSelected = false;

    public unselect() {
        this.structure.find(".id_row").removeClass("selected");
        this.isSelected = false;
    }

    public setDetailsVisibility(
        visibility: "SHOWN" | "HIDDEN"
    ) {

        let details = this.structure.find(".id_details");

        switch (visibility) {
            case "SHOWN":
                details.show();
                break;
            case "HIDDEN":
                details.hide();
                break;
        }

    }

    public setVisibility(
        visibility: "SHOWN" | "HIDDEN"
    ) {

        switch (visibility) {
            case "SHOWN":
                this.structure.show();
                break;
            case "HIDDEN":
                this.structure.hide();
                break;
        }

    }

    private populate() {

        this.structure.find(".id_simId").text(
            this.userSim.friendlyName + (
                this.userSim.sim.storage.number ?
                    ` ( ${this.userSim.sim.storage.number.localFormat} )` : ""
            )
        );

        this.structure.find(".id_connectivity").text(
            this.userSim.isOnline ? "online" : "offline"
        );

        if (!this.userSim.isOnline) {
            this.structure.find(".id_row").addClass("offline");
        }

        this.structure.find(".id_ownership").text(
            (this.userSim.ownership.status === "OWNED") ?
                "Owned" :
                `owned by: ${this.userSim.ownership.ownerEmail}`
        );

        this.structure.find(".id_connectivity_").text(
            this.userSim.isOnline ? "Online" : "Offline"
        );

        this.structure.find(".id_gw_location").text(
            [
                this.userSim.gatewayLocation.city || "",
                this.userSim.gatewayLocation.subdivisions || "",
                this.userSim.gatewayLocation.countryIso || "",
                `( ${this.userSim.gatewayLocation.ip} )`
            ].join(" ")
        );

        this.structure.find("id_owner").text(
            (this.userSim.ownership.status === "OWNED") ?
                "Me" : this.userSim.ownership.ownerEmail
        );

        this.structure.find("id_number").text((() => {

            let n = this.userSim.sim.storage.number;

            if (!n) return "Unknown";

            if (n.asStored === n.localFormat) {
                return n.localFormat;
            } else {
                return `${n.localFormat} ( ${n.asStored} )`;
            }

        })());

        this.structure.find(".id_serviceProvider").text(
            (() => {

                let out: string;

                if (this.userSim.sim.serviceProvider.fromImsi) {
                    out = this.userSim.sim.serviceProvider.fromImsi;
                } else if (this.userSim.sim.serviceProvider.fromNetwork) {
                    out = this.userSim.sim.serviceProvider.fromNetwork;
                } else {
                    out = "Unknown";
                }

                if (this.userSim.sim.country) {
                    out += `, ${this.userSim.sim.country.name}`;
                }

                return out;

            })()
        );

        this.structure.find(".id_dongle_info").text((() => {
            let d = this.userSim.dongle;

            return [
                d.manufacturer,
                d.model,
                `firm: ${d.firmwareVersion}`,
                `IMEI: ${d.imei}`
            ].join(" ");

        })());

        this.structure.find("id_features").text(
            (() => {

                switch (this.userSim.dongle.isVoiceEnabled) {
                    case undefined:
                        return "Probably SMS only ( may need to manually enable voice )";
                    case true:
                        return "Voice calls + SMS"
                    case false:
                        return "SMS only ( need to manually enable voice )";
                }

            })()
        );


        this.structure.find(".id_imsi").text(
            this.userSim.sim.imsi
        );

        this.structure.find(".id_iccid").text(
            this.userSim.sim.iccid
        );


        this.structure.find(".id_phonebook").text(
            (() => {

                let n = this.userSim.sim.storage.contacts.length;
                let tot = n + this.userSim.sim.storage.infos.storageLeft;

                return `${n}/${tot}`

            })()
        );

    }

    constructor(
        public readonly userSim: Types.UserSim.Usable
    ) {

        this.structure = $(
            require("../templates/SimRow.html")
        );

        this.structure.click(
            () => {

                if (!this.isSelected) {
                    this.isSelected = true;
                    this.structure.find(".id_row").addClass("selected");
                    this.evtSelected.post();
                }

            }
        );

        this.setDetailsVisibility("HIDDEN");

        this.populate();

    }

}
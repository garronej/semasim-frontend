
import { VoidSyncEvent } from "frontend-shared/node_modules/ts-events-extended";
import { loadUiClassHtml } from "frontend-shared/dist/lib/loadUiClassHtml";
import * as types from "frontend-shared/dist/lib/types/userSim";

declare const require: (path: string) => any;

const html = loadUiClassHtml(
    require("../templates/UiSimRow.html"),
    "UiSimRow"
);

require("../templates/UiSimRow.less");

export class UiSimRow {

    public readonly structure = html.structure.clone();

    public evtSelected = new VoidSyncEvent();

    public isSelected = false;

    public unselect() {

        this.structure.find(".id_row").removeClass("selected");

        this.isSelected = false;

    }

    public setDetailsVisibility(visibility: "SHOWN" | "HIDDEN") {

        const details = this.structure.find(".id_details");

        switch (visibility) {
            case "SHOWN": details.show(); break;
            case "HIDDEN": details.hide(); break;
        }

    }

    public setVisibility(visibility: "SHOWN" | "HIDDEN") {

        switch (visibility) {
            case "SHOWN": this.structure.show(); break;
            case "HIDDEN": this.structure.hide(); break;
        }

    }


    /** To call when userSim has changed */
    public populate() {

        /*
        this.structure.find(".id_simId").text(
            (() => {

                let out = this.userSim.friendlyName;

                const number = this.userSim.sim.storage.number

                if (!!number) {
                    out += " " + phoneNumber.prettyPrint(
                        phoneNumber.build(
                            number,
                            !!this.userSim.sim.country ? this.userSim.sim.country.iso : undefined
                        )
                    ) + " ";
                }

                return out;

            })()
        );
        */

        this.structure.find(".id_simId").text(
            (() => {

                let out = this.userSim.friendlyName;

                const number = this.userSim.sim.storage.number

                if (!!number) {
                    out += " " + number + " ";
                }

                return out;

            })()
        );

        {

            let text: string | undefined = undefined;

            if (!this.userSim.reachableSimState) {
                text = "Not reachable";
            } else if (!this.userSim.reachableSimState.isGsmConnectivityOk) {
                text = "No GSM connection";
            }

            const $span = this.structure.find(".id_connectivity");

            if (text === undefined) {
                $span.hide();
            } else {
                $span.show().text(text);
            }

        }

        this.structure.find("i")
            .each((_i, e) => {

                const $i = $(e);

                const cellSignalStrength = $i.attr("data-strength");

                if (!cellSignalStrength) {
                    return;
                }

                $i[(
                    !!this.userSim.reachableSimState &&
                    this.userSim.reachableSimState.isGsmConnectivityOk &&
                    cellSignalStrength === this.userSim.reachableSimState.cellSignalStrength
                ) ? "show" : "hide"
                ]();

            });

        this.structure.find(".id_row")[
            !this.userSim.reachableSimState || !this.userSim.reachableSimState.isGsmConnectivityOk ?
                "addClass" : "removeClass"
        ]("offline");


        this.structure.find(".id_ownership").text(
            this.userSim.ownership.status === "OWNED" ?
                "" :
                `owned by: ${this.userSim.ownership.ownerEmail}`
        );

        this.structure.find(".id_gw_location").text(
            [
                this.userSim.gatewayLocation.city || "",
                this.userSim.gatewayLocation.countryIso || "",
                `( ${this.userSim.gatewayLocation.ip} )`
            ].join(" ")
        );

        {

            const span = this.structure.find(".id_owner");

            if (this.userSim.ownership.status === "OWNED") {
                span.parent().hide();
            } else {
                span.text(this.userSim.ownership.ownerEmail);
            }

        }

        this.structure.find(".id_number").text((() => {

            let n = this.userSim.sim.storage.number;

            return n || "Unknown";

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

        {

            const d = this.userSim.dongle;

            this.structure.find(".id_dongle_model").text(
                `${d.manufacturer} ${d.model}`
            );

            this.structure.find(".id_dongle_firm").text(
                d.firmwareVersion
            );

            this.structure.find(".id_dongle_imei").text(
                d.imei
            );

            {
                const span = this.structure.find(".id_voice_support");

                if (d.isVoiceEnabled === undefined) {

                    span.parent().hide();

                } else {

                    span.text(
                        d.isVoiceEnabled ?
                            "yes" :
                            "<a href='https://www.semasim.com/enable-voice'>Not enabled</a>"
                    );

                }
            }


        }

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

    constructor(public readonly userSim: types.UserSim.Usable) {

        this.structure.click(() => {

            if (!this.isSelected) {

                this.isSelected = true;

                this.structure.find(".id_row").addClass("selected");

                this.evtSelected.post();

            }

        });

        this.setDetailsVisibility("HIDDEN");

        this.populate();

    }

}
import { loadUiClassHtml } from "../../../shared/dist/lib/loadUiClassHtml";
import { phoneNumber } from "phone-number";
import { SyncEvent } from "ts-events-extended";

import * as types from "../../../shared/dist/lib/types/userSim";

declare const require: any;

const html = loadUiClassHtml(
    require("../templates/UiHeader.html"),
    "UiHeader"
);

export class UiHeader {

    public readonly structure = html.structure.clone();
    private readonly templates = html.templates.clone();

    public readonly evtJoinCall = new SyncEvent<phoneNumber>();

    public notify(): void {

        this.structure.find(".id_sip_registration_in_progress")[(
            !this.userSim.reachableSimState ||
            this.isRegistered()
        ) ? "hide" : "show"]();

        {

            const text = (() => {

                if (!this.userSim.reachableSimState) {
                    return "Sim not reachable";
                }

                if (!this.userSim.reachableSimState.isGsmConnectivityOk) {
                    return "Not connected to GSM network";
                }

                return undefined;

            })();

            const $span = this.structure.find(".id_offline");

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

        (() => {

            const $i = this.structure.find(".id_sip_registration_in_progress");

            if (!this.userSim.reachableSimState) {

                $i.hide();

                return;

            }

            if ($i.css("display") === "none") {
            }


        })();

        {

            const $i = this.structure.find(".id_sip_registration_in_progress");

            if (!this.userSim.reachableSimState) {
                $i.hide();
            } else if (!this.isSimOnlinePreviousState) {
                $i.show();
            }

        }

        this.isSimOnlinePreviousState = !!this.userSim.reachableSimState;

        (() => {

            const divConf = this.structure.find(".id_conf");

            if (
                !this.userSim.reachableSimState ||
                !this.userSim.reachableSimState.isGsmConnectivityOk ||
                !this.userSim.reachableSimState.ongoingCall
            ) {

                divConf.hide();

                return;

            }

            divConf.show();

            const { ongoingCall } = this.userSim.reachableSimState;

            divConf.find("span").text((() => {

                const contact = this.userSim.phonebook.find(
                    ({ number_raw }) => phoneNumber.areSame(
                        ongoingCall.number, number_raw
                    )
                );

                let peerId = contact === undefined ?
                    phoneNumber.prettyPrint(
                        ongoingCall.number,
                        this.userSim.sim.country ?
                            this.userSim.sim.country.iso : undefined
                    ) : contact.name;



                const userList = ongoingCall.otherUserInCallEmails.map((email, index) => {
                    const { length } = ongoingCall.otherUserInCallEmails;
                    if (index === length - 1) {
                        return email;
                    }
                    if (index === length - 2) {
                        return `${email} and `;
                    }

                    return `${email}, `;

                }).join("");

                if (ongoingCall.isUserInCall) {

                    if (userList === "") {

                        return `You are in call with ${peerId}`;

                    } else {

                        return `You alongside with ${userList} are in call with ${peerId}`;

                    }


                }

                return [
                    userList,
                    ongoingCall.otherUserInCallEmails.length >= 2 ? "are" : "is",
                    `in call with ${peerId}`
                ].join(" ");

            })());

            const $button= divConf.find("button");

            if( ongoingCall.isUserInCall ){
                $button.hide();
                return;
            }

            $button
                .off("click")
                .click(() => this.evtJoinCall.post(ongoingCall.number))
                .show()
                ;

        })();


    }

    private isSimOnlinePreviousState = false;

    constructor(
        public readonly userSim: types.UserSim.Usable,
        private readonly isRegistered: () => boolean
    ) {

        this.notify();

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

                const iso = this.userSim.sim.country ?
                    this.userSim.sim.country.iso : undefined;

                return phoneNumber.prettyPrint(
                    phoneNumber.build(
                        this.userSim.sim.storage.number,
                        iso
                    ),
                    iso
                );

            } else {

                return "";

            }

        })
            .on("dblclick", e => {

                e.preventDefault();

                const selection = window.getSelection();
                const range = document.createRange();
                range.selectNodeContents(e.currentTarget);

                if (selection !== null) {

                    selection.removeAllRanges();
                    selection.addRange(range);

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

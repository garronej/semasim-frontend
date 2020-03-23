import { loadUiClassHtml } from "frontend-shared/dist/lib/loadUiClassHtml";
import { phoneNumber } from "../../../local_modules/phone-number/dist/lib";
import { Evt, IObservable } from "frontend-shared/node_modules/evt";
import { runNowAndWhenEventOccurFactory } from "frontend-shared/dist/tools/runNowAndWhenEventOccurFactory";
import { NonPostableEvts } from "frontend-shared/dist/tools/NonPostableEvts";

import * as types from "frontend-shared/dist/lib/types/userSim";

declare const require: any;

const html = loadUiClassHtml(
    require("../templates/UiHeader.html"),
    "UiHeader"
);

type UserSimEvts = Pick<
    NonPostableEvts<types.UserSim.Usable.Evts.ForSpecificSim>,
    "evtFriendlyNameChange" |
    "evtReachabilityStatusChange" |
    "evtCellularConnectivityChange" |
    "evtCellularSignalStrengthChange" |
    "evtOngoingCall" |
    "evtNewUpdatedOrDeletedContact"
>;

export class UiHeader {

    public readonly structure = html.structure.clone();
    private readonly templates = html.templates.clone();

    public readonly evtJoinCall = new Evt<phoneNumber>();

    constructor(params: {
        userSim: types.UserSim.Usable;
        userSimEvts: UserSimEvts;
        obsIsSipRegistered: IObservable<boolean>;
    }) {

        const { userSim, userSimEvts, obsIsSipRegistered } = params;


        {

            const { runNowAndWhenEventOccur } = runNowAndWhenEventOccurFactory({
                ...userSimEvts,
                "evtIsSipRegisteredValueChange": obsIsSipRegistered.evtChange
            });

            runNowAndWhenEventOccur(
                () => this.structure.find("a.id_friendly_name span")
                    .text(userSim.friendlyName),
                ["evtFriendlyNameChange"]
            );

            runNowAndWhenEventOccur(
                () => this.structure.find(".id_sip_registration_in_progress")[(
                    !userSim.reachableSimState ||
                    obsIsSipRegistered.value
                ) ? "hide" : "show"](),
                [
                    "evtReachabilityStatusChange",
                    "evtIsSipRegisteredValueChange"
                ]
            );

            runNowAndWhenEventOccur(
                () => {
                    const text = (() => {

                        if (!userSim.reachableSimState) {
                            return "Sim not reachable";
                        }

                        if (!userSim.reachableSimState.isGsmConnectivityOk) {
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
                },
                [
                    "evtReachabilityStatusChange",
                    "evtCellularConnectivityChange"
                ]
            );

            runNowAndWhenEventOccur(
                () => this.structure.find("i")
                    .each((_i, e) => {

                        const $i = $(e);

                        const cellSignalStrength = $i.attr("data-strength");

                        if (!cellSignalStrength) {
                            return;
                        }

                        $i[(
                            !!userSim.reachableSimState &&
                            userSim.reachableSimState.isGsmConnectivityOk &&
                            cellSignalStrength === userSim.reachableSimState.cellSignalStrength
                        ) ? "show" : "hide"
                        ]();

                    }),
                [
                    "evtReachabilityStatusChange",
                    "evtCellularConnectivityChange",
                    "evtCellularSignalStrengthChange"
                ]
            );

            runNowAndWhenEventOccur(
                () => {
                    const divConf = this.structure.find(".id_conf");

                    if (
                        !userSim.reachableSimState ||
                        !userSim.reachableSimState.isGsmConnectivityOk ||
                        !userSim.reachableSimState.ongoingCall
                    ) {

                        divConf.hide();

                        return;

                    }

                    divConf.show();

                    const { ongoingCall } = userSim.reachableSimState;

                    divConf.find("span").text((() => {

                        const contact = userSim.phonebook.find(
                            ({ number_raw }) => phoneNumber.areSame(
                                ongoingCall.number, number_raw
                            )
                        );

                        let peerId = contact === undefined ?
                            phoneNumber.prettyPrint(
                                ongoingCall.number,
                                userSim.sim.country ?
                                    userSim.sim.country.iso : undefined
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

                            return userList === "" ?
                                `You are in call with ${peerId}` :
                                `You alongside with ${userList} are in call with ${peerId}`
                                ;

                        }

                        return [
                            userList,
                            ongoingCall.otherUserInCallEmails.length >= 2 ? "are" : "is",
                            `in call with ${peerId}`
                        ].join(" ");

                    })());

                    const $button = divConf.find("button");

                    if (ongoingCall.isUserInCall) {
                        $button.hide();
                        return;
                    }

                    $button
                        .off("click")
                        .click(() => this.evtJoinCall.post(ongoingCall.number))
                        .show()
                        ;
                },
                [
                    "evtReachabilityStatusChange",
                    "evtCellularConnectivityChange",
                    "evtOngoingCall",
                    "evtNewUpdatedOrDeletedContact"
                ]
            );

        }


        this.structure.find("a.id_friendly_name")
            .popover({
                "html": true,
                "trigger": "hover",
                "placement": "right",
                "container": "body",
                "title": "SIM card infos",
                "content": () => this.templates.find("div.id_popover").html()
            });

        this.structure.find("span.id_number").text(
            !!userSim.sim.storage.number ? (() => {

                const iso = userSim.sim.country?.iso;

                return phoneNumber.prettyPrint(
                    phoneNumber.build(
                        userSim.sim.storage.number,
                        iso
                    ),
                    iso
                );

            })() : ""
        )
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
            userSim.sim.country?.iso ?? ""
        );

        this.templates.find("div.id_popover span.id_network").html(
            userSim.sim.serviceProvider.fromImsi ||
            userSim.sim.serviceProvider.fromNetwork ||
            "Unknown"
        );

        this.templates.find("span.id_geoInfo").html((() => {

            let loc = userSim.gatewayLocation;

            return loc.city || loc.subdivisions || loc.countryIso || "?";

        })());

    }

}

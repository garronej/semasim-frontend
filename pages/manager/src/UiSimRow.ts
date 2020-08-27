
import { loadUiClassHtml } from "frontend-shared/dist/lib/loadUiClassHtml";
import * as types from "frontend-shared/dist/lib/types/userSim";
import { Evt, StatefulReadonlyEvt, StatefulEvt } from "frontend-shared/node_modules/evt";

declare const require: (path: string) => any;

const html = loadUiClassHtml(
    require("../templates/UiSimRow.html"),
    "UiSimRow"
);

require("../templates/UiSimRow.less");

type UserSimEvts = Pick<
    types.UserSim.Usable.Evts.ForSpecificSim,
    "evtFriendlyNameChange" |
    "evtReachabilityStatusChange" |
    "evtCellularConnectivityChange" |
    "evtCellularSignalStrengthChange" |
    "evtNewUpdatedOrDeletedContact" |
    "evtDelete"
>;

export class UiSimRow {

    public readonly structure = html.structure.clone();


    constructor(
        params: {
            userSim: types.UserSim.Usable;
            userSimEvts: UserSimEvts;
            evtSelectedUserSim: StatefulEvt<types.UserSim.Usable | null>;
            evtAreDetailsShown: StatefulReadonlyEvt<boolean>;

        }
    ) {
        const { userSim, userSimEvts, evtSelectedUserSim, evtAreDetailsShown } = params;

        this.structure.click(() => evtSelectedUserSim.state = userSim);

        const evtIsRowSelected = Evt.asNonPostable(evtSelectedUserSim.pipe(userSim_ => [userSim_ === userSim]));



        userSimEvts.evtDelete.attachOnce(()=>{
            if( evtIsRowSelected.state ){
                evtSelectedUserSim.state = null;
            }
            this.structure.detach();
        });

        const evtIsVisible = Evt.merge([
            evtIsRowSelected.evtChange,
            evtAreDetailsShown.evtChange
        ])
            .toStateful()
            .pipe(() => [
                !evtAreDetailsShown.state || 
                evtIsRowSelected
            ])
            ;

        {

            Evt.useEffect(
                () => this.structure[evtIsVisible.state ? "show" : "hide"](),
                evtIsVisible.evtChange
            );

            Evt.useEffect(
                () => this.structure.find(".id_details")[evtAreDetailsShown.state ? "show" : "hide"](),
                evtAreDetailsShown.evtChange
            );


            Evt.useEffect(
                () => this.structure.find(".id_row")[evtIsRowSelected.state ? "addClass" : "removeClass"]("selected"),
                evtIsRowSelected.evtChange
            );

            Evt.useEffect(
                () => this.structure.find(".id_simId").text(
                    (() => {

                        let out = userSim.friendlyName;

                        const number = userSim.sim.storage.number

                        if (!!number) {
                            out += " " + number + " ";
                        }

                        return out;

                    })(),
                ),
                userSimEvts.evtFriendlyNameChange
            );

            Evt.useEffect(
                () => {

                    let text: string | undefined = undefined;

                    if (!userSim.reachableSimState) {
                        text = "Not reachable";
                    } else if (!userSim.reachableSimState.isGsmConnectivityOk) {
                        text = "No GSM connection";
                    }

                    const $span = this.structure.find(".id_connectivity");

                    if (text === undefined) {
                        $span.hide();
                    } else {
                        $span.show().text(text);
                    }
                },
                Evt.merge([
                    userSimEvts.evtReachabilityStatusChange,
                    userSimEvts.evtCellularConnectivityChange
                ])
            );

            Evt.useEffect(
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
                Evt.merge([
                    userSimEvts.evtReachabilityStatusChange,
                    userSimEvts.evtCellularConnectivityChange,
                    userSimEvts.evtCellularSignalStrengthChange
                ])
            );

            Evt.useEffect(
                () => this.structure.find(".id_row")[
                    !userSim.reachableSimState || !userSim.reachableSimState.isGsmConnectivityOk ?
                        "addClass" : "removeClass"
                ]("offline"),
                Evt.merge([
                    userSimEvts.evtReachabilityStatusChange,
                    userSimEvts.evtCellularConnectivityChange
                ])
            );

            Evt.useEffect(
                () => this.structure.find(".id_gw_location").text(
                    [
                        userSim.gatewayLocation.city ?? "",
                        userSim.gatewayLocation.countryIso ?? "",
                        `( ${userSim.gatewayLocation.ip} )`
                    ].join(" "),
                ),
                userSimEvts.evtReachabilityStatusChange
            );

            Evt.useEffect(
                () => {

                    const { dongle } = userSim;

                    this.structure.find(".id_dongle_model").text(
                        `${dongle.manufacturer} ${dongle.model}`
                    );

                    this.structure.find(".id_dongle_firm").text(
                        dongle.firmwareVersion
                    );

                    this.structure.find(".id_dongle_imei").text(
                        dongle.imei
                    );

                    {
                        const span = this.structure.find(".id_voice_support");

                        if (dongle.isVoiceEnabled === undefined) {

                            span.parent().hide();

                        } else {

                            span.text(
                                dongle.isVoiceEnabled ?
                                    "yes" :
                                    "<a href='https://www.semasim.com/enable-voice'>Not enabled</a>"
                            );

                        }
                    }

                },
                userSimEvts.evtReachabilityStatusChange

            );

            Evt.useEffect(
                () => this.structure.find(".id_phonebook").text(
                    (() => {

                        let n = userSim.sim.storage.contacts.length;
                        let tot = n + userSim.sim.storage.infos.storageLeft;

                        return `${n}/${tot}`

                    })()
                ),
                userSimEvts.evtNewUpdatedOrDeletedContact
            );


        }

        this.structure.find(".id_ownership").text(
            userSim.ownership.status === "SHARED CONFIRMED" ?
                `owned by: ${userSim.ownership.ownerEmail}` :
                ""
        );

        {

            const span = this.structure.find(".id_owner");

            if (userSim.ownership.status === "OWNED") {
                span.parent().hide();
            } else {
                span.text(userSim.ownership.ownerEmail);
            }

        }

        this.structure.find(".id_number").text(
            userSim.sim.storage.number ?? "Unknown"
        );

        this.structure.find(".id_serviceProvider").text(
            (() => {

                const { serviceProvider } = userSim.sim;

                return serviceProvider.fromImsi ?? serviceProvider.fromNetwork ?? "Unknown" +
                    (userSim.sim.country ? `, ${userSim.sim.country.name}` : "")
                    ;


            })()
        );


        this.structure.find(".id_imsi").text(
            userSim.sim.imsi
        );

        this.structure.find(".id_iccid").text(
            userSim.sim.iccid
        );


    }

}
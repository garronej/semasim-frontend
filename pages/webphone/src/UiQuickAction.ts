import { Evt, StatefulReadonlyEvt } from "frontend-shared/node_modules/evt";
import * as types from "frontend-shared/dist/lib/types";
import { loadUiClassHtml } from "frontend-shared/dist/lib/loadUiClassHtml";
import { phoneNumber } from "frontend-shared/node_modules/phone-number";


type UserSimEvts = Pick<
    types.UserSim.Usable.Evts.ForSpecificSim,
    "evtReachabilityStatusChange" |
    "evtCellularConnectivityChange" |
    "evtOngoingCall"
>;

declare const require: any;


export type UiQuickAction = InstanceType<ReturnType<typeof uiQuickActionDependencyInjection>["UiQuickAction"]>;

export function uiQuickActionDependencyInjection(
    params: {
        dialogApi: typeof import("frontend-shared/dist/tools/modal/dialog").dialogApi;
    }
) {

    const { dialogApi } = params;

    $.validator.addMethod(
        "validateTelInput",
        (value, element) => {

            try {

                phoneNumber.build(
                    value,
                    $(element).intlTelInput("getSelectedCountryData").iso2,
                    "MUST BE DIALABLE"
                );

            } catch{

                return false;

            }

            return true;
        },
        "Malformed phone number"
    );

    const html = loadUiClassHtml(
        require("../templates/UiQuickAction.html"),
        "UiQuickAction"
    );

    class UiQuickAction {

        public readonly structure = html.structure.clone();
        private readonly templates = html.templates.clone();

        public evtVoiceCall = new Evt<phoneNumber>();
        public evtSms = new Evt<phoneNumber>();
        public evtNewContact = new Evt<phoneNumber>();



        constructor(params: {
            userSim: types.UserSim.Usable;
            userSimEvts: UserSimEvts;
            evtIsSipRegistered: StatefulReadonlyEvt<boolean>;
        }) {

            const { userSim, userSimEvts, evtIsSipRegistered } = params;


            const input = this.structure.find("input.id_tel-input");



            //TODO add if bug "utilsScript": "/intl-tel-input/build/js/utils.js",

            const simIso = userSim.sim.country?.iso;
            const gwIso = userSim.gatewayLocation.countryIso;

            (() => {

                let intlTelInputOptions: IntlTelInput.Options = {
                    "dropdownContainer": "body"
                };

                let preferredCountries: string[] = [];

                if (simIso) {

                    preferredCountries.push(simIso);

                }

                if (gwIso && simIso !== gwIso) {

                    preferredCountries.push(gwIso);

                }

                if (preferredCountries.length) {
                    intlTelInputOptions.preferredCountries = preferredCountries;
                }

                if (simIso || gwIso) {
                    intlTelInputOptions.initialCountry = simIso || gwIso;
                }

                input.intlTelInput(intlTelInputOptions);

            })();

            const { evtPhoneNumber } =
                (() => {

                    const evtPhoneNumber = Evt.create<string>("");

                    input.change(() =>
                        evtPhoneNumber.state = phoneNumber.build(
                            input.val(),
                            input.intlTelInput("getSelectedCountryData")?.iso2
                        )
                    );

                    return { evtPhoneNumber };


                })()
                ;

            (() => {


                input.on("countrychange", function calleeA(_, countryData: IntlTelInput.CountryData) {

                    if (countryData.iso2 === simIso) return;

                    input.off("countrychange", undefined, calleeA as any);

                    dialogApi.create("alert", {
                        "message": [
                            "Warning: Consult ",
                            userSim.sim.serviceProvider.fromImsi || "Your operator",
                            `'s pricing for Calls/SMS toward ${countryData.name}`
                        ].join("")
                    });

                    input.on("countrychange", function calleeB(_, countryData: IntlTelInput.CountryData) {

                        if (countryData.iso2 !== simIso) return;

                        //staticNotification.close();

                        input.off("countrychange", undefined, calleeB as any);

                        input.on("countrychange", calleeA);

                    });

                });

            })();

            input.popover({
                "html": true,
                "trigger": "manual",
                "placement": "right",
                "container": "body",
                "content": () => this.templates.find("div.id_popover").html()
            });

            let validator = this.structure.find("form.id_form").validate({
                "debug": true,
                "onsubmit": false,
                "rules": {
                    "tel-input": {
                        "validateTelInput": true
                    }
                },
                "errorPlacement": error => {

                    const message = input.val() === "" ? "First enter the number" : $(error).text();

                    this.templates.find("div.id_popover span.id_error-message").html(message);

                    input.popover("show");

                },
                "success": () => input.popover("hide")
            });


            this.structure.on("mouseleave", () => input.popover("hide"));

            this.structure.find("button").on("click", event => {

                if (!validator.form()) {
                    return;
                }

                let evt: Evt<phoneNumber>;

                if ($(event.currentTarget).hasClass("id_call")) {
                    evt = this.evtVoiceCall;
                } else if ($(event.currentTarget).hasClass("id_sms")) {
                    evt = this.evtSms;
                } else if ($(event.currentTarget).hasClass("id_contact")) {
                    evt = this.evtNewContact;
                }

                evt!.post(evtPhoneNumber.state);

                if (simIso) {
                    input.intlTelInput("setCountry", simIso);
                }

                input.intlTelInput("setNumber", "");

            });

            Evt.useEffect(
                () => {

                    this.structure.find(".id_sms")
                        .prop("disabled", !evtIsSipRegistered.state);

                    this.structure.find(".id_contact")
                        .prop("disabled", !userSim.reachableSimState);
                },
                evtIsSipRegistered.evtChange
            );

            types.Webphone.useEffectCanCall(
                canCall => this.structure.find(".id_call").prop("disabled", !canCall),
                {
                    "evtWebphone": Evt.create<types.Webphone.useEffectCanCall.WebphoneLike>({
                        userSim,
                        userSimEvts,
                        evtIsSipRegistered
                    }),
                    "evtPhoneNumberRaw": evtPhoneNumber
                }
            );


            /*
            Evt.useEffect(
                () => this.structure.find(".id_call").prop("disabled", (
                    !evtIsSipRegistered.state ||
                    !userSim.reachableSimState ||
                    !userSim.reachableSimState.isGsmConnectivityOk ||
                    !!userSim.reachableSimState.ongoingCall
                )),
                Evt.merge([
                    evtIsSipRegistered.evtChange,
                    userSimEvts.evtReachabilityStatusChange,
                    userSimEvts.evtCellularConnectivityChange,
                    userSimEvts.evtOngoingCall
                ])
            );
            */

        }
    }

    return { UiQuickAction };

}


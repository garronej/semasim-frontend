import { SyncEvent } from "ts-events-extended";
import * as types from "../../../shared/dist/lib/types/userSim";
import { loadUiClassHtml } from "../../../shared/dist/lib/loadUiClassHtml";
import { phoneNumber } from "phone-number";
import * as bootbox_custom from "../../../shared/dist/tools/bootbox_custom";

declare const require: any;

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

export class UiQuickAction {

    public readonly structure = html.structure.clone();
    private readonly templates = html.templates.clone();

    public evtVoiceCall = new SyncEvent<phoneNumber>();
    public evtSms = new SyncEvent<phoneNumber>();
    public evtNewContact = new SyncEvent<phoneNumber>();

    public notifySimOnlineStatusChanged() {

        this.structure.find("button").prop("disabled", !this.userSim.isOnline);

    }

    constructor(
        public readonly userSim: types.UserSim.Usable
    ) {

        let input = this.structure.find("input.id_tel-input");

        //TODO add if bug "utilsScript": "/intl-tel-input/build/js/utils.js",

        let simIso = this.userSim.sim.country ? this.userSim.sim.country.iso : undefined;
        let gwIso = this.userSim.gatewayLocation.countryIso;

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

        (() => {

            let self = this;

            input.on("countrychange", function calleeA(_, countryData: IntlTelInput.CountryData) {

                if (countryData.iso2 === simIso) return;

                input.off("countrychange", undefined, calleeA as any);

                bootbox_custom.alert([
                    "Warning: Consult ",
                    self.userSim.sim.serviceProvider.fromImsi || "Your operator",
                    `'s pricing for Calls/SMS toward ${countryData.name}`
                ].join(""));

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

            let evt: SyncEvent<phoneNumber>;

            if ($(event.currentTarget).hasClass("id_call")) {
                evt = this.evtVoiceCall;
            } else if ($(event.currentTarget).hasClass("id_sms")) {
                evt = this.evtSms;
            } else if ($(event.currentTarget).hasClass("id_contact")) {
                evt = this.evtNewContact;
            }

            evt!.post(
                phoneNumber.build(
                    input.val(),
                    input.intlTelInput("getSelectedCountryData").iso2
                )
            );

            if (simIso) {
                input.intlTelInput("setCountry", simIso);
            }

            input.intlTelInput("setNumber", "");

        });

        this.notifySimOnlineStatusChanged();

    }
}

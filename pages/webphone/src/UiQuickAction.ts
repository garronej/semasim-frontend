import { SyncEvent } from "ts-events-extended";
import { loadHtml } from "./loadHtml";
import { declaration } from "../../../api";
import Types = declaration.Types;

declare const require: any;

(() => {

    let errorMessages = Object.keys((intlTelInputUtils as any).validationError)
        .map(value => value.toLowerCase().split("_").join(" "));

    $.validator.addMethod("validateTelInput", (value, element) =>
        $(element).intlTelInput("getValidationError") === intlTelInputUtils.validationError.IS_POSSIBLE,
        ((bool, element) => errorMessages[$(element).intlTelInput("getValidationError")]) as any
    );


})();


const html = loadHtml(
    require("../templates/UiQuickAction.html"),
    "UiQuickAction"
);

export class UiQuickAction {

    public readonly structure = html.structure.clone();
    private readonly templates = html.templates.clone();

    //TODO: type StaticNotificationWidget
    public evtStaticNotification = new SyncEvent<any>();
    public evtVoiceCall = new SyncEvent<string>();
    public evtSms = new SyncEvent<string>();
    public evtNewContact = new SyncEvent<string>();

    constructor(
        public readonly userSim: Types.UserSim.Usable
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

                //TODO: do with StaticNotificationWidget
                let staticNotification = {
                    "message": [
                        "Warning: Consult ",
                        self.userSim.sim.serviceProvider.fromImsi || "Your operator",
                        `'s pricing for Calls/SMS toward ${countryData.name}`
                    ].join("")
                };

                self.evtStaticNotification.post(staticNotification);

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

                this.templates.find("div.id_popover span.id_error-message").html($(error).text());

                input.popover("show");

            },
            "success": () => input.popover("hide")
        });


        this.structure.on("mouseleave", () => input.popover("hide"));

        this.structure.find("button.id_call").on("click", () => {

            console.log("number RFC: ", input.intlTelInput("getNumber", intlTelInputUtils.numberFormat.RFC3966));
            console.log("number E164: ", input.intlTelInput("getNumber", intlTelInputUtils.numberFormat.E164));
            console.log("number INTERNATIONAL: ", input.intlTelInput("getNumber", intlTelInputUtils.numberFormat.INTERNATIONAL));
            console.log("number NATIONAL: ", input.intlTelInput("getNumber", intlTelInputUtils.numberFormat.NATIONAL));
            console.log("number raw: ", input.intlTelInput("getNumber"));

            if (!validator.form()) return;

            this.evtVoiceCall.post(
                input.intlTelInput("getNumber", intlTelInputUtils.numberFormat.E164)
            );

            if (simIso) {
                input.intlTelInput("setCountry", simIso);
            }
            input.intlTelInput("setNumber", "");

        });

        this.structure.find("button.id_sms").on("click", () => {

            if (!validator.form()) return;

            this.evtSms.post(
                input.intlTelInput("getNumber", intlTelInputUtils.numberFormat.E164)
            );


            if (simIso) {
                input.intlTelInput("setCountry", simIso);
            }
            input.intlTelInput("setNumber", "");

        });

        this.structure.find("button.id_newContact").on("click", () => {

            if (!validator.form()) return;

            this.evtNewContact.post(
                input.intlTelInput("getNumber", intlTelInputUtils.numberFormat.E164)
            );

            if (simIso) {
                input.intlTelInput("setCountry", simIso);
            }
            input.intlTelInput("setNumber", "");

        });

    }
}

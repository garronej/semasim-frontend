//TODO: import
declare const StaticNotificationWidget: any;
import { SyncEvent } from "ts-events-extended";
import { loadHtml } from "./loadHtml";

declare const require: any;

(() => {

    let errorMessages = Object.keys(
        (intlTelInputUtils as any).validationError
    ).map(
        value => value.toLowerCase().split("_").join(" ")
        );

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


    public readonly structure= html.structure.clone();
    private readonly templates= html.templates.clone();

    //TODO: type StaticNotificationWidget
    public evtStaticNotification = new SyncEvent<any>();
    public evtVoiceCall = new SyncEvent<string>();
    public evtSms = new SyncEvent<string>();
    public evtNewContact = new SyncEvent<string>();

    constructor(
        public readonly data: UiQuickAction.Data
    ) {

        this.structure = html.structure.clone();
        this.templates = html.templates.clone();

        let input = this.structure.find("input.id_telInput");

        input.intlTelInput({
            "dropdownContainer": "body",
            //"utilsScript": "/intl-tel-input/build/js/utils.js",
            "preferredCountries": (() => {

                let out = [this.data.simCountry];

                if (this.data.locationCountry !== this.data.simCountry) {

                    out.push(this.data.locationCountry);

                }

                return out;

            })(),
            "initialCountry": this.data.simCountry
        });

        (() => {

            let self = this;

            input.on("countrychange", function calleeA(_, countryData: IntlTelInput.CountryData) {

                if (countryData.iso2 === self.data.simCountry) return;

                input.off("countrychange", undefined, calleeA as any);

                let staticNotification = new StaticNotificationWidget({
                    "message": "Be aware of roaming Fees!"
                });

                self.evtStaticNotification.post(staticNotification);

                input.on("countrychange", function calleeB(_, countryData: IntlTelInput.CountryData) {

                    if (countryData.iso2 !== self.data.simCountry) return;

                    staticNotification.close();

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
                "telInput": {
                    "validateTelInput": true
                }
            },
            "errorPlacement": error => {

                this.templates.find("div.id_popover span.id_errorMessage").html($(error).text());

                input.popover("show");

            },
            "success": () => input.popover("hide")
        });


        this.structure.on("mouseleave", () => input.popover("hide"));

        this.structure.find("button.id_call").on("click", () => {

            if (!validator.form()) return;

            this.evtVoiceCall.post(
                input.intlTelInput("getNumber", intlTelInputUtils.numberFormat.E164)
            );

            input.intlTelInput("setCountry", this.data.simCountry);
            input.intlTelInput("setNumber", "");

        });

        this.structure.find("button.id_sms").on("click", () => {

            if (!validator.form()) return;

            this.evtSms.post(
                input.intlTelInput("getNumber", intlTelInputUtils.numberFormat.E164)
            );

            input.intlTelInput("setCountry", this.data.simCountry);
            input.intlTelInput("setNumber", "");

        });

        this.structure.find("button.id_newContact").on("click", () => {

            if (!validator.form()) return;

            this.evtNewContact.post(
                input.intlTelInput("getNumber", intlTelInputUtils.numberFormat.E164)
            );

            input.intlTelInput("setCountry", this.data.simCountry);
            input.intlTelInput("setNumber", "");

        });

    }
}

export namespace UiQuickAction {

    export type Data = {
        readonly simCountry: string;
        readonly locationCountry: string;
    };

}


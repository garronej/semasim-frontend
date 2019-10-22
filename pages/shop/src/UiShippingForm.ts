//NOTE: assert maps.googleapis.com/maps/api/js?libraries=places loaded ( or loading ) on the page.

import { VoidSyncEvent } from "frontend-shared/node_modules/ts-events-extended";
import { loadUiClassHtml } from "frontend-shared/dist/lib/loadUiClassHtml";
import * as types from "frontend-shared/dist/lib/types/shop";
import * as modalApi from "frontend-shared/dist/tools/modal";

declare const google: any;
declare const require: any;

const html = loadUiClassHtml(
    require("../templates/UiShippingForm.html"),
    "UiShippingForm"
);

require("../templates/UiShippingForm.less");


export class UiShippingForm {

    private readonly structure = html.structure.clone();

    private readonly hideModal: () => Promise<void>;
    private readonly showModal: () => Promise<void>;

    private readonly evt_id_close_click = new VoidSyncEvent();
    private readonly evt_button_click = new VoidSyncEvent();

    /** 
     * The evt argument should post be posted whenever.
     * -An user accept a sharing request.
     * -An user reject a sharing request.
     * -An user unregistered a shared sim.
     */
    constructor() {

        {

            const { hide, show } = modalApi.createModal(
                this.structure,
                {
                    "keyboard": false,
                    "backdrop": true
                }
            );

            this.hideModal = hide;
            this.showModal = show;

        }

        this.structure.find(".id_close")
            .on("click", () => this.evt_id_close_click.post());
        this.structure.find("button")
            .on("click", () => this.evt_button_click.post());

        for (const selector of [
            ".id_firstName",
            ".id_lastName",
            ".id_placeAutocomplete",
            ".id_extra"
        ]) {

            const $input = this.structure.find(selector);

            $input.on("keypress", () =>
                $input.removeClass("field-error")
            );

        }

    }



    private autocomplete: any | undefined = undefined;

    private async initAutocomplete() {

        const isGoogleMapScriptReady = () => {

            if (typeof google === "undefined") {
                return false;
            }

            try {
                google.maps.places.Autocomplete;
            } catch{
                return false;
            }

            return true;

        };

        while (!isGoogleMapScriptReady()) {
            await new Promise(resolve => setTimeout(resolve, 200));
        }

        this.autocomplete = new google.maps.places.Autocomplete(
            this.structure.find(".id_placeAutocomplete").get(0),
            { "types": ["geocode"] }
        );

        this.autocomplete.setFields(["address_component"]);

    }

    public async interact_getAddress(): Promise<types.ShippingFormData | undefined> {

        let resolvePrOut: (shippingFormData: types.ShippingFormData | undefined) => void;

        const prOut = new Promise<types.ShippingFormData | undefined>(
            resolve => resolvePrOut = resolve
        );

        this.evt_id_close_click.detach();
        this.evt_button_click.detach();

        this.evt_id_close_click.attach(async () => {

            await this.hideModal();

            resolvePrOut(undefined);

        });

        this.evt_button_click.attach(async () => {

            {

                let isFormValidated = true;

                for (const selector of [
                    ".id_firstName",
                    ".id_lastName",
                    ".id_placeAutocomplete"
                ]) {

                    const $input = this.structure.find(selector);

                    let isValid = !!$input.val();

                    if (selector === ".id_placeAutocomplete") {

                        isValid = isValid && !!this.autocomplete.getPlace();

                    }


                    if (!isValid) {

                        $input.addClass("field-error");

                        isFormValidated = false;

                    }

                }

                if (!isFormValidated) {
                    return;
                }

            }

            await this.hideModal();

            resolvePrOut({
                "firstName": this.structure.find(".id_firstName").val(),
                "lastName": this.structure.find(".id_lastName").val(),
                "addressComponents": this.autocomplete.getPlace()["address_components"],
                "addressExtra": this.structure.find(".id_extra").val() || undefined
            });

        });

        this.evt_id_close_click.attachOnce(() => resolvePrOut(undefined));

        await this.showModal();

        if (this.autocomplete === undefined) {
            await this.initAutocomplete();
        }

        return prOut;

    }


}



//NOTE: assert maps.googleapis.com/maps/api/js?libraries=places loaded ( or loading ) on the page.

import { SyncEvent, VoidSyncEvent } from "ts-events-extended";
import { loadUiClassHtml } from "../../../shared/dist/lib/loadUiClassHtml";
import * as modal_stack from "../../../shared/dist/lib/tools/modal_stack";

declare const google: any;
declare const require: any;

const html = loadUiClassHtml(
    require("../templates/UiShippingAddress.html"),
    "UiShippingAddress"
);

require("../templates/UiShippingAddress.less");

export class UiShippingAddress {

    private readonly structure = html.structure.clone();

    private readonly hideModal: () => Promise<void>;
    private readonly showModal: () => Promise<void>;

    private readonly evtClose = new VoidSyncEvent();

    /** 
     * The evt argument should post be posted whenever.
     * -An user accept a sharing request.
     * -An user reject a sharing request.
     * -An user unregistered a shared sim.
     */
    constructor() {

        const { hide, show } = modal_stack.add(
            this.structure,
            {
                "keyboard": false,
                "backdrop": true
            }
        );

        this.hideModal = hide;
        this.showModal = show;

        this.structure.find(".id_close").on("click", () => this.evtClose.post());

        this.evtClose.attach(() => this.hideModal());


    }


    private isInitialized = false;

    private evtPlace = new SyncEvent<any | undefined>();

    public async interact_getAddress(): Promise<any> {

        let resolvePrOut: (place: any) => void;

        const prOut = new Promise(resolve => resolvePrOut = resolve);

        this.evtPlace.attachOnce(async place =>
            this.structure.find("button")
                .removeAttr("disabled")
                .one("click", async () => {

                    await this.hideModal();
                    resolvePrOut(place);

                })
        );

        this.evtClose.attachOnce(() => resolvePrOut(undefined));

        await this.showModal();

        if (!this.isInitialized) {

            this.structure.find("button").attr("disabled", "");

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
                console.log("waiting for script...");
                await new Promise(resolve => setTimeout(resolve, 200));
            }

            const autocomplete = new google.maps.places.Autocomplete(
                this.structure.find("input").get(0),
                { "types": ["geocode"] }
            );

            autocomplete.setFields(["address_component"]);

            autocomplete.addListener("place_changed",
                () => this.evtPlace.post(
                    autocomplete.getPlace()
                )
            );

            this.isInitialized = true;

        }

        return prOut;

    }


}



import { Tracked, Trackable } from "frontend-shared/node_modules/evt";
import { loadUiClassHtml } from "frontend-shared/dist/lib/loadUiClassHtml";
import * as types from "frontend-shared/dist/lib/types/UserSim";
import { Evt } from "frontend-shared/node_modules/evt";

declare const require: (path: string) => any;

const html = loadUiClassHtml(
    require("../templates/UiButtonBar.html"),
    "UiButtonBar"
);

export class UiButtonBar {

    public readonly structure = html.structure.clone();

    public readonly trkAreDetailsShown: Trackable<boolean>;

    constructor(
        params: {
            obsSelectedUserSim: Trackable<types.UserSim.Usable | null>;
            onButtonClicked(params: { userSim: types.UserSim.Usable; button: "DELETE" | "CONTACTS" | "SHARE" | "REBOOT" | "RENAME"; }): void;
        }
    ) {

        const { obsSelectedUserSim } = params;

        const obsAreDetailsShown = new Tracked(false);

        this.trkAreDetailsShown = obsAreDetailsShown;

        const onButtonClicked = (button: Parameters<typeof params.onButtonClicked>[0]["button"]) => {

            const userSim = obsSelectedUserSim.val;

            if (userSim === null) {
                return;
            }

            params.onButtonClicked({ userSim, button });

        };

        const buttons = this.structure.find("button");

        const btnDetail = $(buttons.get(0));
        const btnBack = $(buttons.get(1));
        const btnDelete = $(buttons.get(2));
        const btnContacts = $(buttons.get(3));
        const btnShare = $(buttons.get(4));
        const btnRename = $(buttons.get(5));
        const btnReboot = $(buttons.get(6));

        btnDetail.click(() => obsAreDetailsShown.val= true);

        btnBack.click(() => obsAreDetailsShown.val =false);

        obsSelectedUserSim.evt.attach(
            () => obsAreDetailsShown.val= false
        );

        btnDelete.click(() => onButtonClicked("DELETE"));
        btnContacts.click(() => onButtonClicked("CONTACTS"));

        btnShare.tooltip();
        btnShare.click(() => onButtonClicked("SHARE"));

        btnRename.click(() => onButtonClicked("RENAME"));

        btnReboot.tooltip();
        btnReboot.click(() => onButtonClicked("REBOOT"));



        Evt.useEffect(
            () => {

                buttons.prop("disabled", false);
                btnDetail.show();
                btnBack.show();

                if (obsSelectedUserSim.val === null) {

                    buttons.each(i => {
                        $(buttons[i]).prop("disabled", true);
                    });

                }

                if (obsAreDetailsShown.val) {
                    btnDetail.hide();
                } else {
                    btnBack.hide();
                }

                if (
                    obsSelectedUserSim.val === null ||
                    !types.UserSim.Owned.match(obsSelectedUserSim.val)
                ) {

                    btnShare.prop("disabled", true);

                }

                if (!obsSelectedUserSim.val?.reachableSimState) {
                    btnReboot.prop("disabled", true);
                }

            },
            Evt.merge([
                obsSelectedUserSim.evt,
                obsAreDetailsShown.evt
            ])
        );

    }

}


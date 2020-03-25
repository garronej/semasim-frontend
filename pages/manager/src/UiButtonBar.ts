import { Observable, IObservable } from "frontend-shared/node_modules/evt";
import { loadUiClassHtml } from "frontend-shared/dist/lib/loadUiClassHtml";
import * as types from "frontend-shared/dist/lib/types/UserSim";
import { runNowAndWhenEventOccurFactory } from "frontend-shared/dist/tools/runNowAndWhenEventOccurFactory";

declare const require: (path: string) => any;

const html = loadUiClassHtml(
    require("../templates/UiButtonBar.html"),
    "UiButtonBar"
);

export class UiButtonBar {

    public readonly structure = html.structure.clone();

    public readonly obsAreDetailsShown: IObservable<boolean>;

    constructor(
        params: {
            obsSelectedUserSim: IObservable<types.UserSim.Usable | null>;
            onButtonClicked(params: { userSim: types.UserSim.Usable; button: "DELETE" | "CONTACTS" | "SHARE" | "REBOOT" | "RENAME"; }): void;
        }
    ) {

        const { obsSelectedUserSim } = params;

        const obsAreDetailsShown = new Observable(false);

        this.obsAreDetailsShown = obsAreDetailsShown;

        const onButtonClicked = (button: Parameters<typeof params.onButtonClicked>[0]["button"]) => {

            const userSim = obsSelectedUserSim.value;

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

        btnDetail.click(() => obsAreDetailsShown.onPotentialChange(true));

        btnBack.click(() => obsAreDetailsShown.onPotentialChange(false));

        obsSelectedUserSim.evtChange.attach(
            () => obsAreDetailsShown.onPotentialChange(false)
        );

        btnDelete.click(() => onButtonClicked("DELETE"));
        btnContacts.click(() => onButtonClicked("CONTACTS"));

        btnShare.tooltip();
        btnShare.click(() => onButtonClicked("SHARE"));

        btnRename.click(() => onButtonClicked("RENAME"));

        btnReboot.tooltip();
        btnReboot.click(() => onButtonClicked("REBOOT"));

        {

            const { runNowAndWhenEventOccur } = runNowAndWhenEventOccurFactory({
                "evtSelectedUserSimChange": obsSelectedUserSim.evtChange,
                "evtAreDetailsShownChange": obsAreDetailsShown.evtChange
            });

            runNowAndWhenEventOccur(
                () => {

                    buttons.prop("disabled", false);
                    btnDetail.show();
                    btnBack.show();

                    if (obsSelectedUserSim.value === null) {

                        buttons.each(i => {
                            $(buttons[i]).prop("disabled", true);
                        });

                    }

                    if (obsAreDetailsShown.value) {
                        btnDetail.hide();
                    } else {
                        btnBack.hide();
                    }

                    if (
                        obsSelectedUserSim.value === null ||
                        !types.UserSim.Owned.match(obsSelectedUserSim.value)
                    ) {

                        btnShare.prop("disabled", true);

                    }

                    if (!obsSelectedUserSim.value?.reachableSimState) {
                        btnReboot.prop("disabled", true);
                    }


                },
                [
                    "evtSelectedUserSimChange",
                    "evtAreDetailsShownChange"
                ]
            );

        }



    }

}


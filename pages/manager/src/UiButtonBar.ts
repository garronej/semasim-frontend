import { Evt, StatefulReadonlyEvt } from "frontend-shared/node_modules/evt";
import { loadUiClassHtml } from "frontend-shared/dist/lib/loadUiClassHtml";
import * as types from "frontend-shared/dist/lib/types/UserSim";

declare const require: (path: string) => any;

const html = loadUiClassHtml(
    require("../templates/UiButtonBar.html"),
    "UiButtonBar"
);

export class UiButtonBar {

    public readonly structure = html.structure.clone();

    public readonly evtAreDetailsShown= Evt.asNonPostable(Evt.create(false));

    constructor(
        params: {
            evtSelectedUserSim: StatefulReadonlyEvt<types.UserSim.Usable | null>;
            onButtonClicked(params: { userSim: types.UserSim.Usable; button: "DELETE" | "CONTACTS" | "SHARE" | "REBOOT" | "RENAME"; }): void;
        }
    ) {

        const { evtSelectedUserSim } = params;

        const onButtonClicked = (button: Parameters<typeof params.onButtonClicked>[0]["button"]) => {

            const userSim = evtSelectedUserSim.state;

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

        btnDetail.click(() => Evt.asPostable(this.evtAreDetailsShown).state = true);

        btnBack.click(() => Evt.asPostable(this.evtAreDetailsShown).state = false);

        evtSelectedUserSim.evtChange.attach(
            () => Evt.asPostable(this.evtAreDetailsShown).state= false
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

                if (evtSelectedUserSim.state === null) {

                    buttons.each(i => {
                        $(buttons[i]).prop("disabled", true);
                    });

                }

                if ( this.evtAreDetailsShown.state) {
                    btnDetail.hide();
                } else {
                    btnBack.hide();
                }

                if (
                    evtSelectedUserSim.state === null ||
                    !types.UserSim.Owned.match(evtSelectedUserSim.state)
                ) {

                    btnShare.prop("disabled", true);

                }

                if (!evtSelectedUserSim.state?.reachableSimState) {
                    btnReboot.prop("disabled", true);
                }

            },
            Evt.merge([
                evtSelectedUserSim.evtChange,
                this.evtAreDetailsShown.evtChange
            ])
        );

    }

}


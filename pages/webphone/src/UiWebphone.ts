import { loadHtml } from "./loadHtml";
import { types } from "../../../api";

import { UiQuickAction } from "./UiQuickAction";
import { UiHeader } from "./UiHeader";
import { UiPhonebook } from "./UiPhonebook";
import { VoidSyncEvent } from "ts-events-extended";



declare const require: any;

const html = loadHtml(
    require("../templates/UiWebphone.html"),
    "UiWebphone"
);

export class UiWebphone {

    public readonly structure = html.structure.clone();

    public readonly evtUp= new VoidSyncEvent();

    constructor(
        public readonly userSim: types.UserSim.Usable,
        public readonly wdInstance: types.WebphoneData.Instance
    ) {

        let uiHeader= new UiHeader(this.userSim);

        this.structure.find("div.id_header").append(uiHeader.structure);

        uiHeader.evtUp.attach(()=> this.evtUp.post());



        let uiQuickAction= new UiQuickAction(this.userSim);

        this.structure.find("div.id_colLeft").append(uiQuickAction.structure);

        uiQuickAction.evtNewContact.attach(number => {
            console.log("uiQuickAction evtNewContact", { number });
        });

        uiQuickAction.evtSms.attach(number=> {
            console.log("uiQuickAction evtSms", { number });
        });

        uiQuickAction.evtVoiceCall.attach( number=> {
            console.log("uiQuickAction evtVoiceCall", { number });
        });

        uiQuickAction.evtStaticNotification.attach( staticNotification => {

            let str= JSON.stringify(staticNotification);

            this.structure.find(".id_staticNotifications").html(`<h1>${str}</h1>`);

        });



        let uiPhonebook= new UiPhonebook(this.userSim, wdInstance);

        this.structure.find("div.id_colLeft").append(uiPhonebook.structure);

        uiPhonebook.evtContactSelected.attach(wdChat => {

            console.log("uiPhonebook evtContactSelected", { wdChat });

        });

        $('body').data('dynamic').panels();


    }
}

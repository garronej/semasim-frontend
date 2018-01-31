import { SyncEvent } from "ts-events-extended";
import { loadHtml } from "./loadHtml";
import { declaration } from "../../../api";
import Types = declaration.Types;

import { UiQuickAction } from "./UiQuickAction";
import { UiHeader } from "./UiHeader";

declare const require: any;

const html = loadHtml(
    require("../templates/UiWebphone.html"),
    "UiWebphone"
);

export class UiWebphone {

    public readonly structure = html.structure.clone();
    private readonly templates = html.templates.clone();

    constructor(
        public readonly userSim: Types.UserSim.Usable
    ) {

        this.structure = html.structure.clone();
        this.templates = html.templates.clone();

        let uiHeader= new UiHeader(this.userSim);

        this.structure.find("div.id_header").append(uiHeader.structure);

        let uiQuickAction= new UiQuickAction(this.userSim);

        this.structure.find("div.id_colLeft").append(uiQuickAction.structure);

        $('body').data('dynamic').panels();

    }
}

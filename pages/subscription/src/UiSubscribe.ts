import { loadUiClassHtml } from "../../../shared/dist/lib/tools/loadUiClassHtml";
import { VoidSyncEvent } from "ts-events-extended";

declare const require: (path: string) => any;

const html = loadUiClassHtml(
    require("../templates/UiSubscribe.html"),
    "UiSubscribe"
);

export class UiSubscribe {

    public readonly structure = html.structure.clone();

    public readonly evtRequestSubscribe = new VoidSyncEvent();

    constructor() {

        this.structure.find("button")
            .on("click", () => this.evtRequestSubscribe.post())
            ;

    }

}


import { loadUiClassHtml } from "frontend-shared/dist/lib/loadUiClassHtml";

declare const require: (path: string) => any;

const html = loadUiClassHtml(
    require("../templates/UiDownloadButtons.html"),
    "UiDownloadButtons"
);

export class UiDownloadButtons {

    public readonly structure = html.structure.clone();

}


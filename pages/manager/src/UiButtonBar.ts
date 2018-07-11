import { VoidSyncEvent } from "ts-events-extended";
import * as tools from "../../../tools";

declare const require: (path: string) => any;

const html = tools.loadUiClassHtml(
    require("../templates/UiButtonBar.html"),
    "UiButtonBar"
);

export class UiButtonBar {

    public readonly structure = html.structure.clone();

    public evtClickBack = new VoidSyncEvent();
    public evtClickDetail = new VoidSyncEvent();
    public evtClickDelete = new VoidSyncEvent();
    public evtClickShare = new VoidSyncEvent();
    public evtClickPhonebook = new VoidSyncEvent();
    public evtClickRename = new VoidSyncEvent();
    public evtClickRefresh = new VoidSyncEvent();

    private readonly buttons = this.structure.find("button");

    public readonly btnDetail = $(this.buttons.get(0));
    private readonly btnBack = $(this.buttons.get(1));
    private readonly btnDelete = $(this.buttons.get(2));
    private readonly btnShare = $(this.buttons.get(3));
    private readonly btnRename = $(this.buttons.get(4));
    private readonly btnReload = $(this.buttons.get(5));

    public state: UiButtonBar.State;

    public setState(state: Partial<UiButtonBar.State>) {

        for (let key in state) {
            this.state[key] = state[key];
        }

        this.buttons.removeClass("disabled");
        this.btnDetail.show();
        this.btnBack.show();

        if (!this.state.isSimRowSelected) {

            this.buttons.each(i => {

                const button = $(this.buttons[i]);

                if (button.get(0) !== this.btnReload.get(0)) {
                    button.addClass("disabled");
                }
            });

        }

        if (this.state.areDetailsShown) {
            this.btnDetail.hide();
        } else {
            this.btnBack.hide();
        }

        if (!this.state.isSimSharable) {
            this.btnShare.addClass("disabled");
        }


    }

    constructor() {

        this.btnDetail.click(() => {
            this.setState({ "areDetailsShown": true });
            this.evtClickDetail.post();
        });

        this.btnBack.click(() => {
            this.setState({ "areDetailsShown": false });
            this.evtClickBack.post()
        });

        this.btnDelete.click(() => this.evtClickDelete.post());

        this.btnRename.click(() => this.evtClickRename.post());

        this.btnShare.tooltip();

        this.btnShare.click(() => this.evtClickShare.post());

        this.btnReload.tooltip();

        this.btnReload.click(() => this.evtClickRefresh.post());

        this.state = (() => {

            const state: UiButtonBar.State.RowNotSelected = {
                "isSimRowSelected": false,
                "isSimSharable": false,
                "areDetailsShown": false
            };

            return state;

        })();

        this.setState({});

    }

}


export namespace UiButtonBar {

    export type State = State.RowSelected | State.RowNotSelected;

    export namespace State {

        export type RowSelected = {
            isSimRowSelected: true;
            isSimSharable: boolean;
            areDetailsShown: boolean;
        };

        export type RowNotSelected = {
            isSimRowSelected: false;
            isSimSharable: false;
            areDetailsShown: false;
        };

    }

}
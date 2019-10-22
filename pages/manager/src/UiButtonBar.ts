import { SyncEvent, VoidSyncEvent } from "frontend-shared/node_modules/ts-events-extended";
import { loadUiClassHtml } from "frontend-shared/dist/lib/loadUiClassHtml";

declare const require: (path: string) => any;

const html = loadUiClassHtml(
    require("../templates/UiButtonBar.html"),
    "UiButtonBar"
);

export class UiButtonBar {

    public readonly structure = html.structure.clone();


    /** true if detail was clicked */
    public readonly evtToggleDetailVisibility = new SyncEvent<boolean>();

    public readonly evtClickDelete = new VoidSyncEvent();
    public readonly evtClickShare = new VoidSyncEvent();
    public readonly evtClickRename = new VoidSyncEvent();
    public readonly evtClickReboot = new VoidSyncEvent();
    public readonly evtClickContacts = new VoidSyncEvent();

    private readonly buttons = this.structure.find("button");

    public readonly btnDetail = $(this.buttons.get(0));
    private readonly btnBack = $(this.buttons.get(1));
    private readonly btnDelete = $(this.buttons.get(2));
    private readonly btnContacts = $(this.buttons.get(3));
    private readonly btnShare = $(this.buttons.get(4));
    private readonly btnRename = $(this.buttons.get(5));
    private readonly btnReboot = $(this.buttons.get(6));

    public state: UiButtonBar.State;

    public setState(state: Partial<UiButtonBar.State>) {

        for (let key in state) {
            this.state[key] = state[key];
        }

        this.buttons.prop("disabled", false);
        this.btnDetail.show();
        this.btnBack.show();

        if (!this.state.isSimRowSelected) {

            this.buttons.each(i => {
                $(this.buttons[i]).prop("disabled", true );
            });

        }

        if (this.state.areDetailsShown) {
            this.btnDetail.hide();
        } else {
            this.btnBack.hide();
        }

        if (!this.state.isSimSharable) {
            this.btnShare.prop("disabled", true);
        }

        if(!this.state.isSimReachable){
            this.btnReboot.prop("disabled", true);
        }

    }

    constructor() {

        this.btnDetail.click(() => {
            this.setState({ "areDetailsShown": true });
            this.evtToggleDetailVisibility.post(true);
        });

        this.btnBack.click(() => {
            this.setState({ "areDetailsShown": false });
            this.evtToggleDetailVisibility.post(false);
        });

        this.btnDelete.click(() => this.evtClickDelete.post());

        this.btnContacts.click(()=> this.evtClickContacts.post());

        this.btnShare.tooltip();
        this.btnShare.click(() => this.evtClickShare.post());

        this.btnRename.click(() => this.evtClickRename.post());

        this.btnReboot.tooltip();
        this.btnReboot.click(()=> this.evtClickReboot.post());

        this.state = (() => {

            const state: UiButtonBar.State.RowNotSelected = {
                "isSimRowSelected": false,
                "isSimSharable": false,
                "isSimReachable": false,
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
            isSimReachable: boolean;
            areDetailsShown: boolean;
        };

        export type RowNotSelected = {
            isSimRowSelected: false;
            isSimSharable: false;
            isSimReachable: false;
            areDetailsShown: false;
        };

    }

}
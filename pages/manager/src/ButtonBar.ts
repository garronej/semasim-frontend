import { VoidSyncEvent } from "ts-events-extended";

declare const require: (path: string) => any;

export class ButtonBar {

    public readonly structure: JQuery;

    public evtClickBack = new VoidSyncEvent();
    public evtClickDetail = new VoidSyncEvent();
    public evtClickDelete = new VoidSyncEvent();
    public evtClickShare = new VoidSyncEvent();
    public evtClickPhonebook = new VoidSyncEvent();
    public evtClickRename = new VoidSyncEvent();
    public evtClickRefresh = new VoidSyncEvent();

    private readonly buttons: JQuery;

    public readonly btnDetail: JQuery;
    private readonly btnBack: JQuery;
    private readonly btnDelete: JQuery;
    private readonly btnShare: JQuery;
    private readonly btnRename: JQuery;
    private readonly btnReload: JQuery;

    public state: ButtonBar.State;

    public setState(state: Partial<ButtonBar.State>) {

        for (let key in state) {
            this.state[key] = state[key];
        }

        this.buttons.removeClass("disabled");
        this.btnDetail.show();
        this.btnBack.show();

        if (!this.state.isSimRowSelected) {

            this.buttons.each(i => {

                let button = $(this.buttons[i]);

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

        this.structure = $(
            require("../templates/ButtonBar.html")
        );

        this.buttons = this.structure.find("button");

        this.btnDetail = $(this.buttons.get(0));
        this.btnBack = $(this.buttons.get(1));
        this.btnDelete = $(this.buttons.get(2));
        this.btnShare = $(this.buttons.get(3));
        this.btnRename = $(this.buttons.get(4));
        this.btnReload = $(this.buttons.get(5));

        this.btnDetail.click(
            () => {
                this.setState({ "areDetailsShown": true });
                this.evtClickDetail.post();
            }
        );

        this.btnBack.click(
            () => {
                this.setState({ "areDetailsShown": false });
                this.evtClickBack.post()
            }
        );

        this.btnDelete.click(
            () => this.evtClickDelete.post()
        );

        this.btnRename.click(
            () => this.evtClickRename.post()
        );

        this.btnShare.tooltip();
        this.btnReload.tooltip();

        this.btnReload.click(
            () => this.evtClickRefresh.post()
        );


        this.state = (() => {

            let state: ButtonBar.State.RowNotSelected = {
                "isSimRowSelected": false,
                "isSimSharable": false,
                "areDetailsShown": false
            };

            return state;

        })();

        this.setState({});

    }

}


export namespace ButtonBar {

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
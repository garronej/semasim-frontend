/// <reference types="jquery" />
/// <reference types="bootstrap" />
/// <reference types="icheck" />
/// <reference types="jquery.validation" />
/// <reference types="jqueryui" />
import { SyncEvent, VoidSyncEvent } from "ts-events-extended";
export declare class UiButtonBar {
    readonly structure: JQuery;
    /** true if detail was clicked */
    readonly evtToggleDetailVisibility: SyncEvent<boolean>;
    readonly evtClickDelete: VoidSyncEvent;
    readonly evtClickShare: VoidSyncEvent;
    readonly evtClickRename: VoidSyncEvent;
    readonly evtClickReboot: VoidSyncEvent;
    private readonly buttons;
    readonly btnDetail: JQuery;
    private readonly btnBack;
    private readonly btnDelete;
    private readonly btnShare;
    private readonly btnRename;
    private readonly btnReboot;
    state: UiButtonBar.State;
    setState(state: Partial<UiButtonBar.State>): void;
    constructor();
}
export declare namespace UiButtonBar {
    type State = State.RowSelected | State.RowNotSelected;
    namespace State {
        type RowSelected = {
            isSimRowSelected: true;
            isSimSharable: boolean;
            isSimOnline: boolean;
            areDetailsShown: boolean;
        };
        type RowNotSelected = {
            isSimRowSelected: false;
            isSimSharable: false;
            isSimOnline: false;
            areDetailsShown: false;
        };
    }
}

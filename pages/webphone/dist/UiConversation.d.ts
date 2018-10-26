/// <reference types="jquery" />
/// <reference types="bootstrap" />
/// <reference types="icheck" />
/// <reference types="intl-tel-input" />
/// <reference types="jquery.slimscroll" />
/// <reference types="jquery.validation" />
/// <reference types="jqueryui" />
import { VoidSyncEvent, SyncEvent } from "ts-events-extended";
import * as types from "../../../shared/dist/lib/types";
import wd = types.webphoneData;
export declare class UiConversation {
    readonly userSim: types.UserSim.Usable;
    readonly wdChat: wd.Chat;
    readonly structure: JQuery;
    readonly evtUpdateContact: VoidSyncEvent;
    readonly evtVoiceCall: VoidSyncEvent;
    readonly evtSendText: SyncEvent<string>;
    readonly evtDelete: VoidSyncEvent;
    readonly evtChecked: VoidSyncEvent;
    private readonly textarea;
    private readonly aSend;
    private readonly ul;
    private readonly btnUpdateContact;
    private readonly btnCall;
    private readonly btnDelete;
    setReadonly(isReadonly: boolean): void;
    readonly evtLoadMore: SyncEvent<{
        onLoaded: (wdMessages: wd.Message[]) => void;
    }>;
    constructor(userSim: types.UserSim.Usable, wdChat: wd.Chat);
    setSelected(): void;
    unselect(): void;
    private readonly isSelected;
    notifyContactNameUpdated(): void;
    /** indexed but wd.Message.id_ */
    private readonly uiBubbles;
    /**
     * Place uiBubble in the structure, assume all bubbles already sorted
     * return true if the bubble is the last <li> of the <ul>
     * */
    private placeUiBubble;
    /** new Message or update existing one */
    newMessage(wdMessage: wd.Message, mute?: "MUTE" | undefined): void;
}

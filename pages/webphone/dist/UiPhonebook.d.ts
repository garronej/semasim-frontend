/// <reference types="jquery" />
/// <reference types="bootstrap" />
/// <reference types="icheck" />
/// <reference types="intl-tel-input" />
/// <reference types="jquery.slimscroll" />
/// <reference types="jquery.validation" />
/// <reference types="jqueryui" />
import { SyncEvent } from "ts-events-extended";
import * as types from "../../../shared/dist/lib/types";
import wd = types.webphoneData;
export declare class UiPhonebook {
    readonly userSim: types.UserSim.Usable;
    readonly wdInstance: wd.Instance;
    readonly structure: JQuery;
    readonly evtContactSelected: SyncEvent<{
        wdChatPrev: wd.Chat | undefined;
        wdChat: wd.Chat;
    }>;
    constructor(userSim: types.UserSim.Usable, wdInstance: wd.Instance);
    triggerClickOnLastSeenChat(): void;
    /** mapped by wdChat.id_ */
    private readonly uiContacts;
    private createUiContact;
    private updateSearch;
    private placeUiContact;
    /** To create ui contact after init */
    insertContact(wdChat: wd.Chat): void;
    /**
     * triggered by: evt on text input => update last seen => call
     * OR
     * new message arrive => update wdMessage => call
     * OR
     * contact name changed
     * OR
     * contact deleted
     * */
    notifyContactChanged(wdChat: wd.Chat): void;
    triggerContactClick(wdChat: wd.Chat): void;
}

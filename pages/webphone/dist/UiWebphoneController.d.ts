/// <reference types="jquery" />
/// <reference types="bootstrap" />
/// <reference types="icheck" />
/// <reference types="intl-tel-input" />
/// <reference types="jquery.slimscroll" />
/// <reference types="jquery.validation" />
/// <reference types="jqueryui" />
import { VoidSyncEvent } from "ts-events-extended";
import * as types from "../../../shared/dist/lib/types";
import wd = types.webphoneData;
export declare class UiWebphoneController {
    readonly userSim: types.UserSim.Usable;
    readonly wdInstance: wd.Instance;
    readonly structure: JQuery;
    readonly evtUp: VoidSyncEvent;
    private readonly uiVoiceCall;
    private readonly uiHeader;
    private readonly uiQuickAction;
    private readonly uiPhonebook;
    private readonly uiConversations;
    private readonly ua;
    static create(userSim: types.UserSim.Usable): Promise<UiWebphoneController>;
    private constructor();
    private registerRemoteNotifyHandlers;
    private initUa;
    private initUiHeader;
    private initUiQuickAction;
    private initUiPhonebook;
    private initUiConversation;
    private getOrCreateChatByPhoneNumber;
}

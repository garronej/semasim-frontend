/// <reference types="jquery" />
/// <reference types="bootstrap" />
/// <reference types="icheck" />
/// <reference types="intl-tel-input" />
/// <reference types="jquery.slimscroll" />
/// <reference types="jquery.validation" />
/// <reference types="jqueryui" />
import { SyncEvent } from "ts-events-extended";
import * as types from "../../../shared/dist/lib/types";
export declare class UiQuickAction {
    readonly userSim: types.UserSim.Usable;
    readonly structure: JQuery;
    private readonly templates;
    evtStaticNotification: SyncEvent<any>;
    evtVoiceCall: SyncEvent<string>;
    evtSms: SyncEvent<string>;
    evtNewContact: SyncEvent<string>;
    constructor(userSim: types.UserSim.Usable);
}

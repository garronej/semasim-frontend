/// <reference types="jquery" />
/// <reference types="bootstrap" />
/// <reference types="icheck" />
/// <reference types="intl-tel-input" />
/// <reference types="jquery.slimscroll" />
/// <reference types="jquery.validation" />
/// <reference types="jqueryui" />
import { VoidSyncEvent } from "ts-events-extended";
import * as types from "../../../shared/dist/lib/types";
export declare class UiHeader {
    readonly userSim: types.UserSim.Usable;
    readonly structure: JQuery;
    private readonly templates;
    evtUp: VoidSyncEvent;
    /** to call when userSim has changed */
    update(): void;
    constructor(userSim: types.UserSim.Usable);
}

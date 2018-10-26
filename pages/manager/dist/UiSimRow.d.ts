/// <reference types="jquery" />
/// <reference types="bootstrap" />
/// <reference types="icheck" />
/// <reference types="jquery.validation" />
/// <reference types="jqueryui" />
import { VoidSyncEvent } from "ts-events-extended";
import * as types from "../../../shared/dist/lib/types";
export declare class UiSimRow {
    readonly userSim: types.UserSim.Usable;
    readonly structure: JQuery;
    evtSelected: VoidSyncEvent;
    isSelected: boolean;
    unselect(): void;
    setDetailsVisibility(visibility: "SHOWN" | "HIDDEN"): void;
    setVisibility(visibility: "SHOWN" | "HIDDEN"): void;
    /** To call when userSim has changed */
    populate(): void;
    constructor(userSim: types.UserSim.Usable);
}

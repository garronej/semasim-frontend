import * as types from "../../../shared/dist/lib/types";
import { SyncEvent } from "ts-events-extended";
export declare class UiShareSim {
    private readonly evt;
    private readonly structure;
    private readonly buttonClose;
    private readonly buttonStopSharing;
    private readonly divListContainer;
    private readonly inputEmails;
    private readonly textareaMessage;
    private readonly buttonSubmit;
    private readonly divsToHideIfNotShared;
    evtShare: SyncEvent<{
        userSim: types.UserSim._Base<types.SimOwnership.Owned>;
        emails: string[];
        message: string;
        onSubmitted: () => void;
    }>;
    evtStopSharing: SyncEvent<{
        userSim: types.UserSim._Base<types.SimOwnership.Owned>;
        emails: string[];
        onSubmitted: () => void;
    }>;
    private currentUserSim;
    private hide;
    private getInputEmails;
    /**
     * The evt argument should post be posted whenever.
     * -An user accept a sharing request.
     * -An user reject a sharing request.
     * -An user unregistered a shared sim.
     */
    constructor(evt: SyncEvent<{
        userSim: types.UserSim.Owned;
        email: string;
    }>);
    open(userSim: types.UserSim.Owned): void;
}

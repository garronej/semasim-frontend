import * as sipLibrary from "ts-sip";
import { SyncEvent, VoidSyncEvent } from "ts-events-extended";
import * as types from "../types/userSim";
export declare const handlers: sipLibrary.api.Server.Handlers;
export declare const evtSimIsOnlineStatusChange: SyncEvent<types.UserSim._Base<types.SimOwnership.Owned | types.SimOwnership.Shared.Confirmed>>;
/** posted when a user that share the SIM created or updated a contact. */
export declare const evtContactCreatedOrUpdated: SyncEvent<{
    userSim: types.UserSim._Base<types.SimOwnership.Owned | types.SimOwnership.Shared.Confirmed>;
    contact: types.UserSim.Contact;
}>;
export declare const evtContactDeleted: SyncEvent<{
    userSim: types.UserSim._Base<types.SimOwnership.Owned | types.SimOwnership.Shared.Confirmed>;
    contact: types.UserSim.Contact;
}>;
export declare const evtSimPermissionLost: SyncEvent<types.UserSim._Base<types.SimOwnership.Shared.Confirmed>>;
export declare const evtSharingRequestResponse: SyncEvent<{
    userSim: types.UserSim._Base<types.SimOwnership.Owned>;
    email: string;
    isAccepted: boolean;
}>;
export declare const evtSharedSimUnregistered: SyncEvent<{
    userSim: types.UserSim._Base<types.SimOwnership.Owned>;
    email: string;
}>;
export declare const evtOpenElsewhere: VoidSyncEvent;
export declare const getRTCIceServer: () => Promise<RTCIceServer>;

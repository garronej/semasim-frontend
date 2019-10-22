import * as types from "../types/userSim";
import { SyncEvent, VoidSyncEvent } from "ts-events-extended";
import * as sipLibrary from "ts-sip";
/** Posted when user register a new sim on he's LAN or accept a sharing request */
export declare const evtUsableSim: SyncEvent<types.UserSim._Base<types.SimOwnership.Owned | types.SimOwnership.Shared.Confirmed>>;
export declare const evtSimIsOnlineStatusChange: SyncEvent<types.UserSim._Base<types.SimOwnership.Owned | types.SimOwnership.Shared.Confirmed>>;
export declare const evtSimGsmConnectivityChange: SyncEvent<types.UserSim._Base<types.SimOwnership.Owned | types.SimOwnership.Shared.Confirmed>>;
export declare const evtOngoingCall: SyncEvent<types.UserSim._Base<types.SimOwnership.Owned | types.SimOwnership.Shared.Confirmed>>;
export declare const evtSimCellSignalStrengthChange: SyncEvent<types.UserSim._Base<types.SimOwnership.Owned | types.SimOwnership.Shared.Confirmed>>;
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
export declare const evtOtherSimUserUnregisteredSim: SyncEvent<{
    userSim: types.UserSim._Base<types.SimOwnership.Owned>;
    email: string;
}>;
export declare const evtOpenElsewhere: VoidSyncEvent;
export declare namespace rtcIceEServer {
    const evt: SyncEvent<{
        rtcIceServer: RTCIceServer;
        socket: sipLibrary.Socket;
    }>;
    const getCurrent: () => Promise<RTCIceServer>;
}
import * as types from "../types/userSim";
import { SyncEvent, VoidSyncEvent } from "ts-events-extended";
import * as sipLibrary from "ts-sip";
import * as dcTypes from "chan-dongle-extended-client/dist/lib/types";
export declare namespace appEvts {
    /** Posted when user register a new sim on he's LAN or accept a sharing request */
    const evtUsableSim: SyncEvent<types.UserSim._Base<types.SimOwnership.Owned | types.SimOwnership.Shared.Confirmed>>;
    const evtSimReachabilityStatusChange: SyncEvent<types.UserSim._Base<types.SimOwnership.Owned | types.SimOwnership.Shared.Confirmed>>;
    /** NOTE: This is posted when an user lose access to the sim, the password
     * is then renewed, there is not a special notify event from the server
     * but the sim is re-notified online */
    const evtSimPasswordChanged: SyncEvent<types.UserSim._Base<types.SimOwnership.Owned | types.SimOwnership.Shared.Confirmed>>;
    const evtSimGsmConnectivityChange: SyncEvent<types.UserSim._Base<types.SimOwnership.Owned | types.SimOwnership.Shared.Confirmed>>;
    const evtOngoingCall: SyncEvent<types.UserSim._Base<types.SimOwnership.Owned | types.SimOwnership.Shared.Confirmed>>;
    const evtSimCellSignalStrengthChange: SyncEvent<types.UserSim._Base<types.SimOwnership.Owned | types.SimOwnership.Shared.Confirmed>>;
    /** posted when a user that share the SIM created or updated a contact. */
    const evtContactCreatedOrUpdated: SyncEvent<{
        userSim: types.UserSim._Base<types.SimOwnership.Owned | types.SimOwnership.Shared.Confirmed>;
        contact: types.UserSim.Contact;
    }>;
    const evtContactDeleted: SyncEvent<{
        userSim: types.UserSim._Base<types.SimOwnership.Owned | types.SimOwnership.Shared.Confirmed>;
        contact: types.UserSim.Contact;
    }>;
    const evtDongleOnLan: SyncEvent<{
        type: "LOCKED";
        dongle: dcTypes.Dongle.Locked;
        prSimUnlocked: Promise<void>;
    } | {
        type: "USABLE";
        dongle: dcTypes.Dongle.Usable;
    }>;
    const evtSimPermissionLost: SyncEvent<types.UserSim._Base<types.SimOwnership.Shared.Confirmed>>;
    const evtSimSharingRequest: SyncEvent<types.UserSim._Base<types.SimOwnership.Shared.NotConfirmed>>;
    const evtSharingRequestResponse: SyncEvent<{
        userSim: types.UserSim._Base<types.SimOwnership.Owned>;
        email: string;
        isAccepted: boolean;
    }>;
    const evtOtherSimUserUnregisteredSim: SyncEvent<{
        userSim: types.UserSim._Base<types.SimOwnership.Owned>;
        email: string;
    }>;
    const evtOpenElsewhere: VoidSyncEvent;
    namespace rtcIceEServer {
        type DOM_RTCIceServer_subset = {
            credential?: string;
            credentialType?: "password";
            urls: string[];
            username?: string;
        };
        const evt: SyncEvent<{
            rtcIceServer: DOM_RTCIceServer_subset;
            socket: sipLibrary.Socket;
        }>;
        const getCurrent: () => Promise<DOM_RTCIceServer_subset>;
    }
    const evtWdActionFromOtherUa: SyncEvent<import("../../sip_api_declarations/uaToBackend").wd_notifyActionFromOtherUa.Params>;
}
export declare type AppEvts = typeof appEvts;
export declare type SubsetOfAppEvts<K extends keyof AppEvts> = Pick<AppEvts, K>;

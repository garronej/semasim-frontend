
import * as types from "../types/userSim";
import { SyncEvent, VoidSyncEvent } from "ts-events-extended";
import * as sipLibrary from "ts-sip";

/** Posted when user register a new sim on he's LAN or accept a sharing request */
export const evtUsableSim = new SyncEvent<types.UserSim.Usable>();

export const evtSimReachabilityStatusChange = new SyncEvent<types.UserSim.Usable>();
/** NOTE: This is posted when an user lose access to the sim, the password
 * is then renewed, there is not a special notify event from the server
 * but the sim is re-notified online */
export const evtSimPasswordChanged = new SyncEvent<types.UserSim.Usable>();
export const evtSimGsmConnectivityChange = new SyncEvent<types.UserSim.Usable>();
export const evtOngoingCall = new SyncEvent<types.UserSim.Usable>();
export const evtSimCellSignalStrengthChange = new SyncEvent<types.UserSim.Usable>();
/** posted when a user that share the SIM created or updated a contact. */
export const evtContactCreatedOrUpdated = new SyncEvent<{
    userSim: types.UserSim.Usable;
    contact: types.UserSim.Contact
}>();

export const evtContactDeleted = new SyncEvent<{
    userSim: types.UserSim.Usable;
    contact: types.UserSim.Contact
}>();

export const evtSimPermissionLost = new SyncEvent<types.UserSim.Shared.Confirmed>();

export const evtSharingRequestResponse = new SyncEvent<{
    userSim: types.UserSim.Owned;
    email: string;
    isAccepted: boolean;
}>();

export const evtOtherSimUserUnregisteredSim = new SyncEvent<{
    userSim: types.UserSim.Owned;
    email: string;
}>();

export const evtOpenElsewhere = new VoidSyncEvent();


export namespace rtcIceEServer {

    export const evt = new SyncEvent<{
        rtcIceServer: RTCIceServer;
        socket: sipLibrary.Socket
    }>();

    export const getCurrent = (() => {

        let current: RTCIceServer | undefined = undefined;

        const evtUpdated = new VoidSyncEvent();

        evt.attach(({ rtcIceServer, socket }) => {

            socket.evtClose.attachOnce(() => current = undefined);

            current = rtcIceServer;

            evtUpdated.post();

        });

        return async function callee(): Promise<RTCIceServer> {

            if (current !== undefined) {
                return current;
            }

            await evtUpdated.waitFor();

            return callee();

        };

    })();


}



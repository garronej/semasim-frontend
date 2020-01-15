
import * as types from "../types/userSim";
import { SyncEvent, VoidSyncEvent } from "ts-events-extended";
import * as sipLibrary from "ts-sip";
import * as dcTypes from "chan-dongle-extended-client/dist/lib/types";

export namespace appEvts {

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

    export const evtDongleOnLan = new SyncEvent<{
        type: "LOCKED";
        dongle: dcTypes.Dongle.Locked;
        prSimUnlocked: Promise<void>;
    } | {
        type: "USABLE";
        dongle: dcTypes.Dongle.Usable;
    }>();

    export const evtSimPermissionLost = new SyncEvent<types.UserSim.Shared.Confirmed>();

    export const evtSimSharingRequest = new SyncEvent<
        types.UserSim.Shared.NotConfirmed
    >();

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




    //NOTE: We do not directly use RTCIceServer so we don't have to import lib.dom for integrations test on backend.
    export type DOM_RTCIceServer_subset = {
        credential?: string;
        credentialType?: "password";
        urls: string[];
        username?: string;
    };

    export const evt = new SyncEvent<
        {
            rtcIceServer: DOM_RTCIceServer_subset;
            socket: sipLibrary.Socket
        }
    >();




    export namespace rtcIceServer {

        //NOTE: We do not directly use RTCIceServer so we don't have to import lib.dom for integrations test on backend.
        export type DOM_RTCIceServer_subset = {
            credential?: string;
            credentialType?: "password";
            urls: string[];
            username?: string;
        };

        export const evt = new SyncEvent<{
            rtcIceServer: DOM_RTCIceServer_subset;
            attachOnNoLongerValid: (onNoLongerValid: ()=> void)=> void;
        }>();

        export const getCurrent = (() => {

            let current: DOM_RTCIceServer_subset | undefined = undefined;

            const evtUpdated = new VoidSyncEvent();

            evt.attach(({ rtcIceServer, attachOnNoLongerValid }) => {

                attachOnNoLongerValid(()=> current = undefined);

                current = rtcIceServer;

                evtUpdated.post();

            });

            return async function callee(): Promise<DOM_RTCIceServer_subset> {

                if (current !== undefined) {
                    return current;
                }

                await evtUpdated.waitFor();

                return callee();

            };

        })();


    }

    export const evtWdActionFromOtherUa = new SyncEvent<
        import("../../sip_api_declarations/uaToBackend").wd_notifyActionFromOtherUa.Params
    >();

}

export type AppEvts = typeof appEvts;

export type SubsetOfAppEvts<K extends keyof AppEvts> = Pick<AppEvts, K>;



/*
function postOnceAttached<T>(evt: SyncEvent<T>, data: T): void {

    if( evt.getHandlers().every(({ matcher })=> !matcher(data)) ){

        evt.evtAttach.attachOnce(
            ({matcher}) => matcher(data),
            ()=>evt.post(data)
        );

        return;

    }

    evt.post(data);

}

export type BackendEventsForSim = BackendEventForSim.HelperType<
"evtContactCreatedOrUpdated" |
"evtContactDeleted" |
"evtSimReachabilityStatusChange" |
"evtSimGsmConnectivityChange" |
"evtSimCellSignalStrengthChange" |
"evtOngoingCall"
>;

export namespace BackendEventForSim {

type HelperType1<T> = T extends SyncEvent<infer U> ?
    (
        U extends types.UserSim.Usable ?
        VoidSyncEvent
        :
        (
            U extends { userSim: types.UserSim.Usable } ?
            SyncEvent<Omit<U, "userSim">>
            :
            T
        )
    )
    :
    T
    ;

type HelperType2<T> = { [key in keyof T]: HelperType1<T[key]>; };

type TypeofImport = typeof import("./toBackend/events").fromBackendEvents;

export type HelperType<K extends keyof TypeofImport> = HelperType2<Pick<TypeofImport, K>>;

}
*/






import * as dcTypes from "chan-dongle-extended-client/dist/lib/types";

 type Evt<T> = import("evt").Evt<T>;
 type VoidEvt = import("evt").VoidEvt;

export type RemoteNotifyEvts = {
    evtUserSimChange: Evt<import("../../sip_api_declarations/uaToBackend").notifyUserSimChange.Params>;
    evtDongleOnLan: Evt<{
        type: "LOCKED";
        dongle: dcTypes.Dongle.Locked;
        prSimUnlocked: Promise<void>;
    } | {
        type: "USABLE";
        dongle: dcTypes.Dongle.Usable;
    }>,
    evtOpenElsewhere: VoidEvt;
    getRtcIceServer: () => Promise<DOM_RTCIceServer_subset>;
    evtWdActionFromOtherUa: Evt<import("../../sip_api_declarations/uaToBackend").wd_notifyActionFromOtherUa.Params>;
}


//NOTE: We do not directly use RTCIceServer so we don't have to import lib.dom for integrations test on backend.
export type DOM_RTCIceServer_subset = {
    credential?: string;
    credentialType?: "password";
    urls: string[];
    username?: string;
};






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





"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
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

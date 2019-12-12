
import * as types from "../lib/types/userSim";

export namespace notifySimOffline {

    export const methodName= "notifySimOffline";

    export type Params = { imsi: string; };

    export type Response = undefined ;

}

export namespace notifySimOnline {
    
    export const methodName= "notifySimOnline";

    /** internalStorageChanged is a very rare case, if it ever happen just reload the page */
    export type Params = {
        imsi: string;
        hasInternalSimStorageChanged: boolean;
        password: string;
        simDongle: types.UserSim["dongle"]
        gatewayLocation: types.UserSim.GatewayLocation,
        isGsmConnectivityOk: boolean;
        cellSignalStrength:
        types.ReachableSimState.ConnectedToCellularNetwork["cellSignalStrength"];
    };

    export type Response = undefined;

}

export namespace notifyGsmConnectivityChange {

    export const methodName = "notifyGsmConnectivityChange";

    export type Params = {
        imsi: string;
        isGsmConnectivityOk: boolean;
    };

    export type Response = undefined;

}

export namespace notifyCellSignalStrengthChange {

    export const methodName = "notifyCellSignalStrengthChange";

    export type Params = {
        imsi: string;
        cellSignalStrength:
        types.ReachableSimState.ConnectedToCellularNetwork["cellSignalStrength"];
    };

    export type Response = undefined;

}

export namespace notifyOngoingCall {

    export const methodName = "notifyOngoingCall";

    export type Params = { imsi: string } & ({
        isTerminated: false;
        ongoingCall: types.OngoingCall;
    } | {
        isTerminated: true;
        ongoingCallId: string;
    });

    export type Response = undefined;

}

/** posted when an other UA create or update a contact */
export namespace notifyContactCreatedOrUpdated {

    export const methodName = "notifyContactCreatedOrUpdated";

    export type Params = {
        imsi: string;
        name: string;
        number_raw: string;
        storage?: {
            mem_index: number;
            name_as_stored: string;
            new_digest: string;
        }
    }

    export type Response = undefined;

}

export namespace notifyContactDeleted {

    export const methodName = "notifyContactDeleted";

    export type Params = {
        imsi: string;
        number_raw: string;
        storage?: {
            mem_index: number;
            new_digest: string;
        }
    };

    export type Response = undefined;

}

export namespace notifyDongleOnLan {

    export const methodName = "notifyDongleOnLan";

    export type Params = import("chan-dongle-extended-client").types.Dongle;

    export type Response = undefined;

}

/** 
 * posted when the owner of the sim stop sharing the sim with the user 
 * or when the user unregister the sim from an other ua
 * */
export namespace notifySimPermissionLost {

    export const methodName = "notifySimPermissionLost";

    export type Params = { imsi: string; }

    export type Response = undefined;


}

export namespace notifySimSharingRequest {

    export const methodName = "notifySimSharingRequest";

    export type Params = types.UserSim.Shared.NotConfirmed;

    export type Response = undefined;

}

export namespace notifySharingRequestResponse {

    export const methodName = "notifySharingRequestResponse";

    export type Params = {
        imsi: string;
        email: string;
        isAccepted: boolean;
    };

    export type Response = undefined;

}

export namespace notifyOtherSimUserUnregisteredSim {

    export const methodName = "notifyOtherSimUserUnregisteredSim";

    export type Params = {
        imsi: string;
        email: string;
    };

    export type Response = undefined;

}

export namespace notifyLoggedFromOtherTab {

    export const methodName = "notifyLoggedFromOtherTab"

    export type Params = undefined;

    export type Response = undefined;

}

export namespace notifyIceServer {

    export const methodName = "notifyIceServer";

    /** Undefined when the turn server is not enabled */
    export type Params = {
        urls: string[];
        username: string;
        credential: string;
        credentialType: "password";
    } | undefined;

    export type Response = undefined;

}

export namespace wd_notifyActionFromOtherUa {

    export const methodName = "wd_notifyActionFromOtherUa";

    export type Params = {
        methodName: typeof import("./backendToUa").wd_newChat.methodName;
        params: import("./backendToUa").wd_newChat.Params
    } | {
        methodName: typeof import("./backendToUa").wd_updateChatLastMessageSeen.methodName;
        params: import("./backendToUa").wd_updateChatLastMessageSeen.Params
    } | {
        methodName: typeof import("./backendToUa").wd_updateChatContactInfos.methodName;
        params: import("./backendToUa").wd_updateChatContactInfos.Params
    } | {
        methodName: typeof import("./backendToUa").wd_destroyChat.methodName;
        params: import("./backendToUa").wd_destroyChat.Params
    } | {
        methodName: typeof import("./backendToUa").wd_newMessage.methodName;
        params: import("./backendToUa").wd_newMessage.Params
    } | {
        methodName: typeof import("./backendToUa").wd_notifySendReportReceived.methodName;
        params: import("./backendToUa").wd_notifySendReportReceived.Params
    } | {
        methodName: typeof import("./backendToUa").wd_notifyStatusReportReceived.methodName;
        params: import("./backendToUa").wd_notifyStatusReportReceived.Params
    };

    export type Response = undefined;

}


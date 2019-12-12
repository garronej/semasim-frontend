import * as types from "../lib/types/userSim";
export declare namespace notifySimOffline {
    const methodName = "notifySimOffline";
    type Params = {
        imsi: string;
    };
    type Response = undefined;
}
export declare namespace notifySimOnline {
    const methodName = "notifySimOnline";
    /** internalStorageChanged is a very rare case, if it ever happen just reload the page */
    type Params = {
        imsi: string;
        hasInternalSimStorageChanged: boolean;
        password: string;
        simDongle: types.UserSim["dongle"];
        gatewayLocation: types.UserSim.GatewayLocation;
        isGsmConnectivityOk: boolean;
        cellSignalStrength: types.ReachableSimState.ConnectedToCellularNetwork["cellSignalStrength"];
    };
    type Response = undefined;
}
export declare namespace notifyGsmConnectivityChange {
    const methodName = "notifyGsmConnectivityChange";
    type Params = {
        imsi: string;
        isGsmConnectivityOk: boolean;
    };
    type Response = undefined;
}
export declare namespace notifyCellSignalStrengthChange {
    const methodName = "notifyCellSignalStrengthChange";
    type Params = {
        imsi: string;
        cellSignalStrength: types.ReachableSimState.ConnectedToCellularNetwork["cellSignalStrength"];
    };
    type Response = undefined;
}
export declare namespace notifyOngoingCall {
    const methodName = "notifyOngoingCall";
    type Params = {
        imsi: string;
    } & ({
        isTerminated: false;
        ongoingCall: types.OngoingCall;
    } | {
        isTerminated: true;
        ongoingCallId: string;
    });
    type Response = undefined;
}
/** posted when an other UA create or update a contact */
export declare namespace notifyContactCreatedOrUpdated {
    const methodName = "notifyContactCreatedOrUpdated";
    type Params = {
        imsi: string;
        name: string;
        number_raw: string;
        storage?: {
            mem_index: number;
            name_as_stored: string;
            new_digest: string;
        };
    };
    type Response = undefined;
}
export declare namespace notifyContactDeleted {
    const methodName = "notifyContactDeleted";
    type Params = {
        imsi: string;
        number_raw: string;
        storage?: {
            mem_index: number;
            new_digest: string;
        };
    };
    type Response = undefined;
}
export declare namespace notifyDongleOnLan {
    const methodName = "notifyDongleOnLan";
    type Params = import("chan-dongle-extended-client").types.Dongle;
    type Response = undefined;
}
/**
 * posted when the owner of the sim stop sharing the sim with the user
 * or when the user unregister the sim from an other ua
 * */
export declare namespace notifySimPermissionLost {
    const methodName = "notifySimPermissionLost";
    type Params = {
        imsi: string;
    };
    type Response = undefined;
}
export declare namespace notifySimSharingRequest {
    const methodName = "notifySimSharingRequest";
    type Params = types.UserSim.Shared.NotConfirmed;
    type Response = undefined;
}
export declare namespace notifySharingRequestResponse {
    const methodName = "notifySharingRequestResponse";
    type Params = {
        imsi: string;
        email: string;
        isAccepted: boolean;
    };
    type Response = undefined;
}
export declare namespace notifyOtherSimUserUnregisteredSim {
    const methodName = "notifyOtherSimUserUnregisteredSim";
    type Params = {
        imsi: string;
        email: string;
    };
    type Response = undefined;
}
export declare namespace notifyLoggedFromOtherTab {
    const methodName = "notifyLoggedFromOtherTab";
    type Params = undefined;
    type Response = undefined;
}
export declare namespace notifyIceServer {
    const methodName = "notifyIceServer";
    /** Undefined when the turn server is not enabled */
    type Params = {
        urls: string[];
        username: string;
        credential: string;
        credentialType: "password";
    } | undefined;
    type Response = undefined;
}
export declare namespace wd_notifyActionFromOtherUa {
    const methodName = "wd_notifyActionFromOtherUa";
    type Params = {
        methodName: typeof import("./backendToUa").wd_newChat.methodName;
        params: import("./backendToUa").wd_newChat.Params;
    } | {
        methodName: typeof import("./backendToUa").wd_updateChatLastMessageSeen.methodName;
        params: import("./backendToUa").wd_updateChatLastMessageSeen.Params;
    } | {
        methodName: typeof import("./backendToUa").wd_updateChatContactInfos.methodName;
        params: import("./backendToUa").wd_updateChatContactInfos.Params;
    } | {
        methodName: typeof import("./backendToUa").wd_destroyChat.methodName;
        params: import("./backendToUa").wd_destroyChat.Params;
    } | {
        methodName: typeof import("./backendToUa").wd_newMessage.methodName;
        params: import("./backendToUa").wd_newMessage.Params;
    } | {
        methodName: typeof import("./backendToUa").wd_notifySendReportReceived.methodName;
        params: import("./backendToUa").wd_notifySendReportReceived.Params;
    } | {
        methodName: typeof import("./backendToUa").wd_notifyStatusReportReceived.methodName;
        params: import("./backendToUa").wd_notifyStatusReportReceived.Params;
    };
    type Response = undefined;
}

import * as types from "../lib/types/UserSim";
export declare namespace notifyUserSimChange {
    const methodName = "evtUserSimChange";
    type Params = {
        type: "NEW";
        userSim: types.UserSim.Owned | types.UserSim.Shared.NotConfirmed;
    } | {
        type: "IS NOW CONFIRMED";
        imsi: string;
        friendlyName: string;
    } | {
        type: "DELETE";
        /** Permission loss can also mean that the owner of the sim unregistered the sim*/
        cause: "USER UNREGISTER SIM" | "PERMISSION LOSS" | "REJECT SHARING REQUEST";
        imsi: string;
    } | {
        type: "IS NOW UNREACHABLE";
        imsi: string;
    } | {
        type: "IS NOW REACHABLE";
        /** internalStorageChanged is a very rare case, if it ever happen just reload the page */
        imsi: string;
        hasInternalSimStorageChanged: boolean;
        password: string;
        simDongle: types.UserSim["dongle"];
        gatewayLocation: types.UserSim.GatewayLocation;
        isGsmConnectivityOk: boolean;
        cellSignalStrength: types.UserSim.ReachableSimState["cellSignalStrength"];
    } | {
        type: "CELLULAR CONNECTIVITY CHANGE";
        imsi: string;
        isGsmConnectivityOk: boolean;
    } | {
        type: "CELLULAR SIGNAL STRENGTH CHANGE";
        imsi: string;
        cellSignalStrength: types.UserSim.ReachableSimState["cellSignalStrength"];
    } | ({
        type: "ONGOING CALL";
        imsi: string;
    } & ({
        isTerminated: false;
        ongoingCall: types.UserSim.OngoingCall;
    } | {
        isTerminated: true;
        ongoingCallId: string;
    })) | {
        type: "CONTACT CREATED OR UPDATED";
        imsi: string;
        name: string;
        number_raw: string;
        storage?: {
            mem_index: number;
            name_as_stored: string;
            new_digest: string;
        };
    } | {
        type: "CONTACT DELETED";
        imsi: string;
        number_raw: string;
        storage?: {
            mem_index: number;
            new_digest: string;
        };
    } | {
        type: "SHARED USER SET CHANGE";
        imsi: string;
        action: "ADD" | "REMOVE" | "MOVE TO CONFIRMED";
        targetSet: "CONFIRMED USERS" | "NOT CONFIRMED USERS";
        email: string;
    } | {
        /** Only posted when a usable sim is changed friendly name
         * not when the user accept sharing request */
        type: "FRIENDLY NAME CHANGE";
        imsi: string;
        friendlyName: string;
    };
    type Response = undefined;
}
export declare namespace notifyDongleOnLan {
    const methodName = "notifyDongleOnLan";
    type Params = import("chan-dongle-extended-client").types.Dongle;
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

import * as types from "../lib/types";
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
    };
    type Response = undefined;
}
/** posted when a user that share this SIM create or update a contact */
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
 * or when the user unregister the sim.
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
export declare namespace notifySharedSimUnregistered {
    const methodName = "notifySharedSimUnregistered";
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

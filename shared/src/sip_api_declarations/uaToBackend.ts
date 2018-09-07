
import * as types from "../lib/types";

export namespace notifySimOffline {

    export const methodName= "notifySimOffline";

    export type Params = { imsi: string; };

    export type Response = undefined ;

}

export namespace notifySimOnline {
    
    export const methodName= "notifySimOnline";

    /** internalStorageChanged is a very rare case, if it ever happen just reload the page */
    export type Params= { 
        imsi: string;
        hasInternalSimStorageChanged: boolean; 
        newPassword?: string;
        newSimDongle?: types.UserSim["dongle"]
        newGatewayLocation?: types.UserSim.GatewayLocation 
    };

    export type Response= undefined;

}

/** posted when a user that share this SIM create or update a contact */
export namespace notifyContactCreatedOrUpdated {

    export const methodName= "notifyContactCreatedOrUpdated";

    export type Params = {
        imsi: string;
        name: string;
        number_raw: string;
        number_local_format: string;
        storage?: { 
            mem_index: number; 
            name_as_stored: string; 
            new_digest: string; 
        }
    }

    export type Response= undefined;

}

export namespace notifyContactDeleted {

    export const methodName= "notifyContactDeleted";

    export type Params ={
        imsi: string;
        number_raw: string;
        storage?: {
            mem_index: number;
            new_digest: string;
        }
    };

    export type Response= undefined;

}

export namespace notifyDongleOnLan {

    export const methodName= "notifyDongleOnLan";

    export type Params= import("chan-dongle-extended-client").types.Dongle;

    export type Response= undefined;

}

/** 
 * posted when the owner of the sim stop sharing the sim with the user 
 * or when the user unregister the sim.
 * */
export namespace notifySimPermissionLost {

    export const methodName= "notifySimPermissionLost";

    export type Params= { imsi: string; }

    export type Response= undefined;


}

export namespace notifySimSharingRequest {

    export const methodName= "notifySimSharingRequest";

    export type Params= types.UserSim.Shared.NotConfirmed;

    export type Response= undefined;

}

export namespace notifySharingRequestResponse {

    export const methodName= "notifySharingRequestResponse";

    export type Params= {
        imsi: string;
        email: string;
        isAccepted: boolean;
    };

    export type Response= undefined;

}

export namespace notifySharedSimUnregistered {

    export const methodName= "notifySharedSimUnregistered";

    export type Params= {
        imsi: string;
        email: string;
    };

    export type Response= undefined;

}

export namespace notifyLoggedFromOtherTab {

    export const methodName = "notifyLoggedFromOtherTab"

    export type Params = undefined;

    export type Response = undefined;

}

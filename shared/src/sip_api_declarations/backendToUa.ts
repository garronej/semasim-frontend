
import * as types  from "../lib/types"
import { types as dcTypes } from "chan-dongle-extended-client";
import wd = types.webphoneData;

export namespace getUsableUserSims {

    export const methodName = "getUsableUserSims";

    export type Params = undefined;

    export type Response = types.UserSim.Usable[];

}

export namespace unlockSim {

    export const methodName = "unlockSim";

    export type Params = {
        imei: string;
        pin: string;
    };

    export type Response = dcTypes.UnlockResult | undefined;

}

export namespace registerSim {

    export const methodName = "registerSim";

    export type Params = {
        imsi: string;
        imei: string; //Using both imei and imsi to improve security.
        friendlyName: string;
    };

    export type Response = types.UserSim.Owned;

}

export namespace unregisterSim {

    export const methodName = "unregisterSim";

    export type Params = {
        imsi: string;
    };

    export type Response = undefined;

}

export namespace rebootDongle {

    export const methodName = "rebootDongle";

    export type Params = { imsi: string; };

    export type Response = undefined;

}



export namespace shareSim {

    export const methodName = "shareSim";

    export type Params = {
        imsi: string;
        emails: string[];
        message: string;
    };

    export type Response = undefined;

}

export namespace stopSharingSim {

    export const methodName = "stopSharingSim";

    export type Params = {
        imsi: string;
        emails: string[];
    };

    export type Response = undefined;

}

export namespace changeSimFriendlyName {

    export const methodName = "changeSimFriendlyName";

    export type Params = {
        imsi: string;
        friendlyName: string;
    };

    export type Response = undefined;

}

//NOTE: The DB transaction to use is setSimFriendlyName
export namespace acceptSharingRequest {

    export const methodName = "acceptSharingRequest";

    export type Params = {
        imsi: string;
        friendlyName: string;
    };

    export type Response = { password: string; };

}

//NOTE: The DB transaction to use is unregisterSim
export namespace rejectSharingRequest {

    export const methodName = "rejectSharingRequest";

    export type Params = {
        imsi: string;
    };

    export type Response = undefined;

}

export namespace createContact {

    export const methodName = "createContact";

    /** number expect a formated phone number */
    export type Params = {
        imsi: string;
        name: string;
        number: string;
    };

    //TODO: changed, update on server
    export type Response = {
        mem_index: number;
        name_as_stored_in_sim: string;
        new_digest: string;
    } | undefined;


}

export namespace updateContactName {

    export const methodName = "updateContactName";

    export type Params = contactInSim.Params | contactNotInSim.Params;

    export type Response = contactInSim.Response | contactNotInSim.Response;

    export namespace contactInSim {

        export type Params = {
            imsi: string;
            contactRef: { mem_index: number; };
            newName: string;
        };

        //TODO: updated, change on server
        export type Response = {
            name_as_stored_in_sim: string;
            new_digest: string;
        };

    }

    export namespace contactNotInSim {

        export type Params = {
            imsi: string;
            contactRef: { number: string; };
            newName: string;
        };

        export type Response = undefined;

    }

}

export namespace deleteContact {

    export const methodName = "deleteContact";

    export type Params = {
        imsi: string;
        contactRef: { mem_index: number; } | { number: string; }
    };

    //TODO: Change on server
    export type Response = { new_digest?: string; };

}

export namespace shouldAppendPromotionalMessage {

    export const methodName= "shouldAppendSenTWithSemasim";

    export type Params = undefined;

    export type Response = boolean;

}

//WebphoneData Sync things:

export namespace getUaInstanceIdAndEmail {

    export const methodName = "getUaInstanceIdAndEmail";

    export type Params = undefined;

    export type Response = {
        uaInstanceId: string;
        email: string;
    };

}


export namespace getOrCreateInstance {

    export const methodName = "getInstance";

    export type Params = { imsi: string; };

    export type Response = {
        instance_id: number;
        chats: wd.Chat[];
    };

}

export namespace newChat {

    export const methodName = "newChat";

    export type Params = {
        instance_id: number;
        contactNumber: string;
        contactName: string;
        contactIndexInSim: number | null;
    };

    export type Response = { chat_id: number; };

}

export namespace fetchOlderMessages {

    export const methodName = "fetchOlderMessages";

    export type Params = {
        chat_id: number;
        olderThanMessageId: number;
    };

    /** Message are sorted from the older to the newest */
    export type Response = wd.Message[];

}

export namespace updateChat {

    export const methodName = "updateChat";

    export type Params = {
        chat_id: number;
        contactIndexInSim?: number | null;
        contactName?: string;
        idOfLastMessageSeen?: number | null; /* id_ of last message not send by user */
    };

    export type Response = undefined;

}

export namespace destroyChat {

    export const methodName = "destroyChat";

    export type Params = { chat_id: number; };

    export type Response = undefined;

}

export namespace newMessage {

    export const methodName = "newMessage";

    export type Params = {
        chat_id: number;
        message: wd.NoId<
        wd.Message.Incoming |
        wd.Message.Outgoing.Pending |
        wd.Message.Outgoing.StatusReportReceived
        >;
    };

    export type Response = { message_id: number; };

}

export namespace notifySendReportReceived {

    export const methodName = "notifySendReportReceived";

    export type Params = {
        message_id: number;
        isSentSuccessfully: boolean;
    };

    export type Response = undefined;

}

export namespace notifyStatusReportReceived {

    export const methodName = "notifyStatusReportReceived";

    export type Params = {
        message_id: number;
        deliveredTime: number | null;
    };

    export type Response = undefined;

}

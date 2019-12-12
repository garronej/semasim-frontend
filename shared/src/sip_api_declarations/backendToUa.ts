
import * as types  from "../lib/types/userSim"
import * as wd from "../lib/types/webphoneData/types";
import { types as dcTypes } from "chan-dongle-extended-client";

export namespace getUsableUserSims {

    export const methodName = "getUsableUserSims";

    export type Params = { includeContacts: boolean; };

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


export namespace wd_getUserSimChats {

    export const methodName = "wd_getUserSimChats";

    /** If maxMessageCountByChat is undefined all message history will be pulled */
    export type Params = { imsi: string; maxMessageCountByChat: number; };

    export type Response = wd.Chat<"ENCRYPTED">[];

}

export namespace wd_newChat {

    export const methodName = "wd_newChat";

    export type Params = {
        imsi: string;
        chatRef: string;
        contactNumber: wd.Chat<"ENCRYPTED">["contactNumber"];
        contactName: wd.Chat<"ENCRYPTED">["contactName"];
        contactIndexInSim: wd.Chat<"ENCRYPTED">["contactIndexInSim"];
    };

    export type Response = undefined;

}

export namespace wd_fetchOlderMessages {

    export const methodName = "wd_fetchOlderMessages";

    export type Params = {
        imsi: string;
        chatRef: string;
        olderThanTime: number;
        maxMessageCount: number;
    };

    //Message are sorted from the older to the newest ( but just by message time )
    export type Response = wd.Message<"ENCRYPTED">[];

}

export namespace wd_updateChatLastMessageSeen {

    export const methodName = "wd_updateChatLastMessageSeen";

    export type Params = {
        imsi: string;
        chatRef: string;
        refOfLastMessageSeen: string; 
    };

    export type Response = undefined;

}

export namespace wd_updateChatContactInfos {

    export const methodName = "wd_updateChatContactInfos";

    export type Params = {
        imsi: string;
        chatRef: string;
        contactIndexInSim?: wd.Chat<"ENCRYPTED">["contactIndexInSim"];
        contactName?: wd.Chat<"ENCRYPTED">["contactName"];
    };

    export type Response = undefined;

}

export namespace wd_destroyChat {

    export const methodName = "wd_destroyChat";

    export type Params = { imsi: string; chatRef: string; };

    export type Response = undefined;

}


export namespace wd_newMessage {

    export const methodName = "wd_newMessage";

    export type Params = {
        imsi: string;
        chatRef: string;
        message: 
            wd.Message.Incoming<"ENCRYPTED"> |
            wd.Message.Outgoing.Pending<"ENCRYPTED">
        ;
    };

    export type Response = undefined;

}

export namespace wd_notifySendReportReceived {

    export const methodName = "wd_notifySendReportReceived";

    export type Params = {
        imsi: string;
        chatRef: string;
        messageRef: string;
        isSentSuccessfully: boolean;
    };

    export type Response = undefined;

}

export namespace wd_notifyStatusReportReceived {

    export const methodName = "wd_notifyStatusReportReceived";

    export type Params = {
        imsi: string;
        chatRef: string;
        messageRef: string;
        deliveredTime: number | null;
        sentBy: wd.Message.Outgoing.StatusReportReceived<"ENCRYPTED">["sentBy"];
    };

    export type Response = undefined;

}
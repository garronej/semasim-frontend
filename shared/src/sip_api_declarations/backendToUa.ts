
import { types as dcTypes } from "chan-dongle-extended-client";
import * as types from "../lib/types";


export namespace getUserSims {

    export const methodName = "getUserSims";

    export type Params = { includeContacts: boolean; };

    export type Response = types.UserSim[];

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

    export type Response = undefined;

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

    export type Response = undefined;

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

    //NOTE: Here the phone number are not checked
    export type Params = {
        imsi: string;
        name: string;
        number_raw: string;
    };

    export type Response = undefined;


}

export namespace updateContactName {

    export const methodName = "updateContactName";

    export type Params = contactInSim.Params | contactNotInSim.Params;

    export type Response = undefined;

    export namespace contactInSim {

        export type Params = {
            imsi: string;
            contactRef: { mem_index: number; };
            newName: string;
        };


    }

    export namespace contactNotInSim {

        export type Params = {
            imsi: string;
            contactRef: { number: string; };
            newName: string;
        };


    }

}

export namespace deleteContact {

    export const methodName = "deleteContact";

    export type Params = {
        imsi: string;
        contactRef: { mem_index: number; } | { number: string; }
    };

    export type Response = undefined;

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

    export type Response = types.wd.Chat<"ENCRYPTED">[];

}

export namespace wd_newChat {

    export const methodName = "wd_newChat";

    export type Params = {
        imsi: string;
        chatRef: string;
        contactNumber: types.wd.Chat<"ENCRYPTED">["contactNumber"];
        contactName: types.wd.Chat<"ENCRYPTED">["contactName"];
        contactIndexInSim: types.wd.Chat<"ENCRYPTED">["contactIndexInSim"];
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
    export type Response = types.wd.Message<"ENCRYPTED">[];

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
        contactIndexInSim?: types.wd.Chat<"ENCRYPTED">["contactIndexInSim"];
        contactName?: types.wd.Chat<"ENCRYPTED">["contactName"];
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
            types.wd.Message.Incoming<"ENCRYPTED"> |
            types.wd.Message.Outgoing.Pending<"ENCRYPTED">
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
        sentBy: types.wd.Message.Outgoing.StatusReportReceived<"ENCRYPTED">["sentBy"];
    };

    export type Response = undefined;

}
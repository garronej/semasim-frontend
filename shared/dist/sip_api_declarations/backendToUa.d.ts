import { types as dcTypes } from "chan-dongle-extended-client";
import * as types from "../lib/types";
export declare namespace getUserSims {
    const methodName = "getUserSims";
    type Params = {
        includeContacts: boolean;
    };
    type Response = types.UserSim[];
}
export declare namespace unlockSim {
    const methodName = "unlockSim";
    type Params = {
        imei: string;
        pin: string;
    };
    type Response = dcTypes.UnlockResult | undefined;
}
export declare namespace registerSim {
    const methodName = "registerSim";
    type Params = {
        imsi: string;
        imei: string;
        friendlyName: string;
    };
    type Response = undefined;
}
export declare namespace unregisterSim {
    const methodName = "unregisterSim";
    type Params = {
        imsi: string;
    };
    type Response = undefined;
}
export declare namespace rebootDongle {
    const methodName = "rebootDongle";
    type Params = {
        imsi: string;
    };
    type Response = undefined;
}
export declare namespace shareSim {
    const methodName = "shareSim";
    type Params = {
        imsi: string;
        emails: string[];
        message: string;
    };
    type Response = undefined;
}
export declare namespace stopSharingSim {
    const methodName = "stopSharingSim";
    type Params = {
        imsi: string;
        emails: string[];
    };
    type Response = undefined;
}
export declare namespace changeSimFriendlyName {
    const methodName = "changeSimFriendlyName";
    type Params = {
        imsi: string;
        friendlyName: string;
    };
    type Response = undefined;
}
export declare namespace acceptSharingRequest {
    const methodName = "acceptSharingRequest";
    type Params = {
        imsi: string;
        friendlyName: string;
    };
    type Response = undefined;
}
export declare namespace rejectSharingRequest {
    const methodName = "rejectSharingRequest";
    type Params = {
        imsi: string;
    };
    type Response = undefined;
}
export declare namespace createContact {
    const methodName = "createContact";
    type Params = {
        imsi: string;
        name: string;
        number_raw: string;
    };
    type Response = undefined;
}
export declare namespace updateContactName {
    const methodName = "updateContactName";
    type Params = contactInSim.Params | contactNotInSim.Params;
    type Response = undefined;
    namespace contactInSim {
        type Params = {
            imsi: string;
            contactRef: {
                mem_index: number;
            };
            newName: string;
        };
    }
    namespace contactNotInSim {
        type Params = {
            imsi: string;
            contactRef: {
                number: string;
            };
            newName: string;
        };
    }
}
export declare namespace deleteContact {
    const methodName = "deleteContact";
    type Params = {
        imsi: string;
        contactRef: {
            mem_index: number;
        } | {
            number: string;
        };
    };
    type Response = undefined;
}
export declare namespace shouldAppendPromotionalMessage {
    const methodName = "shouldAppendSenTWithSemasim";
    type Params = undefined;
    type Response = boolean;
}
export declare namespace wd_getUserSimChats {
    const methodName = "wd_getUserSimChats";
    /** If maxMessageCountByChat is undefined all message history will be pulled */
    type Params = {
        imsi: string;
        maxMessageCountByChat: number;
    };
    type Response = types.wd.Chat<"ENCRYPTED">[];
}
export declare namespace wd_newChat {
    const methodName = "wd_newChat";
    type Params = {
        imsi: string;
        chatRef: string;
        contactNumber: types.wd.Chat<"ENCRYPTED">["contactNumber"];
        contactName: types.wd.Chat<"ENCRYPTED">["contactName"];
        contactIndexInSim: types.wd.Chat<"ENCRYPTED">["contactIndexInSim"];
    };
    type Response = undefined;
}
export declare namespace wd_fetchOlderMessages {
    const methodName = "wd_fetchOlderMessages";
    type Params = {
        imsi: string;
        chatRef: string;
        olderThanTime: number;
        maxMessageCount: number;
    };
    type Response = types.wd.Message<"ENCRYPTED">[];
}
export declare namespace wd_updateChatLastMessageSeen {
    const methodName = "wd_updateChatLastMessageSeen";
    type Params = {
        imsi: string;
        chatRef: string;
        refOfLastMessageSeen: string;
    };
    type Response = undefined;
}
export declare namespace wd_updateChatContactInfos {
    const methodName = "wd_updateChatContactInfos";
    type Params = {
        imsi: string;
        chatRef: string;
        contactIndexInSim?: types.wd.Chat<"ENCRYPTED">["contactIndexInSim"];
        contactName?: types.wd.Chat<"ENCRYPTED">["contactName"];
    };
    type Response = undefined;
}
export declare namespace wd_destroyChat {
    const methodName = "wd_destroyChat";
    type Params = {
        imsi: string;
        chatRef: string;
    };
    type Response = undefined;
}
export declare namespace wd_newMessage {
    const methodName = "wd_newMessage";
    type Params = {
        imsi: string;
        chatRef: string;
        message: types.wd.Message.Incoming<"ENCRYPTED"> | types.wd.Message.Outgoing.Pending<"ENCRYPTED">;
    };
    type Response = undefined;
}
export declare namespace wd_notifySendReportReceived {
    const methodName = "wd_notifySendReportReceived";
    type Params = {
        imsi: string;
        chatRef: string;
        messageRef: string;
        isSentSuccessfully: boolean;
    };
    type Response = undefined;
}
export declare namespace wd_notifyStatusReportReceived {
    const methodName = "wd_notifyStatusReportReceived";
    type Params = {
        imsi: string;
        chatRef: string;
        messageRef: string;
        deliveredTime: number | null;
        sentBy: types.wd.Message.Outgoing.StatusReportReceived<"ENCRYPTED">["sentBy"];
    };
    type Response = undefined;
}

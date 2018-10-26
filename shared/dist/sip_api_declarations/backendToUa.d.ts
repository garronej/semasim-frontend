import * as types from "../lib/types";
import { types as dcTypes } from "chan-dongle-extended-client";
import wd = types.webphoneData;
export declare namespace getUsableUserSims {
    const methodName = "getUsableUserSims";
    type Params = undefined;
    type Response = types.UserSim.Usable[];
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
    type Response = types.UserSim.Owned;
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
    type Response = {
        password: string;
    };
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
    /** number expect a formated phone number */
    type Params = {
        imsi: string;
        name: string;
        number: string;
    };
    type Response = {
        mem_index: number;
        name_as_stored_in_sim: string;
        new_digest: string;
    } | undefined;
}
export declare namespace updateContactName {
    const methodName = "updateContactName";
    type Params = contactInSim.Params | contactNotInSim.Params;
    type Response = contactInSim.Response | contactNotInSim.Response;
    namespace contactInSim {
        type Params = {
            imsi: string;
            contactRef: {
                mem_index: number;
            };
            newName: string;
        };
        type Response = {
            name_as_stored_in_sim: string;
            new_digest: string;
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
        type Response = undefined;
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
    type Response = {
        new_digest?: string;
    };
}
export declare namespace getUaInstanceIdAndEmail {
    const methodName = "getUaInstanceIdAndEmail";
    type Params = undefined;
    type Response = {
        uaInstanceId: string;
        email: string;
    };
}
export declare namespace getOrCreateInstance {
    const methodName = "getInstance";
    type Params = {
        imsi: string;
    };
    type Response = {
        instance_id: number;
        chats: wd.Chat[];
    };
}
export declare namespace newChat {
    const methodName = "newChat";
    type Params = {
        instance_id: number;
        contactNumber: string;
        contactName: string;
        contactIndexInSim: number | null;
    };
    type Response = {
        chat_id: number;
    };
}
export declare namespace fetchOlderMessages {
    const methodName = "fetchOlderMessages";
    type Params = {
        chat_id: number;
        olderThanMessageId: number;
    };
    /** Message are sorted from the older to the newest */
    type Response = wd.Message[];
}
export declare namespace updateChat {
    const methodName = "updateChat";
    type Params = {
        chat_id: number;
        contactIndexInSim?: number | null;
        contactName?: string;
        idOfLastMessageSeen?: number | null;
    };
    type Response = undefined;
}
export declare namespace destroyChat {
    const methodName = "destroyChat";
    type Params = {
        chat_id: number;
    };
    type Response = undefined;
}
export declare namespace newMessage {
    const methodName = "newMessage";
    type Params = {
        chat_id: number;
        message: wd.NoId<wd.Message.Incoming | wd.Message.Outgoing.Pending | wd.Message.Outgoing.StatusReportReceived>;
    };
    type Response = {
        message_id: number;
    };
}
export declare namespace notifySendReportReceived {
    const methodName = "notifySendReportReceived";
    type Params = {
        message_id: number;
        isSentSuccessfully: boolean;
    };
    type Response = undefined;
}
export declare namespace notifyStatusReportReceived {
    const methodName = "notifyStatusReportReceived";
    type Params = {
        message_id: number;
        deliveredTime: number | null;
    };
    type Response = undefined;
}

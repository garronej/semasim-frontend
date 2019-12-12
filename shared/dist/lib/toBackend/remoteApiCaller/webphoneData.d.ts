import { types as gwTypes } from "../../../gateway/types";
import * as wd from "../../types/webphoneData/logic";
import * as cryptoLib from "../../crypto/cryptoLibProxy";
import { SyncEvent } from "ts-events-extended";
export declare type WdEvts = {
    evtNewUpdatedOrDeletedWdChat: SyncEvent<{
        wdChat: wd.Chat<"PLAIN">;
        eventType: "NEW" | "UPDATED" | "DELETED";
    }>;
    evtNewOrUpdatedWdMessage: SyncEvent<{
        wdChat: wd.Chat<"PLAIN">;
        wdMessage: wd.Message<"PLAIN">;
    }>;
};
declare type RequestProcessedByBackend = SyncEvent.Type<import("../appEvts").AppEvts["evtWdActionFromOtherUa"]>;
export declare type AppEvts = {
    evtWdActionFromOtherUa: SyncEvent<RequestProcessedByBackend & {
        handlerCb?: (error?: Error) => void;
    }>;
};
/** Inject send request only when testing */
export declare function getApiCallerForSpecificSimFactory(sendRequest: typeof import("./sendRequest").sendRequest, appEvts: AppEvts, encryptorDecryptor: cryptoLib.EncryptorDecryptor, userEmail: string): (imsi: string) => {
    "getUserSimChats": (maxMessageCountByChat: number) => Promise<{
        wdChats: wd.Chat<"PLAIN">[];
        wdEvts: WdEvts;
    }>;
    /** If there is already a chat with the contact number nothing will be done */
    "newChat": (wdChats: wd.Chat<"PLAIN">[], contactNumber: string, contactName: string, contactIndexInSim: number | null) => Promise<void>;
    "fetchOlderMessages": (wdChat: wd.Chat<"PLAIN">, maxMessageCount: number) => Promise<wd.Message<"PLAIN">[]>;
    /**
     *
     * Assert wdChat.message sorted by ordering time.
     *
     * If same as before the request won't be sent .
     *
     * Will update the data if the request was sent, meaning there is at least an incoming (or assimilated)
     * message in the chat and the last message to be seen is not already the last message seen.
     *
     * Will not update if wdChat.refOfLastMessageSeen have not been changed, this happens when:
     *  -There is no incoming (or assimilated) message in the chat. ( request not sent )
     *  -The more recent incoming (or assimilated) message in the chat is already
     * the one pointed by wdChat.refOfLastMessageSeen. ( request not sent )
     *
     * */
    "updateChatLastMessageSeen": (wdChat: wd.Chat<"PLAIN">) => Promise<void>;
    /**
     *
     * If same as before the request won't be sent
     *
     * return true if request was sent
     *
     * */
    "updateChatContactInfos": (wdChat: wd.Chat<"PLAIN">, contactName: string, contactIndexInSim: number | null) => Promise<void>;
    "destroyWdChat": (wdChats: wd.Chat<"PLAIN">[], refOfTheChatToDelete: string) => Promise<void>;
    /**
     * gwTypes.BundledData.ClientToServer.Message is assignable
     * to arg0.bundledData * ( client to server )
     * */
    "newMessage": {
        (wdChat: wd.Chat<"PLAIN">, arg1: {
            type: "SERVER TO CLIENT";
            bundledData: gwTypes.BundledData.ServerToClient.Message | gwTypes.BundledData.ServerToClient.MmsNotification | gwTypes.BundledData.ServerToClient.MissedCall | gwTypes.BundledData.ServerToClient.FromSipCallSummary | gwTypes.BundledData.ServerToClient.CallAnsweredBy;
        }): Promise<void>;
        (wdChat: wd.Chat<"PLAIN">, arg1: {
            type: "CLIENT TO SERVER";
            bundledData: {
                exactSendDateTime: number;
                text: string;
            };
        }): Promise<{
            onUaFailedToSendMessage: () => Promise<void>;
        }>;
    };
    /**gwTypes.BundledData.ServerToClient.SendReport is assignable to bundledData*/
    "notifySendReportReceived": (wdChat: wd.Chat<"PLAIN">, bundledData: {
        messageTowardGsm: {
            dateTime: number;
            text: string;
        };
        sendDateTime: number | null;
    }) => Promise<void>;
    "notifyStatusReportReceived": (wdChat: wd.Chat<"PLAIN">, bundledData: gwTypes.BundledData.ServerToClient.StatusReport) => Promise<void>;
    /** Hack so we don't have to handle special case when UA can't send message */
    "notifyUaFailedToSendMessage": (wdChat: wd.Chat<"PLAIN">, wdMessage: wd.Message.Outgoing.Pending<"PLAIN">) => Promise<void>;
};
export {};

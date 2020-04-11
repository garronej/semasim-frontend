import { types as gwTypes } from "../../../gateway/types";
import * as cryptoLib from "../../crypto/cryptoLibProxy";
import { Evt, UnpackEvt } from "evt";
import * as types from "../../types";
declare type RequestProcessedByBackend = UnpackEvt<types.RemoteNotifyEvts["evtWdActionFromOtherUa"]>;
export declare type RemoteNotifyEvts = {
    evtWdActionFromOtherUa: Evt<RequestProcessedByBackend & {
        handlerCb?: (error?: Error) => void;
    }>;
};
/** Inject send request only when testing */
export declare function getWdApiFactory(params: {
    sendRequest: ReturnType<typeof import("./getSendRequest").getSendRequest>;
    remoteNotifyEvts: RemoteNotifyEvts;
    encryptorDecryptor: cryptoLib.EncryptorDecryptor;
    userEmail: string;
}): ({ imsi }: {
    imsi: string;
}) => {
    getUserSimChats: ({ maxMessageCountByChat }: {
        maxMessageCountByChat: number;
    }) => Promise<{
        wdChats: types.wd.Chat<"PLAIN">[];
        wdEvts: {
            evtWdChat: import("evt").NonPostableEvt<({
                wdChat: types.wd.Chat<"PLAIN">;
            } & {
                eventType: "NEW" | "DELETED";
            }) | ({
                wdChat: types.wd.Chat<"PLAIN">;
            } & {
                eventType: "UPDATED";
                changes: {
                    unreadMessageCount: boolean;
                    contactInfos: boolean;
                    ordering: boolean;
                };
            })>;
            evtWdMessage: import("evt").NonPostableEvt<({
                wdChat: types.wd.Chat<"PLAIN">;
                wdMessage: types.wd.Message<"PLAIN">;
            } & {
                eventType: "NEW" | "DELETED";
            }) | ({
                wdChat: types.wd.Chat<"PLAIN">;
                wdMessage: types.wd.Message<"PLAIN">;
            } & {
                eventType: "UPDATED";
                orderingChange: boolean;
            })>;
        };
    }>;
    /** If there is already a chat with the contact number nothing will be done */
    newChat: ({ wdChats, contactNumber, contactName, contactIndexInSim }: {
        wdChats: types.wd.Chat<"PLAIN">[];
        contactNumber: string;
        contactName: string;
        contactIndexInSim: number | null;
    }) => Promise<void>;
    fetchOlderMessages: ({ wdChat, maxMessageCount }: {
        wdChat: types.wd.Chat<"PLAIN">;
        maxMessageCount: number;
    }) => Promise<types.wd.Message<"PLAIN">[]>;
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
    updateChatLastMessageSeen: (wdChat: types.wd.Chat<"PLAIN">) => Promise<void>;
    /**
     *
     * If same as before the request won't be sent
     *
     * */
    updateChatContactInfos: ({ wdChat, contactName, contactIndexInSim }: {
        wdChat: types.wd.Chat<"PLAIN">;
        contactName: string;
        contactIndexInSim: number | null;
    }) => Promise<void>;
    destroyWdChat: ({ wdChats, refOfTheChatToDelete }: {
        wdChats: types.wd.Chat<"PLAIN">[];
        refOfTheChatToDelete: string;
    }) => Promise<void>;
    /**
     * gwTypes.BundledData.ClientToServer.Message is assignable
     * to arg0.bundledData * ( client to server )
     * */
    newMessage: {
        (args: {
            wdChat: types.wd.Chat<"PLAIN">;
        } & {
            type: "SERVER TO CLIENT";
            bundledData: gwTypes.BundledData.ServerToClient.Message | gwTypes.BundledData.ServerToClient.MmsNotification | gwTypes.BundledData.ServerToClient.MissedCall | gwTypes.BundledData.ServerToClient.FromSipCallSummary | gwTypes.BundledData.ServerToClient.CallAnsweredBy;
        }): Promise<void>;
        (args: {
            wdChat: types.wd.Chat<"PLAIN">;
        } & {
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
    notifySendReportReceived: ({ wdChat, bundledData }: {
        wdChat: types.wd.Chat<"PLAIN">;
        bundledData: {
            messageTowardGsm: {
                dateTime: number;
                text: string;
            };
            sendDateTime: number | null;
        };
    }) => Promise<void>;
    notifyStatusReportReceived: ({ wdChat, bundledData }: {
        wdChat: types.wd.Chat<"PLAIN">;
        bundledData: gwTypes.BundledData.ServerToClient.StatusReport;
    }) => Promise<void>;
    /** Hack so we don't have to handle special case when UA can't send message */
    notifyUaFailedToSendMessage: (wdChat: types.wd.Chat<"PLAIN">, wdMessage: types.wd.Message.Outgoing.Pending<"PLAIN">) => Promise<void>;
};
export declare type WdApi = ReturnType<ReturnType<typeof getWdApiFactory>>;
export {};

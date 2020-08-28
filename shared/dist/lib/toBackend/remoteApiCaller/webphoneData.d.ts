import { types as gwTypes } from "../../../gateway/types";
import { phoneNumber } from "phone-number/dist/lib";
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
        wdChats: types.wd.Chat[];
        wdEvts: types.wd.Evts;
    }>;
    /** If there is already a chat with the contact number nothing will be done */
    newChat: ({ wdChats, contactNumber, contactName, contactIndexInSim }: {
        wdChats: types.wd.Chat[];
        contactNumber: phoneNumber;
        contactName: string;
        contactIndexInSim: number | null;
    }) => Promise<void>;
    fetchOlderMessages: ({ wdChat, maxMessageCount }: {
        wdChat: types.wd.Chat;
        maxMessageCount: number;
    }) => Promise<types.wd.Message[]>;
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
    updateChatLastMessageSeen: (wdChat: types.wd.Chat) => Promise<void>;
    /**
     *
     * If same as before the request won't be sent
     *
     * */
    updateChatContactInfos: ({ wdChat, contactName, contactIndexInSim }: {
        wdChat: types.wd.Chat;
        contactName: string;
        contactIndexInSim: number | null;
    }) => Promise<void>;
    destroyWdChat: ({ wdChats, refOfTheChatToDelete }: {
        wdChats: types.wd.Chat[];
        refOfTheChatToDelete: string;
    }) => Promise<void>;
    /**
     * gwTypes.BundledData.ClientToServer.Message is assignable
     * to arg0.bundledData * ( client to server )
     * */
    newMessage: {
        (args: {
            wdChat: types.wd.Chat;
        } & {
            type: "SERVER TO CLIENT";
            bundledData: gwTypes.BundledData.ServerToClient.Message | gwTypes.BundledData.ServerToClient.MmsNotification | gwTypes.BundledData.ServerToClient.CallAnsweredBy | gwTypes.BundledData.ServerToClient.FromSipCallSummary | gwTypes.BundledData.ServerToClient.MissedCall;
        }): Promise<void>;
        (args: {
            wdChat: types.wd.Chat;
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
        wdChat: types.wd.Chat;
        bundledData: {
            messageTowardGsm: {
                dateTime: number;
                text: string;
            };
            sendDateTime: number | null;
        };
    }) => Promise<void>;
    notifyStatusReportReceived: ({ wdChat, bundledData }: {
        wdChat: types.wd.Chat;
        bundledData: gwTypes.BundledData.ServerToClient.StatusReport;
    }) => Promise<void>;
    /** Hack so we don't have to handle special case when UA can't send message */
    notifyUaFailedToSendMessage: (wdChat: types.wd.Chat, wdMessage: types.wd.Message.Outgoing.Pending) => Promise<void>;
};
export declare type WdApi = ReturnType<ReturnType<typeof getWdApiFactory>>;
export {};

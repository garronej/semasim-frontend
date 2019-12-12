import * as core from "./core";
import * as webphoneData from "./webphoneData";
declare const getWdApiCallerForSpecificSimFactory: (encryptorDecryptor: import("crypto-lib/dist/sync/types").EncryptorDecryptor, userEmail: string) => (imsi: string) => {
    "getUserSimChats": (maxMessageCountByChat: number) => Promise<{
        wdChats: import("../../types/webphoneData/types").Chat<"PLAIN">[];
        wdEvts: webphoneData.WdEvts;
    }>;
    "newChat": (wdChats: import("../../types/webphoneData/types").Chat<"PLAIN">[], contactNumber: string, contactName: string, contactIndexInSim: number | null) => Promise<void>;
    "fetchOlderMessages": (wdChat: import("../../types/webphoneData/types").Chat<"PLAIN">, maxMessageCount: number) => Promise<import("../../types/webphoneData/types").Message<"PLAIN">[]>;
    "updateChatLastMessageSeen": (wdChat: import("../../types/webphoneData/types").Chat<"PLAIN">) => Promise<void>;
    "updateChatContactInfos": (wdChat: import("../../types/webphoneData/types").Chat<"PLAIN">, contactName: string, contactIndexInSim: number | null) => Promise<void>;
    "destroyWdChat": (wdChats: import("../../types/webphoneData/types").Chat<"PLAIN">[], refOfTheChatToDelete: string) => Promise<void>;
    "newMessage": {
        (wdChat: import("../../types/webphoneData/types").Chat<"PLAIN">, arg1: {
            type: "SERVER TO CLIENT";
            bundledData: import("semasim-gateway/dist/lib/types").BundledData.ServerToClient.Message | import("semasim-gateway/dist/lib/types").BundledData.ServerToClient.MmsNotification | import("semasim-gateway/dist/lib/types").BundledData.ServerToClient.MissedCall | import("semasim-gateway/dist/lib/types").BundledData.ServerToClient.FromSipCallSummary | import("semasim-gateway/dist/lib/types").BundledData.ServerToClient.CallAnsweredBy;
        }): Promise<void>;
        (wdChat: import("../../types/webphoneData/types").Chat<"PLAIN">, arg1: {
            type: "CLIENT TO SERVER";
            bundledData: {
                exactSendDateTime: number;
                text: string;
            };
        }): Promise<{
            onUaFailedToSendMessage: () => Promise<void>;
        }>;
    };
    "notifySendReportReceived": (wdChat: import("../../types/webphoneData/types").Chat<"PLAIN">, bundledData: {
        messageTowardGsm: {
            dateTime: number;
            text: string;
        };
        sendDateTime: number | null;
    }) => Promise<void>;
    "notifyStatusReportReceived": (wdChat: import("../../types/webphoneData/types").Chat<"PLAIN">, bundledData: import("semasim-gateway/dist/lib/types").BundledData.ServerToClient.StatusReport) => Promise<void>;
    "notifyUaFailedToSendMessage": (wdChat: import("../../types/webphoneData/types").Chat<"PLAIN">, wdMessage: import("../../types/webphoneData/types").Message.Outgoing.Pending<"PLAIN">) => Promise<void>;
};
export { core, getWdApiCallerForSpecificSimFactory };
export declare type RemoteCoreApiCaller = typeof core;
export declare type SubsetOfRemoteCoreApiCaller<K extends keyof RemoteCoreApiCaller> = Pick<RemoteCoreApiCaller, K>;

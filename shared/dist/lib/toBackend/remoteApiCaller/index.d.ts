import * as core from "./core";
import * as webphoneData from "./webphoneData";
export { CoreApi } from "./core";
export { WdApi } from "./webphoneData";
declare type ConnectionApi = Pick<import("../connection").ConnectionApi, "getSocket"> & {
    remoteNotifyEvts: webphoneData.RemoteNotifyEvts & core.RemoteNotifyEvts;
};
export declare function factory(params: {
    connectionApi: ConnectionApi;
    restartApp: import("../../restartApp").RestartApp;
}): {
    getWdApiFactory: ({ encryptorDecryptor, userEmail }: {
        encryptorDecryptor: import("../../crypto/cryptoLibProxy").EncryptorDecryptor;
        userEmail: string;
    }) => ({ imsi }: {
        imsi: string;
    }) => {
        getUserSimChats: ({ maxMessageCountByChat }: {
            maxMessageCountByChat: number;
        }) => Promise<{
            wdChats: import("../../types/webphoneData").Chat<"PLAIN">[];
            wdEvts: import("../../types/webphoneData").Evts;
        }>;
        newChat: ({ wdChats, contactNumber, contactName, contactIndexInSim }: {
            wdChats: import("../../types/webphoneData").Chat<"PLAIN">[];
            contactNumber: string;
            contactName: string;
            contactIndexInSim: number | null;
        }) => Promise<void>;
        fetchOlderMessages: ({ wdChat, maxMessageCount }: {
            wdChat: import("../../types/webphoneData").Chat<"PLAIN">;
            maxMessageCount: number;
        }) => Promise<import("../../types/webphoneData").Message<"PLAIN">[]>;
        updateChatLastMessageSeen: (wdChat: import("../../types/webphoneData").Chat<"PLAIN">) => Promise<void>;
        updateChatContactInfos: ({ wdChat, contactName, contactIndexInSim }: {
            wdChat: import("../../types/webphoneData").Chat<"PLAIN">;
            contactName: string;
            contactIndexInSim: number | null;
        }) => Promise<void>;
        destroyWdChat: ({ wdChats, refOfTheChatToDelete }: {
            wdChats: import("../../types/webphoneData").Chat<"PLAIN">[];
            refOfTheChatToDelete: string;
        }) => Promise<void>;
        newMessage: {
            (args: {
                wdChat: import("../../types/webphoneData").Chat<"PLAIN">;
            } & {
                type: "SERVER TO CLIENT";
                bundledData: import("semasim-gateway/dist/lib/types").BundledData.ServerToClient.Message | import("semasim-gateway/dist/lib/types").BundledData.ServerToClient.MmsNotification | import("semasim-gateway/dist/lib/types").BundledData.ServerToClient.CallAnsweredBy | import("semasim-gateway/dist/lib/types").BundledData.ServerToClient.FromSipCallSummary | import("semasim-gateway/dist/lib/types").BundledData.ServerToClient.MissedCall;
            }): Promise<void>;
            (args: {
                wdChat: import("../../types/webphoneData").Chat<"PLAIN">;
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
        notifySendReportReceived: ({ wdChat, bundledData }: {
            wdChat: import("../../types/webphoneData").Chat<"PLAIN">;
            bundledData: {
                messageTowardGsm: {
                    dateTime: number;
                    text: string;
                };
                sendDateTime: number | null;
            };
        }) => Promise<void>;
        notifyStatusReportReceived: ({ wdChat, bundledData }: {
            wdChat: import("../../types/webphoneData").Chat<"PLAIN">;
            bundledData: import("semasim-gateway/dist/lib/types").BundledData.ServerToClient.StatusReport;
        }) => Promise<void>;
        notifyUaFailedToSendMessage: (wdChat: import("../../types/webphoneData").Chat<"PLAIN">, wdMessage: import("../../types/webphoneData").Message.Outgoing.Pending<"PLAIN">) => Promise<void>;
    };
    getCoreApi: ({ userEmail }: {
        userEmail: string;
    }) => {
        getUserSims: ({ includeContacts }: {
            includeContacts: boolean;
        }) => Promise<{
            userSims: import("../../types").UserSim[];
            userSimEvts: import("../../types").UserSim.Evts;
        }>;
        unlockSim: ({ lockedDongle, pin }: {
            lockedDongle: import("chan-dongle-extended-client/dist/lib/types").Dongle.Locked;
            pin: string;
        }) => Promise<import("../../../sip_api_declarations/backendToUa").unlockSim.Response>;
        registerSim: ({ dongle, friendlyName }: {
            dongle: import("chan-dongle-extended-client/dist/lib/types").Dongle.Usable;
            friendlyName: string;
        }) => Promise<void>;
        unregisterSim: (userSim: import("../../types").UserSim.Usable) => Promise<void>;
        rebootDongle: (userSim: import("../../types").UserSim.Usable) => Promise<void>;
        shareSim: ({ userSim, emails, message }: {
            userSim: import("../../types").UserSim.Owned;
            emails: string[];
            message: string;
        }) => Promise<void>;
        stopSharingSim: ({ userSim, emails }: {
            userSim: import("../../types").UserSim.Owned;
            emails: string[];
        }) => Promise<void>;
        changeSimFriendlyName: ({ userSim, friendlyName }: {
            userSim: import("../../types").UserSim.Usable;
            friendlyName: string;
        }) => Promise<void>;
        acceptSharingRequest: ({ notConfirmedUserSim, friendlyName }: {
            notConfirmedUserSim: import("../../types").UserSim.Shared.NotConfirmed;
            friendlyName: string;
        }) => Promise<void>;
        rejectSharingRequest: (userSim: import("../../types").UserSim.Shared.NotConfirmed) => Promise<void>;
        createContact: ({ userSim, name, number_raw }: {
            userSim: import("../../types").UserSim.Usable;
            name: string;
            number_raw: string;
        }) => Promise<import("../../types").UserSim.Contact>;
        updateContactName: ({ userSim, contact, newName }: {
            userSim: import("../../types").UserSim.Usable;
            contact: import("../../types").UserSim.Contact;
            newName: string;
        }) => Promise<void>;
        deleteContact: ({ userSim, contact }: {
            userSim: import("../../types").UserSim.Usable;
            contact: import("../../types").UserSim.Contact;
        }) => Promise<void>;
        shouldAppendPromotionalMessage: () => boolean | Promise<boolean>;
    };
};

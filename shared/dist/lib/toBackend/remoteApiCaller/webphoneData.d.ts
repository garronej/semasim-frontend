import { types as gwTypes } from "../../../gateway/types";
import * as types from "../../types/userSim";
import * as wd from "../../types/webphoneData/logic";
import * as cryptoLib from "crypto-lib";
/** Must be called prior any wd related API call */
export declare function setWebDataEncryptorDescriptor(encryptorDecryptor: cryptoLib.EncryptorDecryptor): void;
export declare namespace setWebDataEncryptorDescriptor {
    const buildWdCrypto: (encryptorDecryptor: cryptoLib.EncryptorDecryptor) => {
        encryptorDecryptor: cryptoLib.EncryptorDecryptor;
        "stringifyThenEncrypt": <V>(value: V) => Promise<string>;
        "decryptThenParse": <V>(encryptedValue: string) => Promise<V>;
    };
}
export declare const getOrCreateWdInstance: (userSim: types.UserSim._Base<types.SimOwnership.Owned | types.SimOwnership.Shared.Confirmed>) => Promise<wd.Instance<"PLAIN">>;
export declare const newWdChat: (wdInstance: wd.Instance<"PLAIN">, contactNumber: string, contactName: string, contactIndexInSim: number | null) => Promise<wd.Chat<"PLAIN">>;
export declare const fetchOlderWdMessages: (wdChat: wd.Chat<"PLAIN">) => Promise<wd.Message<"PLAIN">[]>;
/**
 *
 * If same as before the request won't be sent
 *
 * return true if update was performed
 *
 * */
export declare function updateWdChatIdOfLastMessageSeen(wdChat: wd.Chat<"PLAIN">): Promise<boolean>;
/**
 *
 * If same as before the request won't be sent
 *
 * return true if update was performed
 *
 * */
export declare function updateWdChatContactInfos(wdChat: wd.Chat<"PLAIN">, contactName: string, contactIndexInSim: number | null): Promise<boolean>;
export declare const destroyWdChat: (wdInstance: wd.Instance<"PLAIN">, wdChat: wd.Chat<"PLAIN">) => Promise<void>;
/** Return undefined when the INCOMING message have been received already */
export declare function newWdMessage<T extends wd.Message.Outgoing.Pending<"PLAIN">>(wdChat: wd.Chat<"PLAIN">, message: wd.NoId<T>): Promise<T>;
export declare function newWdMessage<T extends wd.Message.Incoming<"PLAIN"> | wd.Message.Outgoing.StatusReportReceived<"PLAIN">>(wdChat: wd.Chat<"PLAIN">, message: wd.NoId<T>): Promise<T | undefined>;
export declare function notifyUaFailedToSendMessage(wdChat: wd.Chat<"PLAIN">, wdMessage: wd.Message.Outgoing.Pending<"PLAIN">): Promise<wd.Message.Outgoing.SendReportReceived<"PLAIN">>;
export declare function notifySendReportReceived(wdChat: wd.Chat<"PLAIN">, sendReportBundledData: gwTypes.BundledData.ServerToClient.SendReport): Promise<wd.Message.Outgoing.SendReportReceived<"PLAIN"> | undefined>;
export declare const notifyStatusReportReceived: (wdChat: wd.Chat<"PLAIN">, statusReportBundledData: gwTypes.BundledData.ServerToClient.StatusReport) => Promise<wd.Message.Outgoing.StatusReportReceived.SentByUser<"PLAIN"> | undefined>;

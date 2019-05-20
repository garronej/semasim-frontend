import { SyncEvent } from "ts-events-extended";
import * as apiDeclaration from "../../sip_api_declarations/backendToUa";
import { types as gwTypes } from "../../gateway";
import * as types from "../types/userSim";
import * as wd from "../types/webphoneData/logic";
import * as dcTypes from "chan-dongle-extended-client/dist/lib/types";
import * as cryptoLib from "../../tools/crypto/library";
/** Posted when user register a new sim on he's LAN or accept a sharing request */
export declare const evtUsableSim: SyncEvent<types.UserSim._Base<types.SimOwnership.Owned | types.SimOwnership.Shared.Confirmed>>;
export declare const getUsableUserSims: (includeContacts?: boolean, stateless?: false | "STATELESS") => Promise<types.UserSim._Base<types.SimOwnership.Owned | types.SimOwnership.Shared.Confirmed>[]>;
export declare const unlockSim: (lockedDongle: dcTypes.Dongle.Locked, pin: string) => Promise<apiDeclaration.unlockSim.Response>;
export declare const registerSim: (dongle: dcTypes.Dongle.Usable, friendlyName: string) => Promise<void>;
export declare const unregisterSim: (userSim: types.UserSim._Base<types.SimOwnership.Owned | types.SimOwnership.Shared.Confirmed>) => Promise<void>;
export declare const rebootDongle: (userSim: types.Online<types.UserSim._Base<types.SimOwnership.Owned | types.SimOwnership.Shared.Confirmed>>) => Promise<void>;
export declare const shareSim: (userSim: types.UserSim._Base<types.SimOwnership.Owned>, emails: string[], message: string) => Promise<void>;
export declare const stopSharingSim: (userSim: types.UserSim._Base<types.SimOwnership.Owned>, emails: string[]) => Promise<void>;
export declare const changeSimFriendlyName: (userSim: types.UserSim._Base<types.SimOwnership.Owned | types.SimOwnership.Shared.Confirmed>, friendlyName: string) => Promise<void>;
export declare const acceptSharingRequest: (notConfirmedUserSim: types.UserSim._Base<types.SimOwnership.Shared.NotConfirmed>, friendlyName: string) => Promise<void>;
export declare const rejectSharingRequest: (userSim: types.UserSim._Base<types.SimOwnership.Shared.NotConfirmed>) => Promise<void>;
export declare const createContact: (userSim: types.UserSim._Base<types.SimOwnership.Owned | types.SimOwnership.Shared.Confirmed>, name: string, number: string) => Promise<types.UserSim.Contact>;
export declare const updateContactName: (userSim: types.UserSim._Base<types.SimOwnership.Owned | types.SimOwnership.Shared.Confirmed>, contact: types.UserSim.Contact, newName: string) => Promise<void>;
export declare const deleteContact: (userSim: types.UserSim._Base<types.SimOwnership.Owned | types.SimOwnership.Shared.Confirmed>, contact: types.UserSim.Contact) => Promise<void>;
/** Api only called once */
export declare const shouldAppendPromotionalMessage: () => boolean | Promise<boolean>;
export declare const getUaInstanceId: () => Promise<apiDeclaration.getUaInstanceId.Response>;
/** Must be called prior any wd related API call */
export declare function setEncryptorDecryptor(encryptorDecryptor1: cryptoLib.EncryptorDecryptor): void;
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

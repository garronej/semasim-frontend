import { SyncEvent } from "ts-events-extended";
import * as apiDeclaration from "../../sip_api_declarations/backendToUa";
import { types as gwTypes } from "../../gateway";
import * as types from "../types";
import wd = types.webphoneData;
import * as dcTypes from "chan-dongle-extended-client/dist/lib/types";
/** Posted when user register a new sim on he's LAN or accept a sharing request */
export declare const evtUsableSim: SyncEvent<types.UserSim._Base<types.SimOwnership.Owned | types.SimOwnership.Shared.Confirmed>>;
export declare const getUsableUserSims: (includeContacts?: boolean, stateless?: false | "STATELESS") => Promise<types.UserSim._Base<types.SimOwnership.Owned | types.SimOwnership.Shared.Confirmed>[]>;
export declare const unlockSim: (lockedDongle: dcTypes.Dongle.Locked, pin: string) => Promise<dcTypes.UnlockResult.Success | dcTypes.UnlockResult.Failed | undefined>;
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
export declare const getOrCreateWdInstance: (userSim: types.UserSim._Base<types.SimOwnership.Owned | types.SimOwnership.Shared.Confirmed>) => Promise<wd.Instance>;
export declare const newWdChat: (wdInstance: wd.Instance, contactNumber: string, contactName: string, contactIndexInSim: number | null) => Promise<wd.Chat>;
export declare const fetchOlderWdMessages: (wdChat: wd.Chat) => Promise<wd.Message[]>;
/**
 *
 * If same as before the request won't be sent
 *
 * return true if update was performed
 *
 * */
export declare function updateWdChatIdOfLastMessageSeen(wdChat: wd.Chat): Promise<boolean>;
/**
 *
 * If same as before the request won't be sent
 *
 * return true if update was performed
 *
 * */
export declare function updateWdChatContactInfos(wdChat: wd.Chat, contactName: string, contactIndexInSim: number | null): Promise<boolean>;
export declare const destroyWdChat: (wdInstance: wd.Instance, wdChat: wd.Chat) => Promise<void>;
/** Return undefined when the INCOMING message have been received already */
export declare function newWdMessage<T extends wd.Message.Outgoing.Pending>(wdChat: wd.Chat, message: wd.NoId<T>): Promise<T>;
export declare function newWdMessage<T extends wd.Message.Incoming | wd.Message.Outgoing.StatusReportReceived>(wdChat: wd.Chat, message: wd.NoId<T>): Promise<T | undefined>;
export declare function notifyUaFailedToSendMessage(wdChat: wd.Chat, wdMessage: wd.Message.Outgoing.Pending): Promise<wd.Message.Outgoing.SendReportReceived>;
export declare function notifySendReportReceived(wdChat: wd.Chat, sendReportBundledData: gwTypes.BundledData.ServerToClient.SendReport): Promise<wd.Message.Outgoing.SendReportReceived | undefined>;
export declare const notifyStatusReportReceived: (wdChat: wd.Chat, statusReportBundledData: gwTypes.BundledData.ServerToClient.StatusReport) => Promise<wd.Message.Outgoing.StatusReportReceived.SentByUser | undefined>;

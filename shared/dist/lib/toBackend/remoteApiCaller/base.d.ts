import { SyncEvent } from "ts-events-extended";
import * as apiDeclaration from "../../../sip_api_declarations/backendToUa";
import * as types from "../../types/userSim";
import * as dcTypes from "chan-dongle-extended-client/dist/lib/types";
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

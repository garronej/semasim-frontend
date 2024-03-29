import * as apiDeclaration from "../../../sip_api_declarations/backendToUa";
import * as types from "../../types";
import * as dcTypes from "chan-dongle-extended-client/dist/lib/types";
export declare type RemoteNotifyEvts = Pick<types.RemoteNotifyEvts, "evtUserSimChange">;
export declare function getCoreApi(sendRequest: ReturnType<typeof import("./getSendRequest").getSendRequest>, remoteNotifyEvts: RemoteNotifyEvts, restartApp: (typeof import("../../restartApp"))["restartApp"], userEmail: string): {
    getUserSims: ({ includeContacts }: {
        includeContacts: boolean;
    }) => Promise<{
        userSims: types.UserSim[];
        userSimEvts: types.UserSim.Evts;
    }>;
    unlockSim: ({ lockedDongle, pin }: {
        lockedDongle: dcTypes.Dongle.Locked;
        pin: string;
    }) => Promise<apiDeclaration.unlockSim.Response>;
    registerSim: ({ dongle, friendlyName }: {
        dongle: dcTypes.Dongle.Usable;
        friendlyName: string;
    }) => Promise<void>;
    unregisterSim: (userSim: types.UserSim.Usable) => Promise<void>;
    /** Assert sim is reachable */
    rebootDongle: (userSim: types.UserSim.Usable) => Promise<void>;
    shareSim: ({ userSim, emails, message }: {
        userSim: types.UserSim.Owned;
        emails: string[];
        message: string;
    }) => Promise<void>;
    stopSharingSim: ({ userSim, emails }: {
        userSim: types.UserSim.Owned;
        emails: string[];
    }) => Promise<void>;
    changeSimFriendlyName: ({ userSim, friendlyName }: {
        userSim: types.UserSim.Usable;
        friendlyName: string;
    }) => Promise<void>;
    acceptSharingRequest: ({ notConfirmedUserSim, friendlyName }: {
        notConfirmedUserSim: types.UserSim.Shared.NotConfirmed;
        friendlyName: string;
    }) => Promise<void>;
    rejectSharingRequest: (userSim: types.UserSim.Shared.NotConfirmed) => Promise<void>;
    createContact: ({ userSim, name, number_raw }: {
        userSim: types.UserSim.Usable;
        name: string;
        number_raw: string;
    }) => Promise<types.UserSim.Contact>;
    updateContactName: ({ userSim, contact, newName }: {
        userSim: types.UserSim.Usable;
        contact: types.UserSim.Contact;
        newName: string;
    }) => Promise<void>;
    deleteContact: ({ userSim, contact }: {
        userSim: types.UserSim.Usable;
        contact: types.UserSim.Contact;
    }) => Promise<void>;
    shouldAppendPromotionalMessage: () => Promise<boolean> | boolean;
};
export declare type CoreApi = ReturnType<typeof getCoreApi>;

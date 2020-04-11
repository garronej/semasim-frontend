import * as types from "../../types";
import * as dcTypes from "chan-dongle-extended-client/dist/lib/types";
export declare type RemoteNotifyEvts = Pick<types.RemoteNotifyEvts, "evtUserSimChange">;
export declare function getCoreApi(sendRequest: ReturnType<typeof import("./getSendRequest").getSendRequest>, remoteNotifyEvts: RemoteNotifyEvts, restartApp: (typeof import("../../restartApp"))["restartApp"], userEmail: string): {
    getUserSims: ({ includeContacts }: {
        includeContacts: boolean;
    }) => Promise<{
        userSims: types.UserSim[];
        userSimEvts: {
            evtNew: import("evt").NonPostableEvt<{
                cause: "SIM REGISTERED FROM LAN";
                userSim: types.UserSim.Owned;
            } | {
                cause: "SHARING REQUEST RECEIVED";
                userSim: types.UserSim.Shared.NotConfirmed;
            }>;
            evtNowConfirmed: import("evt").NonPostableEvt<types.UserSim.Shared.Confirmed>;
            evtDelete: import("evt").NonPostableEvt<{
                cause: "USER UNREGISTER SIM";
                userSim: types.UserSim.Usable;
            } | {
                cause: "PERMISSION LOSS";
                userSim: types.UserSim.Shared;
            } | {
                cause: "REJECT SHARING REQUEST";
                userSim: types.UserSim.Shared.NotConfirmed;
            }>;
            evtReachabilityStatusChange: import("evt").NonPostableEvt<types.UserSim>;
            evtSipPasswordRenewed: import("evt").NonPostableEvt<types.UserSim>;
            evtCellularConnectivityChange: import("evt").NonPostableEvt<types.UserSim>;
            evtCellularSignalStrengthChange: import("evt").NonPostableEvt<types.UserSim>;
            evtOngoingCall: import("evt").NonPostableEvt<types.UserSim>;
            evtNewUpdatedOrDeletedContact: import("evt").NonPostableEvt<{
                eventType: "NEW" | "DELETED" | "UPDATED";
                userSim: types.UserSim;
                contact: types.UserSim.Contact;
            }>;
            evtSharedUserSetChange: import("evt").NonPostableEvt<{
                userSim: types.UserSim;
                action: "ADD" | "REMOVE" | "MOVE TO CONFIRMED";
                targetSet: "CONFIRMED USERS" | "NOT CONFIRMED USERS";
                email: string;
            }>;
            evtFriendlyNameChange: import("evt").NonPostableEvt<types.UserSim.Usable>;
        };
    }>;
    unlockSim: ({ lockedDongle, pin }: {
        lockedDongle: dcTypes.Dongle.Locked;
        pin: string;
    }) => Promise<dcTypes.UnlockResult.Success | dcTypes.UnlockResult.Failed | undefined>;
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
    shouldAppendPromotionalMessage: () => boolean | Promise<boolean>;
};
export declare type CoreApi = ReturnType<typeof getCoreApi>;

import * as dcTypes from "chan-dongle-extended-client/dist/lib/types";
import { Evt, VoidEvt, UnpackEvt } from "evt";
import { NonPostableEvts } from "../../tools/NonPostableEvts";
export declare type UserSim = UserSim.Shared | UserSim.Owned;
export declare namespace UserSim {
    type Common_ = {
        sim: dcTypes.Sim;
        friendlyName: string;
        password: string;
        towardSimEncryptKeyStr: string;
        dongle: {
            imei: string;
            isVoiceEnabled?: boolean;
            manufacturer: string;
            model: string;
            firmwareVersion: string;
        };
        gatewayLocation: GatewayLocation;
        phonebook: Contact[];
        reachableSimState: ReachableSimState | undefined;
    };
    type Owned = Common_ & {
        ownership: Ownership.Owned;
    };
    namespace Owned {
        function match(userSim: UserSim): userSim is Owned;
    }
    type Shared = Shared.Confirmed | Shared.NotConfirmed;
    namespace Shared {
        type Confirmed = Common_ & {
            ownership: Ownership.Shared.Confirmed;
        };
        namespace Confirmed {
            function match(userSim: UserSim): userSim is Confirmed;
        }
        type NotConfirmed = Common_ & {
            ownership: Ownership.Shared.NotConfirmed;
        };
        namespace NotConfirmed {
            function match(userSim: UserSim): userSim is NotConfirmed;
        }
        function match(userSim: UserSim): userSim is Shared;
    }
    type Ownership = Ownership.Owned | Ownership.Shared;
    namespace Ownership {
        type Owned = {
            status: "OWNED";
            sharedWith: {
                confirmed: string[];
                notConfirmed: string[];
            };
        };
        type Shared = Shared.Confirmed | Shared.NotConfirmed;
        namespace Shared {
            type Confirmed = {
                status: "SHARED CONFIRMED";
                ownerEmail: string;
                otherUserEmails: string[];
            };
            type NotConfirmed = {
                status: "SHARED NOT CONFIRMED";
                ownerEmail: string;
                otherUserEmails: string[];
                sharingRequestMessage: string | undefined;
            };
        }
    }
    type ReachableSimState = ReachableSimState.ConnectedToCellularNetwork | ReachableSimState.NotConnectedToCellularNetwork;
    namespace ReachableSimState {
        type Common_ = {
            cellSignalStrength: dcTypes.Dongle.Usable.CellSignalStrength;
        };
        type NotConnectedToCellularNetwork = Common_ & {
            isGsmConnectivityOk: false;
        };
        type ConnectedToCellularNetwork = Common_ & {
            isGsmConnectivityOk: true;
            ongoingCall: OngoingCall | undefined;
        };
    }
    type OngoingCall = {
        ongoingCallId: string;
        from: "DONGLE" | "SIP";
        number: string;
        isUserInCall: boolean;
        otherUserInCallEmails: string[];
    };
    type Contact = {
        mem_index?: number;
        name: string;
        number_raw: string;
    };
    type GatewayLocation = {
        ip: string;
        countryIso: string | undefined;
        subdivisions: string | undefined;
        city: string | undefined;
    };
    function assertIs(userSim: any): asserts userSim is UserSim;
    type Evts = {
        evtNew: Evt<{
            cause: "SIM REGISTERED FROM LAN";
            userSim: UserSim.Owned;
        } | {
            cause: "SHARING REQUEST RECEIVED";
            userSim: UserSim.Shared.NotConfirmed;
        }>;
        evtNowConfirmed: Evt<UserSim.Shared.Confirmed>;
        evtDelete: Evt<{
            cause: "USER UNREGISTER SIM";
            userSim: UserSim.Usable;
        } | {
            cause: "PERMISSION LOSS";
            userSim: UserSim.Shared;
        } | {
            cause: "REJECT SHARING REQUEST";
            userSim: UserSim.Shared.NotConfirmed;
        }>;
        evtReachabilityStatusChange: Evt<UserSim>;
        evtSipPasswordRenewed: Evt<UserSim>;
        evtCellularConnectivityChange: Evt<UserSim>;
        evtCellularSignalStrengthChange: Evt<UserSim>;
        evtOngoingCall: Evt<UserSim>;
        evtNewUpdatedOrDeletedContact: Evt<{
            eventType: "NEW" | "UPDATED" | "DELETED";
            userSim: UserSim;
            contact: Contact;
        }>;
        evtSharedUserSetChange: Evt<{
            userSim: UserSim;
            action: "ADD" | "REMOVE" | "MOVE TO CONFIRMED";
            targetSet: "CONFIRMED USERS" | "NOT CONFIRMED USERS";
            email: string;
        }>;
        evtFriendlyNameChange: Evt<UserSim.Usable>;
    };
    namespace Evts {
        type ForSpecificSim = {
            [key in Exclude<keyof Evts, "evtNew">]: RemoveUserSim<Evts[key]>;
        };
        namespace ForSpecificSim {
            function build(userSimEvts: NonPostableEvts<Evts>, userSim: UserSim): NonPostableEvts<ForSpecificSim>;
            function build<Keys extends keyof ForSpecificSim>(userSimEvts: Pick<NonPostableEvts<Evts>, Keys>, userSim: UserSim, keys: Keys[]): Pick<NonPostableEvts<ForSpecificSim>, Keys>;
        }
    }
    type Usable = Owned | Shared.Confirmed;
    namespace Usable {
        function match(userSim: UserSim): userSim is Usable;
        /** The events that apply to an array of usable sim
         * are all usable ( the sim shared not included ).
         *
         * All events are the same except evtNowConfirmed
         * and evtNew that are changed.
         *
         * When a sim goes from state shared not confirmed
         * to shared confirmed it is added to the array
         * so an evtNew is posted.
         *
         * Also all UserSim are here UserSim.Usable.
         *
         */
        type Evts = {
            [key in Exclude<keyof UserSim.Evts, "evtNowConfirmed" | "evtNew" | "evtDelete">]: ReplaceByUsable<UserSim.Evts[key]>;
        } & {
            evtNew: Evt<Exclude<UnpackEvt<UserSim.Evts["evtNew"]>, {
                cause: "SHARING REQUEST RECEIVED";
            }> | {
                cause: "SHARED SIM CONFIRMED";
                userSim: UserSim.Shared.Confirmed;
            }>;
            evtDelete: Evt<Exclude<UnpackEvt<UserSim.Evts["evtDelete"]>, {
                cause: "REJECT SHARING REQUEST" | "PERMISSION LOSS";
            }> | {
                cause: "PERMISSION LOSS";
                userSim: UserSim.Shared.Confirmed;
            }>;
        };
        namespace Evts {
            function build(params: {
                userSims: UserSim[];
                userSimEvts: NonPostableEvts<UserSim.Evts>;
            }): {
                userSims: UserSim.Usable[];
                userSimEvts: NonPostableEvts<Evts>;
            };
            type ForSpecificSim = {
                [key in Exclude<keyof Evts, "evtNew">]: RemoveUserSim<Evts[key]>;
            };
            namespace ForSpecificSim {
                function build(userSimEvts: NonPostableEvts<Evts>, userSim: UserSim.Usable): NonPostableEvts<ForSpecificSim>;
                function build<Keys extends keyof ForSpecificSim>(userSimEvts: Pick<NonPostableEvts<Evts>, Keys>, userSim: UserSim.Usable, keys: Keys[]): Pick<NonPostableEvts<ForSpecificSim>, Keys>;
            }
        }
    }
}
export declare type RemoveUserSim<T> = T extends Evt<infer U> ? (U extends UserSim ? VoidEvt : (U extends UnpackEvt<UserSim.Evts["evtNew"]> ? Evt<{
    cause: UnpackEvt<UserSim.Evts["evtNew"]>["cause"];
}> : (U extends UnpackEvt<UserSim.Evts["evtDelete"]> ? Evt<{
    cause: UnpackEvt<UserSim.Evts["evtDelete"]>["cause"];
}> : (U extends {
    userSim: UserSim;
} ? Evt<Omit<U, "userSim">> : T)))) : T;
export declare type ReplaceByUsable<T> = T extends Evt<infer U> ? (U extends UserSim ? Evt<UserSim.Usable> : (U extends {
    userSim: UserSim;
} ? Evt<Omit<U, "userSim"> & {
    userSim: UserSim.Usable;
}> : T)) : T;

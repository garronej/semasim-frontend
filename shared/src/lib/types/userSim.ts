import * as dcTypes from "chan-dongle-extended-client/dist/lib/types";

export type SimOwnership = SimOwnership.Owned | SimOwnership.Shared;

export namespace SimOwnership {

    export type Owned = {
        status: "OWNED";
        sharedWith: {
            confirmed: string[];
            notConfirmed: string[];
        };
    };

    export type Shared = Shared.Confirmed | Shared.NotConfirmed;

    export namespace Shared {

        export type Confirmed = {
            status: "SHARED CONFIRMED";
            ownerEmail: string;
            otherUserEmails: string[];
        };

        export type NotConfirmed = {
            status: "SHARED NOT CONFIRMED";
            ownerEmail: string;
            otherUserEmails: string[];
            sharingRequestMessage: string | undefined;
        };

    }

}

export type OngoingCall = {
    ongoingCallId: string;
    from: "DONGLE" | "SIP";
    number: string;
    isUserInCall: boolean;
    otherUserInCallEmails: string[];
};

export type ReachableSimState =
    ReachableSimState.ConnectedToCellularNetwork |
    ReachableSimState.NotConnectedToCellularNetwork
    ;

export namespace ReachableSimState {

    export type Base = {
        cellSignalStrength: dcTypes.Dongle.Usable.CellSignalStrength;
    };

    export type NotConnectedToCellularNetwork = Base & {
        isGsmConnectivityOk: false;
    };

    export type ConnectedToCellularNetwork = Base & {
        isGsmConnectivityOk: true;
        ongoingCall: OngoingCall | undefined;
    };

}

export type UserSim = UserSim._Base<SimOwnership>;

export namespace UserSim {

    export type _Base<T extends SimOwnership> = {
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
        ownership: T;
        phonebook: Contact[];
        reachableSimState: ReachableSimState | undefined;
    };

    export type Contact = {
        mem_index?: number;
        name: string;
        number_raw: string;
    };

    export type GatewayLocation = {
        ip: string;
        countryIso: string | undefined;
        subdivisions: string | undefined;
        city: string | undefined;
    };

    export type Owned = _Base<SimOwnership.Owned>;

    export namespace Owned {
        export function match(userSim: UserSim): userSim is Owned {
            return userSim.ownership.status === "OWNED";
        }
    }

    export type Shared = _Base<SimOwnership.Shared>;

    export namespace Shared {

        export function match(userSim: UserSim): userSim is Shared {
            return Confirmed.match(userSim) || NotConfirmed.match(userSim);
        }

        export type Confirmed = _Base<SimOwnership.Shared.Confirmed>;

        export namespace Confirmed {
            export function match(userSim: UserSim): userSim is Confirmed {
                return userSim.ownership.status === "SHARED CONFIRMED";
            }
        }

        export type NotConfirmed = _Base<SimOwnership.Shared.NotConfirmed>;

        export namespace NotConfirmed {
            export function match(userSim: UserSim): userSim is NotConfirmed {
                return userSim.ownership.status === "SHARED NOT CONFIRMED";
            }
        }

    }

    export type Usable = _Base<SimOwnership.Owned | SimOwnership.Shared.Confirmed>;

    export namespace Usable {
        export function match(userSim: UserSim): userSim is Usable {
            return Owned.match(userSim) || Shared.Confirmed.match(userSim);
        }
    }


}

export type Online<T extends UserSim> = T & { isOnline: true; };

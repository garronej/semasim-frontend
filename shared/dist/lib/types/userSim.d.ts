import * as dcTypes from "chan-dongle-extended-client/dist/lib/types";
export declare type SimOwnership = SimOwnership.Owned | SimOwnership.Shared;
export declare namespace SimOwnership {
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
export declare type OngoingCall = {
    ongoingCallId: string;
    from: "DONGLE" | "SIP";
    number: string;
    isUserInCall: boolean;
    otherUserInCallEmails: string[];
};
export declare type ReachableSimState = ReachableSimState.ConnectedToCellularNetwork | ReachableSimState.NotConnectedToCellularNetwork;
export declare namespace ReachableSimState {
    type Base = {
        cellSignalStrength: dcTypes.Dongle.Usable.CellSignalStrength;
    };
    type NotConnectedToCellularNetwork = Base & {
        isGsmConnectivityOk: false;
    };
    type ConnectedToCellularNetwork = Base & {
        isGsmConnectivityOk: true;
        ongoingCall: OngoingCall | undefined;
    };
}
export declare type UserSim = UserSim._Base<SimOwnership>;
export declare namespace UserSim {
    type _Base<T extends SimOwnership> = {
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
    type Owned = _Base<SimOwnership.Owned>;
    namespace Owned {
        function match(userSim: UserSim): userSim is Owned;
    }
    type Shared = _Base<SimOwnership.Shared>;
    namespace Shared {
        function match(userSim: UserSim): userSim is Shared;
        type Confirmed = _Base<SimOwnership.Shared.Confirmed>;
        namespace Confirmed {
            function match(userSim: UserSim): userSim is Confirmed;
        }
        type NotConfirmed = _Base<SimOwnership.Shared.NotConfirmed>;
        namespace NotConfirmed {
            function match(userSim: UserSim): userSim is NotConfirmed;
        }
    }
    type Usable = _Base<SimOwnership.Owned | SimOwnership.Shared.Confirmed>;
    namespace Usable {
        function match(userSim: UserSim): userSim is Usable;
    }
}
export declare type Online<T extends UserSim> = T & {
    isOnline: true;
};

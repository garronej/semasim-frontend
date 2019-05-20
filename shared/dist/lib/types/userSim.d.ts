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
        };
        type NotConfirmed = {
            status: "SHARED NOT CONFIRMED";
            ownerEmail: string;
            sharingRequestMessage: string | undefined;
        };
    }
}
export declare type UserSim = UserSim._Base<SimOwnership>;
export declare namespace UserSim {
    type _Base<T extends SimOwnership> = {
        sim: dcTypes.Sim;
        friendlyName: string;
        password: string;
        dongle: {
            imei: string;
            isVoiceEnabled?: boolean;
            manufacturer: string;
            model: string;
            firmwareVersion: string;
        };
        gatewayLocation: GatewayLocation;
        isOnline: boolean;
        ownership: T;
        phonebook: Contact[];
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

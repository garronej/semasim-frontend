
//START IMPORT

export type Contact = {
    readonly index: number;
    readonly name: {
        readonly asStored: string;
        full: string;
    };
    readonly number: {
        readonly asStored: string;
        localFormat: string;
    };
}

export type SimStorage = {
    number?: {
        readonly asStored: string;
        localFormat: string;
    };
    infos: {
        contactNameMaxLength: number;
        numberMaxLength: number;
        storageLeft: number;
    };
    contacts: Contact[];
    digest: string;
};

export type LockedPinState = "SIM PIN" | "SIM PUK" | "SIM PIN2" | "SIM PUK2";

export interface LockedDongle {
    imei: string;
    manufacturer: string;
    model: string;
    firmwareVersion: string;
    sim: {
        iccid?: string;
        pinState: LockedPinState;
        tryLeft: number;
    }
}

export namespace LockedDongle {

    export function match(dongle: Dongle): dongle is LockedDongle {
        return (dongle.sim as LockedDongle['sim']).pinState !== undefined;
    }

}

export type SimCountry = {
    name: string;
    iso: string;
    code: number;
};

export interface ActiveDongle {
    imei: string;
    manufacturer: string;
    model: string;
    firmwareVersion: string;
    isVoiceEnabled?: boolean;
    sim: {
        iccid: string;
        imsi: string;
        country?: SimCountry;
        serviceProvider: {
            fromImsi?: string;
            fromNetwork?: string;
        },
        storage: SimStorage;
    }
}

export namespace ActiveDongle {

    export function match(dongle: Dongle): dongle is ActiveDongle {
        return !LockedDongle.match(dongle);
    }

}

export type Dongle = LockedDongle | ActiveDongle;

//END IMPORT

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
            ownerEmail: string
        };

        export type NotConfirmed = {
            status: "SHARED NOT CONFIRMED";
            ownerEmail: string;
            sharingRequestMessage: string | undefined;
        };

    }

}

export type UserSim = UserSim.Base<SimOwnership>;

export namespace UserSim {

    export type Base<T extends SimOwnership> = {
        sim: ActiveDongle["sim"];
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
    };

    export type GatewayLocation = {
        ip: string;
        countryIso: string | undefined;
        subdivisions: string | undefined;
        city: string | undefined;
    }

    export type Owned = Base<SimOwnership.Owned>;

    export namespace Owned {
        export function match(userSim: UserSim): userSim is Owned {
            return userSim.ownership.status === "OWNED";
        }
    }

    export type Shared = Base<SimOwnership.Shared>;

    export namespace Shared {

        export function match(userSim: UserSim): userSim is Shared {
            return Confirmed.match(userSim) || NotConfirmed.match(userSim);
        }

        export type Confirmed = Base<SimOwnership.Shared.Confirmed>;

        export namespace Confirmed {
            export function match(userSim: UserSim): userSim is Confirmed {
                return userSim.ownership.status === "SHARED CONFIRMED";
            }
        }

        export type NotConfirmed = Base<SimOwnership.Shared.NotConfirmed>;

        export namespace NotConfirmed {
            export function match(userSim: UserSim): userSim is NotConfirmed {
                return userSim.ownership.status === "SHARED NOT CONFIRMED";
            }
        }

    }

    export type Usable = Base<SimOwnership.Owned | SimOwnership.Shared.Confirmed>;

    export namespace Usable {
        export function match(userSim: UserSim): userSim is Usable {
            return Owned.match(userSim) || Shared.Confirmed.match(userSim);
        }
    }

}

export type AffectedUsers = {
    registered: string[];
    notRegistered: string[];
};

export type UnlockResult = UnlockResult.WrongPin | UnlockResult.ValidPin;

export namespace UnlockResult {

    export type WrongPin = {
        wasPinValid: false;
        pinState: LockedPinState;
        tryLeft: number;
    };

    export type ValidPin = ValidPin.Registerable | ValidPin.NotRegisterable;

    export namespace ValidPin {

        export type Registerable = {
            wasPinValid: true;
            isSimRegisterable: true;
            dongle: ActiveDongle;
        };

        export type NotRegisterable = {
            wasPinValid: true;
            isSimRegisterable: false;
            simRegisteredBy: { who: "MYSELF" } | { who: "OTHER USER"; email: string; };
        };

    }

}


export type WebphoneData = {
    uaInstanceId: string;
    instances: WebphoneData.Instance[]
};

export namespace WebphoneData {

    export type Instance = {
        id_: number;
        imsi: string;
        chats: Chat[];
    };

    export type Chat = {
        id_: number;
        contactNumber: string;
        contactName: string;
        isContactInSim: boolean;
        messages: Message[];
        lastSeenTime: number;
    };

    export type Message = Message.Incoming | Message.Outgoing;

    export namespace Message {

        export type Base = {
            id_: number;
            time: number;
            direction: "INCOMING" | "OUTGOING";
            text: string;
        };

        export type Incoming = Base & {
            direction: "INCOMING";
            isNotification: boolean;
        };


        export type Outgoing = Base & {
            direction: "OUTGOING";
            sentBy: { who: "MYSELF"; } | { who: "OTHER"; email: string; }
            status: "TRANSMITTED TO GATEWAY" | "SENT BY DONGLE" | "RECEIVED"
        };

    }

}

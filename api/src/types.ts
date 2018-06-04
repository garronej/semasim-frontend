import * as dcTypes from "../node_modules/chan-dongle-extended-client/dist/lib/types";

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

    export type Contact = {
        mem_index?: number;
        name: string;
        number_raw: string;
        number_local_format: string;
    };

    export type GatewayLocation = {
        ip: string;
        countryIso: string | undefined;
        subdivisions: string | undefined;
        city: string | undefined;
    };

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
        pinState: dcTypes.Dongle.Locked.PinState;
        tryLeft: number;
    };

    export type ValidPin = ValidPin.Registerable | ValidPin.NotRegisterable;

    export namespace ValidPin {

        export type Registerable = {
            wasPinValid: true;
            isSimRegisterable: true;
            dongle: dcTypes.Dongle.Usable;
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
    email: string;
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
        contactIndexInSim: number | null;
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

        export type Incoming = Incoming.Text | Incoming.Notification;

        export namespace Incoming {

            export type Base = Message.Base & {
                direction: "INCOMING";
                isNotification: boolean;
            };

            export type Text= Base & {
                isNotification: false;
            };

            export type Notification= Base & {
                isNotification: true;
            };

        }

        export type Outgoing =
            Outgoing.TransmittedToGateway |
            Outgoing.SendReportReceived |
            Outgoing.StatusReportReceived;

        export namespace Outgoing {

            export type Base = Message.Base & {
                direction: "OUTGOING";
                sentBy: { who: "MYSELF"; } | { who: "OTHER"; email: string; }
                status: "TRANSMITTED TO GATEWAY" | "SEND REPORT RECEIVED" | "STATUS REPORT RECEIVED";
            };

            export type TransmittedToGateway = Base & {
                status: "TRANSMITTED TO GATEWAY";
            };

            export type SendReportReceived = Base & {
                status: "SEND REPORT RECEIVED";
                dongleSendTime: number | null;
            };

            export type StatusReportReceived = Base & {
                status: "STATUS REPORT RECEIVED";
                dongleSendTime: number;
                deliveredTime: number | null;
            };

        }


    }

}

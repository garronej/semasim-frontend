import * as dcTypes from "chan-dongle-extended-client/dist/lib/types";
export declare type SubscriptionInfos = {
    stripePublicApiKey: string;
    pricingByCurrency: {
        [currency: string]: number;
    };
    defaultCurrency: string;
    source?: SubscriptionInfos.Source;
    subscription?: SubscriptionInfos.Subscription;
    due?: SubscriptionInfos.Due;
};
export declare namespace SubscriptionInfos {
    type Source = {
        isChargeable: boolean;
        lastDigits: string;
        expiration: string;
    };
    type Subscription = {
        cancel_at_period_end: boolean;
        current_period_end: Date;
        currency: string;
    };
    type Due = {
        value: number;
        currency: string;
    };
}
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
export declare namespace webphoneData {
    type Instance = {
        id_: number;
        imsi: string;
        chats: Chat[];
    };
    type Chat = {
        id_: number;
        contactNumber: string;
        contactName: string;
        contactIndexInSim: number | null;
        messages: Message[];
        idOfLastMessageSeen: number | null;
    };
    type Message = Message.Incoming | Message.Outgoing;
    namespace Message {
        type _Base = {
            id_: number;
            time: number;
            direction: "INCOMING" | "OUTGOING";
            text: string;
        };
        type Incoming = Incoming.Text | Incoming.Notification;
        namespace Incoming {
            type _Base = Message._Base & {
                direction: "INCOMING";
                isNotification: boolean;
            };
            type Text = _Base & {
                isNotification: false;
            };
            type Notification = _Base & {
                isNotification: true;
            };
        }
        type Outgoing = Outgoing.Pending | Outgoing.SendReportReceived | Outgoing.StatusReportReceived;
        namespace Outgoing {
            type _Base = Message._Base & {
                direction: "OUTGOING";
                status: "PENDING" | "SEND REPORT RECEIVED" | "STATUS REPORT RECEIVED";
            };
            type Pending = _Base & {
                status: "PENDING";
            };
            type SendReportReceived = _Base & {
                status: "SEND REPORT RECEIVED";
                isSentSuccessfully: boolean;
            };
            type StatusReportReceived = StatusReportReceived.SentByUser | StatusReportReceived.SentByOther;
            namespace StatusReportReceived {
                type _Base = Outgoing._Base & {
                    status: "STATUS REPORT RECEIVED";
                    deliveredTime: number | null;
                    sentBy: {
                        who: "USER";
                    } | {
                        who: "OTHER";
                        email: string;
                    };
                };
                type SentByUser = _Base & {
                    sentBy: {
                        who: "USER";
                    };
                };
                type SentByOther = _Base & {
                    sentBy: {
                        who: "OTHER";
                        email: string;
                    };
                };
            }
        }
    }
    type NoId<T extends Message> = Pick<T, Exclude<keyof T, "id_">>;
    /** Best guess on previously opened chat: */
    function getChatWithLatestActivity(wdInstance: Instance): Chat | undefined;
    /**
     *
     * message1  < ( older than )  message1  => -1
     * message1 === message2  => 0
     * message1  >  message2  => 1
     *
     * Produce an ordering or messages that reflect the
     * real temporality of a conversation.
     *
     */
    function compareMessage(message1: Message, message2: Message): -1 | 0 | 1;
    /**
     *
     * chat1  <  chat2  => -1
     * chat1 === chat2  => 0
     * chat1  >  chat2  => 1
     *
     * Sorting a set of chats in decreasing order
     * will result in the following:
     *
     * -First chat with the more recent activity.
     * ( more resent message according to message ordering )
     * -Then chats that does not contain message will be
     * ordered in alphabetical order against their contact's name.
     * -Then the chats with no messages and no contact name
     * will be sorted in a non specified, deterministic order.
     *
     */
    function compareChat(chat1: Chat, chat2: Chat): -1 | 0 | 1;
    function getUnreadMessagesCount(wdChat: Chat): number;
}

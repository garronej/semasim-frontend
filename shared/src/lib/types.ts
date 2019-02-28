import * as dcTypes from "chan-dongle-extended-client/dist/lib/types";
import { isAscendingAlphabeticalOrder } from "./tools/isAscendingAlphabeticalOrder";

export type SubscriptionInfos = SubscriptionInfos.Regular | {
    customerStatus: "EXEMPTED";
};

export namespace SubscriptionInfos {

    export type Regular = {
        customerStatus: "REGULAR";
        stripePublicApiKey: string;
        pricingByCurrency: { [currency: string]: number; };
        defaultCurrency: string;
        source?: SubscriptionInfos.Source;
        subscription?: SubscriptionInfos.Subscription;
        due?: SubscriptionInfos.Due;
    };

    export type Source = {
        isChargeable: boolean;
        lastDigits: string;
        expiration: string;
        currency: string;
    };

    export type Subscription = {
        cancel_at_period_end: boolean;
        current_period_end: Date;
        currency: string;
    };

    export type Due = {
        value: number;
        currency: string;
    };

}

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

export type UserSim = UserSim._Base<SimOwnership>;

export namespace UserSim {

    export type _Base<T extends SimOwnership> = {
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


export namespace webphoneData {

    export type Instance = {
        id_: number;
        imsi: string;
        chats: Chat[];
    };

    export type Chat = {
        id_: number;
        contactNumber: string; /* type phoneNumber */
        contactName: string;
        contactIndexInSim: number | null;
        messages: Message[];
        idOfLastMessageSeen: number | null; /* id_ of last message not send by user */
    };

    export type Message = Message.Incoming | Message.Outgoing;

    export namespace Message {

        export type _Base = {
            id_: number;
            time: number;
            direction: "INCOMING" | "OUTGOING";
            text: string;
        };

        export type Incoming = Incoming.Text | Incoming.Notification;

        export namespace Incoming {

            export type _Base = Message._Base & {
                direction: "INCOMING";
                isNotification: boolean;
            };

            export type Text = _Base & {
                isNotification: false;
            };

            export type Notification = _Base & {
                isNotification: true;
            };

        }

        export type Outgoing =
            Outgoing.Pending |
            Outgoing.SendReportReceived |
            Outgoing.StatusReportReceived;

        export namespace Outgoing {

            export type _Base = Message._Base & {
                direction: "OUTGOING";
                status: "PENDING" | "SEND REPORT RECEIVED" | "STATUS REPORT RECEIVED";
            };

            export type Pending = _Base & {
                status: "PENDING";
            };

            export type SendReportReceived = _Base & {
                status: "SEND REPORT RECEIVED";
                isSentSuccessfully: boolean;
            };

            export type StatusReportReceived =
                StatusReportReceived.SentByUser |
                StatusReportReceived.SentByOther;

            export namespace StatusReportReceived {

                export type _Base = Outgoing._Base & {
                    status: "STATUS REPORT RECEIVED";
                    deliveredTime: number | null;
                    sentBy: { who: "USER"; } | { who: "OTHER"; email: string; };
                };

                export type SentByUser = _Base & {
                    sentBy: { who: "USER"; };
                };

                export type SentByOther = _Base & {
                    sentBy: { who: "OTHER"; email: string; };
                };

            }

        }


    }

    export type NoId<T extends Message> = Pick<T, Exclude<keyof T, "id_">>;


    /** Best guess on previously opened chat: */
    export function getChatWithLatestActivity(
        wdInstance: Instance
    ): Chat | undefined {

        //TODO: what if last seen message not loaded.
        const findMessageByIdAndGetTime = (
            wdChat: Chat,
            message_id: number | null
        ): number => {

            if (message_id === null ) {
                return 0;
            }

            for (let i = wdChat.messages.length - 1; i >= 0; i--) {

                const message = wdChat.messages[i];

                if (message.id_ === message_id) {
                    return message.time;
                }

            }

            return 0;

        };

        const findLastMessageSentByUserAndGetTime = (chat: Chat): number => {

            for (let i = chat.messages.length - 1; i >= 0; i--) {

                const message = chat.messages[i];

                if (
                    message.direction === "OUTGOING" &&
                    (
                        message.status !== "STATUS REPORT RECEIVED" ||
                        message.sentBy.who === "USER"
                    )
                ) {
                    return message.time;
                }

            }

            return 0;

        }

        let max = 0;
        let chat: Chat | undefined = undefined;

        for (const _chat of wdInstance.chats) {

            const curr = Math.max(
                findMessageByIdAndGetTime(_chat, _chat.idOfLastMessageSeen),
                findLastMessageSentByUserAndGetTime(_chat)
            );

            if (curr > max) {
                max = curr;
                chat = _chat;
            }

        }

        return chat;

    }


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
    export function compareMessage(message1: Message, message2: Message): -1 | 0 | 1 {

        const getOrderingTime = (message: Message): number => {

            if (message.direction === "OUTGOING") {

                if (message.status === "STATUS REPORT RECEIVED") {

                    if (message.deliveredTime !== null) {

                        return message.deliveredTime;

                    }

                } else if (!(message.status === "SEND REPORT RECEIVED" && !message.isSentSuccessfully)) {

                    const time = message.time + 60 * 1000;

                    if (time > Date.now()) {

                        return time;

                    }

                }

            }

            return message.time;

        };

        //return Math.sign(getOrderingTime(message1) - getOrderingTime(message2)) as (-1 | 0 | 1);

        const diff = getOrderingTime(message1) - getOrderingTime(message2);

        return diff !== 0 ? (diff > 0 ? 1 : -1) : 0;

    }

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
    export function compareChat(chat1: Chat, chat2: Chat): -1 | 0 | 1 {

        const hasContactName = (chat: Chat) => chat.contactName !== "";

        const hasMessages = (chat: Chat) => chat.messages.length !== 0;

        if (hasMessages(chat1) || hasMessages(chat2)) {

            if (!hasMessages(chat1)) {
                return -1;
            }

            if (!hasMessages(chat2)) {
                return 1;
            }

            //Assuming message are already ordered within chat.
            return compareMessage(
                chat1.messages.slice(-1).pop()!,
                chat2.messages.slice(-1).pop()!
            );

        } else if (hasContactName(chat1) || hasContactName(chat2)) {

            if (!hasContactName(chat1)) {
                return -1;
            }

            if (!hasContactName(chat2)) {
                return 1;
            }

            return isAscendingAlphabeticalOrder(
                chat1.contactName, chat2.contactName
            ) ? 1 : -1;

        } else {

            return chat1.contactNumber < chat2.contactNumber ? -1 : 1;

        }

    }


    export function getUnreadMessagesCount(wdChat: Chat): number {

        let count = 0;

        for (let i = wdChat.messages.length - 1; i >= 0; i--) {

            const message = wdChat.messages[i];

            if (
                message.direction === "INCOMING" ||
                (
                    message.status === "STATUS REPORT RECEIVED" &&
                    message.sentBy.who === "OTHER"
                )
            ) {

                if (wdChat.idOfLastMessageSeen === message.id_) {
                    break;
                }

                count++;

            }


        }

        return count;

    }




}

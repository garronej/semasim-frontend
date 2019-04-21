import * as dcTypes from "chan-dongle-extended-client/dist/lib/types";
import { isAscendingAlphabeticalOrder } from "./tools/isAscendingAlphabeticalOrder";
import * as currencyLib from "./tools/currency";

export type SubscriptionInfos = SubscriptionInfos.Regular | {
    customerStatus: "EXEMPTED";
};

export namespace SubscriptionInfos {

    export type Regular = {
        customerStatus: "REGULAR";
        stripePublicApiKey: string;
        pricingByCurrency: { [currency: string]: number; };
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

            if (message_id === null) {
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

export namespace shop {

    export type Footprint = "FLAT" | "VOLUME";

    /**
     * images: w/h = 1.5 & w >= 445px
     * cart image: w/h = 1.5 & h >= 80px
     */
    export type Product = {
        name: string;
        shortDescription: string;
        description: string;
        cartImageUrl: string;
        imageUrls: string[];
        price: Price;
        footprint: Footprint;
        weight: number;
    };


    export type Cart = Cart.Entry[];

    export namespace Cart {

        export type Entry = {
            product: Product;
            quantity: number;
        };

        export function getPrice(cart: Cart, convertFromEuro: ConvertFromEuro): Price {

            const out = cart
                .map(({ product: { price }, quantity }) => Price.operation(price, amount => amount * quantity))
                .reduce((out, price) => Price.addition(out, price, convertFromEuro), { "eur": 0 })
                ;

            //console.log("Cart.getGoodsPrice: ", JSON.stringify({ cart, out }, null, 2));

            return out;

        }

        export function getOverallFootprint(cart: Cart): Footprint {
            return !!cart.find(({ product }) => product.footprint === "VOLUME") ? "VOLUME" : "FLAT";
        }

        export function getOverallWeight(cart: Cart): number {
            return cart.reduce(
                (out, { product: { weight }, quantity }) => out + weight * quantity,
                0
            );
        }


    }

    export type ConvertFromEuro = (euroAmount: number, currencyTo: string) => number;

    export type Price = { "eur": number; } & { [currency: string]: number; };

    export namespace Price {

        /** 
         * Out of place.
         * If the amount for a currency is defined in one object
         * but not in the other the undefined amount will be 
         * computed from the rateChange
         * 
         */
        export function binaryOperation(
            price1: Price,
            price2: Price,
            op: (amount1: number, amount2: number) => number,
            convertFromEuro: ConvertFromEuro,
        ): Price {

            price1 = { ...price1 };
            price2 = { ...price2 };

            //NOTE: Ugly but does not involve map and less verbose.
            for (const currency of [...Object.keys(price1), ...Object.keys(price2)]) {
                for (const price of [price1, price2]) {
                    if (!(currency in price)) {
                        price[currency] = convertFromEuro(price["eur"], currency);
                    }
                }
            }

            const out: Price = { "eur": 0 };

            for (const currency in price1) {

                out[currency] = op(price1[currency], price2[currency]);

            }

            return out;

        }

        export function operation(
            price: Price,
            op: (amount: number) => number
        ): Price {

            const out: Price = { "eur": 0 };

            for (const currency in price) {

                out[currency] = Math.round(op(price[currency]));

            }

            return out;

        }

        export function addition(
            price1: Price,
            price2: Price,
            convertFromEuro: ConvertFromEuro
        ): Price {
            return binaryOperation(
                price1,
                price2,
                (amount1, amount2) => amount1 + amount2,
                convertFromEuro
            );
        }

        /** 
         * return the amount of a price in a given currency.
         * If the amount for the currency is not defined in
         * the price object it will be computer from the
         * euro amount.
         * */
        export function getAmountInCurrency(
            price: Price,
            currency: string,
            convertFromEuro: ConvertFromEuro
        ) {
            return currency in price ?
                price[currency] :
                convertFromEuro(price["eur"], currency)
                ;
        }

        export function prettyPrint(
            price: Price,
            currency: string,
            convertFromEuro: ConvertFromEuro
        ): string {

            return currencyLib.prettyPrint(
                getAmountInCurrency(
                    price,
                    currency,
                    convertFromEuro
                ),
                currency
            );

        }


    };

    export type ShippingFormData = {
        firstName: string;
        lastName: string;
        addressComponents: {
            long_name: string;
            short_name: string;
            types: string[];
        }[];
        addressExtra: string | undefined;
    };

    export namespace ShippingFormData {

        export function toStripeShippingInformation(
            shippingFormData: ShippingFormData,
            carrier: string
        ): StripeShippingInformation {

            const get = (key: string) => {

                const component = shippingFormData.addressComponents
                    .find(({ types: [type] }) => type === key);

                return component !== undefined ? component["long_name"] : undefined;

            };

            return {
                "name": `${shippingFormData.firstName} ${shippingFormData.lastName}`,
                "address": {
                    "line1": `${get("street_number")} ${get("route")}`,
                    "line2": shippingFormData.addressExtra,
                    "postal_code": get("postal_code") || "",
                    "city": get("locality") || "",
                    "state": get("administrative_area_level_1") || "",
                    "country": get("country") || ""
                },
                carrier,
            };

        }

    }

    export type StripeShippingInformation = {
        name: string;
        address: {
            line1: string;
            line2?: string;
            postal_code: string;
            city: string;
            state: string;
            country: string;
        },
        carrier: string;
    };


}



import type { Decryptor } from "crypto-lib";
import type { NonPostableEvt } from "evt";
import { isAscendingAlphabeticalOrder } from "../../tools/isAscendingAlphabeticalOrder";

export type EncryptionState = "PLAIN" | "ENCRYPTED";

export type Encryptable = {
    "string": {
        "PLAIN": string;
        "ENCRYPTED": { encrypted_string: string; };
    };
    "number | null": {
        "PLAIN": number | null;
        "ENCRYPTED": { encrypted_number_or_null: string; };
    };
};

export type Chat<E extends EncryptionState = "PLAIN"> = {
    ref: string;
    contactNumber: Encryptable["string"][E]; /* type phoneNumber */
    contactName: Encryptable["string"][E];
    contactIndexInSim: Encryptable["number | null"][E];
    messages: Message<E>[];
    refOfLastMessageSeen: string | null;
};

export namespace Chat {

    export function decryptFactory(
        params: {
            decryptThenParseFactory: typeof import("crypto-lib/dist/async/serializer").decryptThenParseFactory;
        }
    ) {

        const { decryptThenParseFactory } = params;

        const decryptMessage = Message.decryptFactory({ decryptThenParseFactory });

        return async function decrypt(
            params: {
                decryptor: Decryptor;
                chat: Chat<"ENCRYPTED">;
            }
        ): Promise<Chat> {

            const { decryptor, chat } = params;

            const decryptThenParse = decryptThenParseFactory(decryptor);

            const [contactNumber, contactName, contactIndexInSim, messages] =
                await Promise.all([
                    decryptThenParse<string>(chat.contactNumber.encrypted_string),
                    decryptThenParse<string>(chat.contactName.encrypted_string),
                    decryptThenParse<number | null>(chat.contactIndexInSim.encrypted_number_or_null),
                    Promise.all(
                        chat.messages.map(message => decryptMessage({
                            decryptor,
                            "encryptedMessage": message
                        }))
                    )
                ] as const);

            return { ...chat, contactNumber, contactName, contactIndexInSim, messages };

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

                if (wdChat.refOfLastMessageSeen === message.ref) {
                    break;
                }

                count++;

            }


        }

        return count;

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
     * will be sorted in a non specified, deterministic order 
     * ( based on the phoneNumberString).
     * 
     */
    export function compare(chat1: Chat, chat2: Chat): -1 | 0 | 1 {

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
            return Message.compare(
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

    /** Best guess on previously opened chat: */
    export function findLastOpened(
        wdChats: Chat[]
    ): Chat | undefined {

        //TODO: what if last seen message not loaded.
        const findMessageByIdAndGetTime = (
            wdChat: Chat,
            messageRef: string | null
        ): number => {

            if (messageRef === null) {
                return 0;
            }

            for (let i = wdChat.messages.length - 1; i >= 0; i--) {

                const message = wdChat.messages[i];

                if (message.ref === messageRef) {

                    return (
                        message.direction === "OUTGOING" &&
                        message.status === "STATUS REPORT RECEIVED" &&
                        message.sentBy.who === "OTHER" &&
                        message.deliveredTime !== null
                    ) ? message.deliveredTime : message.time;

                }

            }

            //return 0;
            //NOTE: If we did not find the message in the chat it mean that
            //a message that we have not yet received on the device the last
            //message seen.
            return Date.now();

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

        for (const _chat of wdChats) {

            const curr = Math.max(
                findMessageByIdAndGetTime(_chat, _chat.refOfLastMessageSeen),
                findLastMessageSentByUserAndGetTime(_chat)
            );

            if (curr > max) {
                max = curr;
                chat = _chat;
            }

        }

        return chat;

    }

}

export type Message<E extends EncryptionState = "PLAIN"> = Message.Incoming<E> | Message.Outgoing<E>;

export namespace Message {

    export function decryptFactory(
        params: {
            decryptThenParseFactory: typeof import("crypto-lib/dist/async/serializer").decryptThenParseFactory;
        }
    ) {

        const { decryptThenParseFactory } = params;

        return async function decrypt(
            params: {
                decryptor: Decryptor,
                encryptedMessage: Message<"ENCRYPTED">
            }
        ): Promise<Message> {

            const { decryptor, encryptedMessage } = params;

            const decryptThenParse = decryptThenParseFactory(decryptor);

            const message: Message = {
                ...encryptedMessage,
                "text": await decryptThenParse<string>(encryptedMessage.text.encrypted_string)
            } as any;


            if ("sentBy" in encryptedMessage && encryptedMessage.sentBy.who === "OTHER") {

                (message as Message.Outgoing.StatusReportReceived.SentByOther).sentBy = {
                    ...encryptedMessage.sentBy,
                    "email": await decryptThenParse<string>(encryptedMessage.sentBy.email.encrypted_string)
                };

            }

            return message;

        }

    }


    /**
     * 
     * message1  < ( older than )  message2  => -1
     * message1 === message2  => 0
     * message1  >  message2  => 1
     * 
     * Produce an ordering or messages that reflect the 
     * real temporality of a conversation.
     *
     */
    export const compare = (() => {

        const getContextualOrderingTime = (() => {

            const getContextFreeOrderingTime = (message: Message): number | undefined => {

                if (message.direction === "INCOMING") {
                    return message.time;
                }

                if (message.status === "STATUS REPORT RECEIVED") {
                    return message.deliveredTime ?? message.time;
                }

                return undefined;

            };

            return (message: Message, messageComparingAgainst: Message): number => {

                {

                    const t1 = getContextFreeOrderingTime(message);

                    if (t1 !== undefined) {
                        return t1;
                    }

                }

                {

                    const t2 = getContextFreeOrderingTime(messageComparingAgainst);

                    if (t2 !== undefined) {
                        return t2 + 1;
                    }

                }

                return message.time;

            };

        })();

        return (message1: Message, message2: Message): -1 | 0 | 1 => {

            const diff = getContextualOrderingTime(message1, message2) - getContextualOrderingTime(message2, message1);

            return diff !== 0 ? (diff > 0 ? 1 : -1) : 0;

        };

    })();




    export type _Base<E extends EncryptionState = "PLAIN"> = {
        ref: string;
        time: number; /** Represent exact send time for outgoing messages and pdu time for incoming */
        direction: "INCOMING" | "OUTGOING";
        text: Encryptable["string"][E];
    };

    export type Incoming<E extends EncryptionState = "PLAIN"> = Incoming.Text<E> | Incoming.Notification<E>;

    export namespace Incoming {

        export type _Base<E extends EncryptionState = "PLAIN"> = Message._Base<E> & {
            direction: "INCOMING";
            isNotification: boolean;
        };

        export type Text<E extends EncryptionState = "PLAIN"> = _Base<E> & {
            isNotification: false;
        };

        export type Notification<E extends EncryptionState = "PLAIN"> = _Base<E> & {
            isNotification: true;
        };

    }

    export type Outgoing<E extends EncryptionState = "PLAIN"> =
        Outgoing.Pending<E> |
        Outgoing.SendReportReceived<E> |
        Outgoing.StatusReportReceived<E>;

    export namespace Outgoing {

        export type _Base<E extends EncryptionState = "PLAIN"> = Message._Base<E> & {
            direction: "OUTGOING";
            status: "PENDING" | "SEND REPORT RECEIVED" | "STATUS REPORT RECEIVED";
        };

        export type Pending<E extends EncryptionState = "PLAIN"> = _Base<E> & {
            status: "PENDING";
        };

        export type SendReportReceived<E extends EncryptionState = "PLAIN"> = _Base<E> & {
            status: "SEND REPORT RECEIVED";
            isSentSuccessfully: boolean;
        };

        export type StatusReportReceived<E extends EncryptionState = "PLAIN"> =
            StatusReportReceived.SentByUser<E> |
            StatusReportReceived.SentByOther<E>;

        export namespace StatusReportReceived {

            export type _Base<E extends EncryptionState = "PLAIN"> = Outgoing._Base<E> & {
                status: "STATUS REPORT RECEIVED";
                deliveredTime: number | null;
                sentBy: { who: "USER"; } | { who: "OTHER"; email: Encryptable["string"][E]; };
            };

            export type SentByUser<E extends EncryptionState = "PLAIN"> = _Base<E> & {
                sentBy: { who: "USER"; };
            };

            export type SentByOther<E extends EncryptionState = "PLAIN"> = _Base<E> & {
                sentBy: { who: "OTHER"; email: Encryptable["string"][E]; };
            };

        }

    }


}

export type Evts = {
    evtWdChat: NonPostableEvt<{
        wdChat: Chat;
    } & ({
        eventType: "NEW" | "DELETED"
    } | {
        eventType: "UPDATED";
        changes: {
            unreadMessageCount: boolean;
            contactInfos: boolean;
            ordering: boolean;
        }
    })>,
    //NOTE: So far there is not action that will cause message delete 
    //it has been included in anticipation.
    evtWdMessage: NonPostableEvt<{
        wdChat: Chat;
        wdMessage: Message;
    } & ({
        eventType: "NEW" | "DELETED";
    } | {
        eventType: "UPDATED";
        orderingChange: boolean;
    })>;

};









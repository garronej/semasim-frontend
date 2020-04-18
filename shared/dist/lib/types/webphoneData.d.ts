import type { Decryptor } from "crypto-lib";
import type { NonPostableEvt } from "evt";
export declare type EncryptionState = "PLAIN" | "ENCRYPTED";
export declare type Encryptable = {
    "string": {
        "PLAIN": string;
        "ENCRYPTED": {
            encrypted_string: string;
        };
    };
    "number | null": {
        "PLAIN": number | null;
        "ENCRYPTED": {
            encrypted_number_or_null: string;
        };
    };
};
export declare type Chat<E extends EncryptionState = "PLAIN"> = {
    ref: string;
    contactNumber: Encryptable["string"][E];
    contactName: Encryptable["string"][E];
    contactIndexInSim: Encryptable["number | null"][E];
    messages: Message<E>[];
    refOfLastMessageSeen: string | null;
};
export declare namespace Chat {
    function decryptFactory(params: {
        decryptThenParseFactory: typeof import("crypto-lib/dist/async/serializer").decryptThenParseFactory;
    }): (params: {
        decryptor: Decryptor;
        chat: Chat<"ENCRYPTED">;
    }) => Promise<Chat<"PLAIN">>;
    function getUnreadMessagesCount(wdChat: Chat): number;
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
    function compare(chat1: Chat, chat2: Chat): -1 | 0 | 1;
    /** Best guess on previously opened chat: */
    function findLastOpened(wdChats: Chat[]): Chat | undefined;
}
export declare type Message<E extends EncryptionState = "PLAIN"> = Message.Incoming<E> | Message.Outgoing<E>;
export declare namespace Message {
    function decryptFactory(params: {
        decryptThenParseFactory: typeof import("crypto-lib/dist/async/serializer").decryptThenParseFactory;
    }): (params: {
        decryptor: Decryptor;
        encryptedMessage: Message<"ENCRYPTED">;
    }) => Promise<Message<"PLAIN">>;
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
    const compare: (message1: Message<"PLAIN">, message2: Message<"PLAIN">) => 0 | 1 | -1;
    type _Base<E extends EncryptionState = "PLAIN"> = {
        ref: string;
        time: number; /** Represent exact send time for outgoing messages and pdu time for incoming */
        direction: "INCOMING" | "OUTGOING";
        text: Encryptable["string"][E];
    };
    type Incoming<E extends EncryptionState = "PLAIN"> = Incoming.Text<E> | Incoming.Notification<E>;
    namespace Incoming {
        type _Base<E extends EncryptionState = "PLAIN"> = Message._Base<E> & {
            direction: "INCOMING";
            isNotification: boolean;
        };
        type Text<E extends EncryptionState = "PLAIN"> = _Base<E> & {
            isNotification: false;
        };
        type Notification<E extends EncryptionState = "PLAIN"> = _Base<E> & {
            isNotification: true;
        };
    }
    type Outgoing<E extends EncryptionState = "PLAIN"> = Outgoing.Pending<E> | Outgoing.SendReportReceived<E> | Outgoing.StatusReportReceived<E>;
    namespace Outgoing {
        type _Base<E extends EncryptionState = "PLAIN"> = Message._Base<E> & {
            direction: "OUTGOING";
            status: "PENDING" | "SEND REPORT RECEIVED" | "STATUS REPORT RECEIVED";
        };
        type Pending<E extends EncryptionState = "PLAIN"> = _Base<E> & {
            status: "PENDING";
        };
        type SendReportReceived<E extends EncryptionState = "PLAIN"> = _Base<E> & {
            status: "SEND REPORT RECEIVED";
            isSentSuccessfully: boolean;
        };
        type StatusReportReceived<E extends EncryptionState = "PLAIN"> = StatusReportReceived.SentByUser<E> | StatusReportReceived.SentByOther<E>;
        namespace StatusReportReceived {
            type _Base<E extends EncryptionState = "PLAIN"> = Outgoing._Base<E> & {
                status: "STATUS REPORT RECEIVED";
                deliveredTime: number | null;
                sentBy: {
                    who: "USER";
                } | {
                    who: "OTHER";
                    email: Encryptable["string"][E];
                };
            };
            type SentByUser<E extends EncryptionState = "PLAIN"> = _Base<E> & {
                sentBy: {
                    who: "USER";
                };
            };
            type SentByOther<E extends EncryptionState = "PLAIN"> = _Base<E> & {
                sentBy: {
                    who: "OTHER";
                    email: Encryptable["string"][E];
                };
            };
        }
    }
}
export declare type Evts = {
    evtWdChat: NonPostableEvt<{
        wdChat: Chat;
    } & ({
        eventType: "NEW" | "DELETED";
    } | {
        eventType: "UPDATED";
        changes: {
            unreadMessageCount: boolean;
            contactInfos: boolean;
            ordering: boolean;
        };
    })>;
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

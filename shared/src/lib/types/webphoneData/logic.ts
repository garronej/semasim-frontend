export * from "./types";

import * as types from "./types";
import { decryptThenParseFactory } from "crypto-lib/dist/async/serializer";
type Decryptor= import("crypto-lib").Decryptor;
import { isAscendingAlphabeticalOrder } from "../../../tools/isAscendingAlphabeticalOrder";


export async function decryptChat(
    decryptor: Decryptor,
    chat: types.Chat<"ENCRYPTED">
): Promise<types.Chat<"PLAIN">> {

    const decryptThenParse = decryptThenParseFactory(decryptor);

    const [contactNumber, contactName, contactIndexInSim, messages] =
        await Promise.all([
            decryptThenParse<string>(chat.contactNumber.encrypted_string),
            decryptThenParse<string>(chat.contactName.encrypted_string),
            decryptThenParse<number | null>(chat.contactIndexInSim.encrypted_number_or_null),
            Promise.all(
                chat.messages.map(message => decryptMessage(decryptor, message))
            )
        ] as const);

    return { ...chat, contactNumber, contactName, contactIndexInSim, messages };

}

export async function decryptMessage(
    decryptor: Decryptor,
    encryptedMessage: types.Message<"ENCRYPTED">
): Promise<types.Message<"PLAIN">> {

    const decryptThenParse = decryptThenParseFactory(decryptor);

    const message: types.Message<"PLAIN"> = {
        ...encryptedMessage,
        "text": await decryptThenParse<string>(encryptedMessage.text.encrypted_string)
    } as any;


    if ("sentBy" in encryptedMessage && encryptedMessage.sentBy.who === "OTHER") {

        (message as types.Message.Outgoing.StatusReportReceived.SentByOther<"PLAIN">).sentBy = {
            ...encryptedMessage.sentBy,
            "email": await decryptThenParse<string>(encryptedMessage.sentBy.email.encrypted_string)
        };

    }

    return message;

}


/** Best guess on previously opened chat: */
export function getChatWithLatestActivity(
    wdChats: types.Chat<"PLAIN">[]
): types.Chat<"PLAIN"> | undefined {

    //TODO: what if last seen message not loaded.
    const findMessageByIdAndGetTime = (
        wdChat: types.Chat<"PLAIN">,
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

    const findLastMessageSentByUserAndGetTime = (chat: types.Chat<"PLAIN">): number => {

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
    let chat: types.Chat<"PLAIN"> | undefined = undefined;

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
export const compareMessage = (() => {

    const getContextualOrderingTime = (() => {

        const getContextFreeOrderingTime = (message: types.Message<"PLAIN">): number | undefined => {

            if (message.direction === "INCOMING") {
                return message.time;
            }

            if (message.status === "STATUS REPORT RECEIVED") {
                return message.deliveredTime ?? message.time;
            }

            return undefined;

        };

        return (message: types.Message<"PLAIN">, messageComparingAgainst: types.Message<"PLAIN">): number => {

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

    return (message1: types.Message<"PLAIN">, message2: types.Message<"PLAIN">): -1 | 0 | 1 => {

        const diff = getContextualOrderingTime(message1, message2) - getContextualOrderingTime(message2, message1);

        return diff !== 0 ? (diff > 0 ? 1 : -1) : 0;

    };

})();


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
export function compareChat(chat1: types.Chat<"PLAIN">, chat2: types.Chat<"PLAIN">): -1 | 0 | 1 {

    const hasContactName = (chat: types.Chat<"PLAIN">) => chat.contactName !== "";

    const hasMessages = (chat: types.Chat<"PLAIN">) => chat.messages.length !== 0;

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


export function getUnreadMessagesCount(wdChat: types.Chat<"PLAIN">): number {

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


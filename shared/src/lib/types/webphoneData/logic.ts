export * from "./types";

import * as types from "./types";
import * as cryptoLib from "../../../tools/crypto/library";
import { isAscendingAlphabeticalOrder } from "../../../tools/isAscendingAlphabeticalOrder";

export function decryptChat(
    decryptor: cryptoLib.Decryptor,
    chat: types.Chat<"ENCRYPTED">
): types.Chat<"PLAIN"> {

    const decryptThenParse = cryptoLib.decryptThenParseFactory(decryptor);

    return {
        ...chat,
        "contactNumber": decryptThenParse<string>(chat.contactNumber.encrypted_string),
        "contactName": decryptThenParse<string>(chat.contactName.encrypted_string),
        "contactIndexInSim": decryptThenParse<number | null>(chat.contactIndexInSim.encrypted_number_or_null),
        "messages": chat.messages.map(message => decryptMessage(decryptor, message))
    };

}

/** If input message have no id so will the output message */
export function encryptMessage(
    encryptor: cryptoLib.Encryptor,
    message: types.Message<"PLAIN"> | types.NoId<types.Message<"PLAIN">>
): types.Message<"ENCRYPTED"> {

    const stringifyThenEncrypt = cryptoLib.stringifyThenEncryptFactory(encryptor);

    const encryptedMessage: types.Message<"ENCRYPTED"> = {
        ...message,
        "text": { "encrypted_string": stringifyThenEncrypt(message.text) }
    } as any;

    if ("sentBy" in message && message.sentBy.who === "OTHER") {

        (encryptedMessage as types.Message.Outgoing.StatusReportReceived.SentByOther<"ENCRYPTED">).sentBy = {
            ...message.sentBy,
            "email": { "encrypted_string": stringifyThenEncrypt(message.sentBy.email) }
        };

    }

    return encryptedMessage;

}

export function decryptMessage(
    decryptor: cryptoLib.Decryptor,
    encryptedMessage: types.Message<"ENCRYPTED">
): types.Message<"PLAIN"> {

    const decryptThenParse = cryptoLib.decryptThenParseFactory(decryptor);

    const message: types.Message<"PLAIN"> = {
        ...encryptedMessage,
        "text": decryptThenParse(encryptedMessage.text.encrypted_string)
    } as any;

    if ("sentBy" in encryptedMessage && encryptedMessage.sentBy.who === "OTHER") {

        (message as types.Message.Outgoing.StatusReportReceived.SentByOther<"PLAIN">).sentBy = {
            ...encryptedMessage.sentBy,
            "email": decryptThenParse(encryptedMessage.sentBy.email.encrypted_string)
        };

    }

    return message;

}


/** Best guess on previously opened chat: */
export function getChatWithLatestActivity(
    wdInstance: types.Instance<"PLAIN">
): types.Chat<"PLAIN"> | undefined {

    //TODO: what if last seen message not loaded.
    const findMessageByIdAndGetTime = (
        wdChat: types.Chat<"PLAIN">,
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
export function compareMessage(message1: types.Message<"PLAIN">, message2: types.Message<"PLAIN">): -1 | 0 | 1 {

    const getOrderingTime = (message: types.Message<"PLAIN">): number => {

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

            if (wdChat.idOfLastMessageSeen === message.id_) {
                break;
            }

            count++;

        }


    }

    return count;

}


export * from "./types";
import * as types from "./types";
import * as cryptoLib from "crypto-lib";
export declare function decryptChat(decryptor: cryptoLib.Decryptor, chat: types.Chat<"ENCRYPTED">): Promise<types.Chat<"PLAIN">>;
/** If input message have no id so will the output message */
export declare function encryptMessage(encryptor: cryptoLib.Encryptor, message: types.Message<"PLAIN"> | types.NoId<types.Message<"PLAIN">>): Promise<types.Message<"ENCRYPTED">>;
export declare function decryptMessage(decryptor: cryptoLib.Decryptor, encryptedMessage: types.Message<"ENCRYPTED">): Promise<types.Message<"PLAIN">>;
/** Best guess on previously opened chat: */
export declare function getChatWithLatestActivity(wdInstance: types.Instance<"PLAIN">): types.Chat<"PLAIN"> | undefined;
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
export declare function compareMessage(message1: types.Message<"PLAIN">, message2: types.Message<"PLAIN">): -1 | 0 | 1;
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
export declare function compareChat(chat1: types.Chat<"PLAIN">, chat2: types.Chat<"PLAIN">): -1 | 0 | 1;
export declare function getUnreadMessagesCount(wdChat: types.Chat<"PLAIN">): number;

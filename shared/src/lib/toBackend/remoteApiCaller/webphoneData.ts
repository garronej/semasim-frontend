
import { sendRequest } from "./sendRequest";
import * as apiDeclaration from "../../../sip_api_declarations/backendToUa";
import { types as gwTypes } from "../../../gateway/types";
import { phoneNumber } from "phone-number";
import * as types from "../../types/userSim";
import * as wd from "../../types/webphoneData/logic"
import * as cryptoLib from "crypto-lib";


//WebData sync things :

let wdCrypto: ReturnType<typeof setWebDataEncryptorDescriptor.buildWdCrypto>;

/** Must be called prior any wd related API call */
export function setWebDataEncryptorDescriptor(encryptorDecryptor: cryptoLib.EncryptorDecryptor) {

    const { buildWdCrypto } = setWebDataEncryptorDescriptor;

    wdCrypto = buildWdCrypto(encryptorDecryptor);
}

export namespace setWebDataEncryptorDescriptor {

    export const buildWdCrypto = (encryptorDecryptor: cryptoLib.EncryptorDecryptor) => ({
        encryptorDecryptor,
        "stringifyThenEncrypt": cryptoLib.stringifyThenEncryptFactory(encryptorDecryptor),
        "decryptThenParse": cryptoLib.decryptThenParseFactory(encryptorDecryptor)
    });

}


export const getOrCreateWdInstance = (() => {

    const { methodName } = apiDeclaration.getOrCreateInstance;
    type Params = apiDeclaration.getOrCreateInstance.Params;
    type Response = apiDeclaration.getOrCreateInstance.Response;

    async function synchronizeUserSimAndWdInstance(
        userSim: types.UserSim.Usable,
        wdInstance: wd.Instance<"PLAIN">
    ): Promise<void> {

        const wdChatWhoseContactNoLongerInPhonebook = new Set(wdInstance.chats);

        //const phonebook= userSim.phonebook.sort((a,b)=> a.

        for (const contact of userSim.phonebook) {

            const wdChat = wdInstance.chats.find(
                ({ contactNumber }) => phoneNumber.areSame(
                    contactNumber, contact.number_raw
                )
            );

            if (!!wdChat) {

                wdChatWhoseContactNoLongerInPhonebook.delete(wdChat);

                await updateWdChatContactInfos(
                    wdChat,
                    contact.name,
                    contact.mem_index !== undefined ? contact.mem_index : null
                );

            } else {

                await newWdChat(
                    wdInstance,
                    phoneNumber.build(
                        contact.number_raw,
                        userSim.sim.country ? userSim.sim.country.iso : undefined
                    ),
                    contact.name,
                    contact.mem_index !== undefined ? contact.mem_index : null
                );

            }

        }

        for (const wdChat of wdChatWhoseContactNoLongerInPhonebook) {

            await updateWdChatContactInfos(wdChat, "", null);

        }

    }

    return async function (
        userSim: types.UserSim.Usable
    ): Promise<wd.Instance<"PLAIN">> {

        const { imsi } = userSim.sim;

        const { instance_id, chats } = await sendRequest<Params, Response>(
            methodName,
            { imsi }
        );

        const wdInstance: wd.Instance<"PLAIN"> = {
            "id_": instance_id,
            imsi,
            "chats": await Promise.all(
                chats.map(
                    chat => wd.decryptChat(
                        wdCrypto.encryptorDecryptor,
                        chat
                    )
                )
            )
        };

        await synchronizeUserSimAndWdInstance(userSim, wdInstance);

        return wdInstance;

    };

})();


export const newWdChat = (() => {

    const { methodName } = apiDeclaration.newChat;
    type Params = apiDeclaration.newChat.Params;
    type Response = apiDeclaration.newChat.Response;

    return async function (
        wdInstance: wd.Instance<"PLAIN">,
        contactNumber: phoneNumber,
        contactName: string,
        contactIndexInSim: number | null
    ): Promise<wd.Chat<"PLAIN">> {

        const { chat_id } = await sendRequest<Params, Response>(
            methodName,
            await (async () => {

                const [
                    encryptedContactNumber,
                    encryptedContactName,
                    encryptedContactIndexInSim
                ] = await Promise.all(
                    [contactNumber, contactName, contactIndexInSim]
                        .map(v => wdCrypto.stringifyThenEncrypt(v))
                );

                return {
                    "instance_id": wdInstance.id_,
                    "contactNumber": { "encrypted_string": encryptedContactNumber },
                    "contactName": { "encrypted_string": encryptedContactName },
                    "contactIndexInSim": { "encrypted_number_or_null": encryptedContactIndexInSim }
                };

            })()
        );

        const wdChat: wd.Chat<"PLAIN"> = {
            "id_": chat_id,
            contactNumber,
            contactName,
            contactIndexInSim,
            "idOfLastMessageSeen": null,
            "messages": []
        };

        wdInstance.chats.push(wdChat);

        return wdChat;

    }


})();

export const fetchOlderWdMessages = (() => {

    const { methodName } = apiDeclaration.fetchOlderMessages;
    type Params = apiDeclaration.fetchOlderMessages.Params;
    type Response = apiDeclaration.fetchOlderMessages.Response;

    return async function (
        wdChat: wd.Chat<"PLAIN">
    ): Promise<wd.Message<"PLAIN">[]> {

        const lastMessage = wdChat.messages.slice(-1).pop();

        if (!lastMessage) {
            return [];
        }

        const olderThanMessageId = wdChat.messages[0].id_;

        let olderWdMessages = await Promise.all(
            (await sendRequest<Params, Response>(
                methodName,
                {
                    "chat_id": wdChat.id_,
                    olderThanMessageId
                }
            )).map(encryptedOlderMessage =>
                wd.decryptMessage(
                    wdCrypto.encryptorDecryptor,
                    encryptedOlderMessage
                )
            )
        );

        const set = new Set(wdChat.messages.map(({ id_ }) => id_));

        for (let i = olderWdMessages.length - 1; i >= 0; i--) {

            const message = olderWdMessages[i];

            if (set.has(message.id_)) {
                continue;
            }

            wdChat.messages.unshift(message);

        }

        wdChat.messages.sort(wd.compareMessage);

        olderWdMessages = [];

        for (const message of wdChat.messages) {

            if (message.id_ === olderThanMessageId) {
                break;
            }

            olderWdMessages.push(message);

        }

        return olderWdMessages;

    }

})();

/** 
 * 
 * If same as before the request won't be sent 
 * 
 * return true if update was performed
 * 
 * */
export async function updateWdChatIdOfLastMessageSeen(wdChat: wd.Chat<"PLAIN">): Promise<boolean> {

    let message_id: number | undefined = undefined;

    for (let i = wdChat.messages.length - 1; i >= 0; i--) {

        const message = wdChat.messages[i];

        if (
            message.direction === "INCOMING" ||
            (
                message.status === "STATUS REPORT RECEIVED" &&
                message.sentBy.who === "OTHER"
            )
        ) {

            message_id = message.id_;

            break;

        }

    }

    return updateWdChat(
        wdChat,
        { "idOfLastMessageSeen": message_id }
    );

}

/** 
 * 
 * If same as before the request won't be sent 
 * 
 * return true if update was performed
 * 
 * */
export function updateWdChatContactInfos(
    wdChat: wd.Chat<"PLAIN">,
    contactName: string,
    contactIndexInSim: number | null
): Promise<boolean> {

    return updateWdChat(
        wdChat,
        {
            contactName,
            contactIndexInSim
        }
    );

}

const updateWdChat = (() => {

    const { methodName } = apiDeclaration.updateChat;
    type Params = apiDeclaration.updateChat.Params;
    type Response = apiDeclaration.updateChat.Response;

    /** 
     * 
     * If same as before the request won't be sent 
     * 
     * return true if update performed 
     * 
     * */
    return async function (
        wdChat: wd.Chat<"PLAIN">,
        fields: Partial<Pick<wd.Chat<"PLAIN">, "contactName" | "contactIndexInSim" | "idOfLastMessageSeen">>
    ): Promise<boolean> {

        const params: Params = { "chat_id": wdChat.id_ };

        for (const key of Object.keys(fields) as (keyof typeof fields)[]) {

            const value = fields[key];

            if (value === undefined || wdChat[key] === value) {
                continue;
            }

            switch (key) {
                case "contactName":
                    params[key] = {
                        "encrypted_string": await wdCrypto.stringifyThenEncrypt(
                            value as string
                        )
                    };
                    break;
                case "contactIndexInSim":
                    params[key] = {
                        "encrypted_number_or_null": await wdCrypto.stringifyThenEncrypt(
                            value as number | null
                        )
                    };
                    break;
                case "idOfLastMessageSeen":
                    params[key] = value as number;
                    break;
            }


        }

        if (Object.keys(params).length === 1) {
            return false;
        }

        await sendRequest<Params, Response>(
            methodName,
            params
        );

        for (const key in fields) {

            wdChat[key] = fields[key];

        }

        return true;

    };


})();

export const destroyWdChat = (() => {

    const { methodName } = apiDeclaration.destroyChat;
    type Params = apiDeclaration.destroyChat.Params;
    type Response = apiDeclaration.destroyChat.Response;

    return async function (
        wdInstance: wd.Instance<"PLAIN">,
        wdChat: wd.Chat<"PLAIN">
    ): Promise<void> {

        await sendRequest<Params, Response>(
            methodName,
            { "chat_id": wdChat.id_ }
        );

        wdInstance.chats.splice(wdInstance.chats.indexOf(wdChat), 1);

    };

})();



/** Return undefined when the INCOMING message have been received already */
export async function newWdMessage<T extends wd.Message.Outgoing.Pending<"PLAIN">>(
    wdChat: wd.Chat<"PLAIN">,
    message: wd.NoId<T>
): Promise<T>;
export async function newWdMessage<T extends wd.Message.Incoming<"PLAIN"> | wd.Message.Outgoing.StatusReportReceived<"PLAIN">>(
    wdChat: wd.Chat<"PLAIN">,
    message: wd.NoId<T>
): Promise<T | undefined>;
export async function newWdMessage<T extends (
    wd.Message.Incoming<"PLAIN"> |
    wd.Message.Outgoing.Pending<"PLAIN"> |
    wd.Message.Outgoing.StatusReportReceived<"PLAIN">
)>(
    wdChat: wd.Chat<"PLAIN">,
    message_: wd.NoId<T>
): Promise<T | undefined> {

    //NOTE: The type system does not handle it's edge case, need to cast.
    const message:
        wd.NoId<
            wd.Message.Incoming<"PLAIN"> |
            wd.Message.Outgoing.Pending<"PLAIN"> |
            wd.Message.Outgoing.StatusReportReceived<"PLAIN">
        > = message_ as any;

    const isSameWdMessage = (
        wdMessage: wd.Message<"PLAIN">
    ): boolean => {

        const areSame = (o1: Object, o2: Object): boolean => {

            for (const key in o1) {

                const value = o1[key];

                if (value instanceof Object) {

                    if (!areSame(value, o2[key])) {
                        return false;
                    }

                } else {

                    if (value !== o2[key]) {
                        return false;
                    }

                }

            }

            return true;

        };

        return areSame(wdMessage, message_);

    };

    if (!!wdChat.messages.find(isSameWdMessage)) {
        return undefined;
    }


    //TODO: Check if message already in record.

    const { methodName }= apiDeclaration.newMessage;
    type Params = apiDeclaration.newMessage.Params;
    type Response = apiDeclaration.newMessage.Response;

    const { message_id } = await sendRequest<Params, Response>(
        methodName,
        {
            "chat_id": wdChat.id_,
            "message": await wd.encryptMessage(
                wdCrypto.encryptorDecryptor,
                message
            ) as wd.NoId<
                wd.Message.Incoming<"ENCRYPTED"> |
                wd.Message.Outgoing.Pending<"ENCRYPTED"> |
                wd.Message.Outgoing.StatusReportReceived<"ENCRYPTED">
            >
        }
    );

    const wdMessage = ({ ...message, "id_": message_id }) as any;

    wdChat.messages.push(wdMessage);

    wdChat.messages.sort(wd.compareMessage);

    return wdMessage;

}

export function notifyUaFailedToSendMessage(
    wdChat: wd.Chat<"PLAIN">,
    wdMessage: wd.Message.Outgoing.Pending<"PLAIN">
): Promise<wd.Message.Outgoing.SendReportReceived<"PLAIN">> {

    return _notifySendReportReceived(wdChat, wdMessage, false);

}


export function notifySendReportReceived(
    wdChat: wd.Chat<"PLAIN">,
    sendReportBundledData: gwTypes.BundledData.ServerToClient.SendReport
): Promise<wd.Message.Outgoing.SendReportReceived<"PLAIN"> | undefined> {

    const wdMessage: wd.Message.Outgoing.Pending<"PLAIN"> | undefined = (() => {

        for (let i = wdChat.messages.length - 1; i >= 0; i--) {

            const message = wdChat.messages[i];

            if (
                message.direction === "OUTGOING" &&
                message.status === "PENDING" &&
                message.time === sendReportBundledData.messageTowardGsm.dateTime
            ) {

                return message;

            }

        }

        return undefined;

    })();

    if (!wdMessage) {

        return Promise.resolve(undefined);

    }

    const isSentSuccessfully = sendReportBundledData.sendDateTime !== null;

    return _notifySendReportReceived(wdChat, wdMessage, isSentSuccessfully);

}

const _notifySendReportReceived = (() => {

    const { methodName } = apiDeclaration.notifySendReportReceived;
    type Params = apiDeclaration.notifySendReportReceived.Params;
    type Response = apiDeclaration.notifySendReportReceived.Response;

    return async function (
        wdChat: wd.Chat<"PLAIN">,
        wdMessage: wd.Message.Outgoing.Pending<"PLAIN">,
        isSentSuccessfully: boolean
    ): Promise<wd.Message.Outgoing.SendReportReceived<"PLAIN">> {


        await sendRequest<Params, Response>(
            methodName,
            {
                "message_id": wdMessage.id_,
                isSentSuccessfully
            }
        );

        const updatedWdMessage: wd.Message.Outgoing.SendReportReceived<"PLAIN"> = {
            "id_": wdMessage.id_,
            "time": wdMessage.time,
            "direction": "OUTGOING",
            "text": wdMessage.text,
            "status": "SEND REPORT RECEIVED",
            isSentSuccessfully
        };

        wdChat.messages[wdChat.messages.indexOf(wdMessage)] = updatedWdMessage;

        wdChat.messages.sort(wd.compareMessage);

        return updatedWdMessage;

    };

})();


export const notifyStatusReportReceived = (() => {

    const { methodName } = apiDeclaration.notifyStatusReportReceived;
    type Params = apiDeclaration.notifyStatusReportReceived.Params;
    type Response = apiDeclaration.notifyStatusReportReceived.Response;

    /** Assert the status report state that the message was sent from this device. */
    return async function (
        wdChat: wd.Chat<"PLAIN">,
        statusReportBundledData: gwTypes.BundledData.ServerToClient.StatusReport
    ): Promise<wd.Message.Outgoing.StatusReportReceived.SentByUser<"PLAIN"> | undefined> {

        const wdMessage: wd.Message.Outgoing.SendReportReceived<"PLAIN"> | undefined = (() => {

            for (let i = wdChat.messages.length - 1; i >= 0; i--) {

                const message = wdChat.messages[i];

                if (
                    message.direction === "OUTGOING" &&
                    message.status === "SEND REPORT RECEIVED" &&
                    message.time === statusReportBundledData.messageTowardGsm.dateTime
                ) {

                    return message;

                }

            }

            return undefined;

        })();

        if (!wdMessage) {

            return undefined;

        }

        const deliveredTime = statusReportBundledData.statusReport.isDelivered ?
            statusReportBundledData.statusReport.dischargeDateTime : null
            ;


        await sendRequest<Params, Response>(
            methodName,
            {
                "message_id": wdMessage.id_,
                deliveredTime
            }
        );

        const updatedWdMessage: wd.Message.Outgoing.StatusReportReceived.SentByUser<"PLAIN"> = {
            "id_": wdMessage.id_,
            "time": wdMessage.time,
            "direction": "OUTGOING",
            "text": wdMessage.text,
            "sentBy": { "who": "USER" },
            "status": "STATUS REPORT RECEIVED",
            deliveredTime
        };

        wdChat.messages[wdChat.messages.indexOf(wdMessage)] = updatedWdMessage;

        wdChat.messages.sort(wd.compareMessage);

        return updatedWdMessage;

    }

})();


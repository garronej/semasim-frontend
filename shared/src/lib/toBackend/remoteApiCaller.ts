
import * as sipLibrary from "ts-sip";
import { SyncEvent } from "ts-events-extended";
import * as apiDeclaration from "../../sip_api_declarations/backendToUa";
import * as connection from "./connection";
import { types as gwTypes } from "../../gateway";
import { phoneNumber } from "phone-number";
import * as types from "../types";
import wd = types.webphoneData;
import * as dcTypes from "chan-dongle-extended-client/dist/lib/types";


/** Posted when user register a new sim on he's LAN or accept a sharing request */
export const evtUsableSim = new SyncEvent<types.UserSim.Usable>();

//TODO: Fix, it's called two times!!
export const getUsableUserSims = (() => {

    const methodName = apiDeclaration.getUsableUserSims.methodName;
    type Params = apiDeclaration.getUsableUserSims.Params;
    type Response = apiDeclaration.getUsableUserSims.Response;

    let prUsableUserSims: Promise<types.UserSim.Usable[]> | undefined = undefined;

    /** 
     * The stateless argument is used to re fetch the userSim from the server regardless
     * of if it have been done previously already, it will return a new array.
     * If the 'stateless' argument is omitted then the returned value is static. 
     * ( only one request is sent to the server )
     */
    return (stateless: false | "STATELESS" = false): Promise<types.UserSim.Usable[]> => {

        if (!stateless && !!prUsableUserSims) {
            return prUsableUserSims;
        }

        const prUsableUserSims_ =  sendRequest<Params, Response>(
            methodName,
            undefined
        );

        if (!!stateless) {

            return prUsableUserSims_;

        } else {

            prUsableUserSims = prUsableUserSims_;

            return getUsableUserSims();

        }


    };


})();

export const unlockSim = (() => {

    const methodName = apiDeclaration.unlockSim.methodName;
    type Params = apiDeclaration.unlockSim.Params;
    type Response = apiDeclaration.unlockSim.Response;

    return function (
        lockedDongle: dcTypes.Dongle.Locked,
        pin: string
    ): Promise<Response> {

        return sendRequest<Params, Response>(
            methodName,
            { "imei": lockedDongle.imei, pin }
        );

    };

})();

export const registerSim = (() => {

    const methodName = apiDeclaration.registerSim.methodName;
    type Params = apiDeclaration.registerSim.Params;
    type Response = apiDeclaration.registerSim.Response;

    return async function (
        dongle: dcTypes.Dongle.Usable,
        friendlyName: string
    ): Promise<void> {

        const userSim = await sendRequest<Params, Response>(
            methodName,
            {
                "imsi": dongle.sim.imsi,
                "imei": dongle.imei,
                friendlyName
            }
        );

        (await getUsableUserSims()).push(userSim);

        evtUsableSim.post(userSim);

    };

})();

export const unregisterSim = (() => {

    const methodName = apiDeclaration.unregisterSim.methodName;
    type Params = apiDeclaration.unregisterSim.Params;
    type Response = apiDeclaration.unregisterSim.Response;

    return async function (
        userSim: types.UserSim.Usable
    ): Promise<void> {

        await sendRequest<Params, Response>(
            methodName,
            { "imsi": userSim.sim.imsi }
        );

        const usableUserSims = await getUsableUserSims();

        usableUserSims.splice(
            usableUserSims.indexOf(userSim),
            1
        );

    };


})();

export const rebootDongle = (() => {

    const methodName = apiDeclaration.rebootDongle.methodName;
    type Params = apiDeclaration.rebootDongle.Params;
    type Response = apiDeclaration.rebootDongle.Response;

    return function (
        userSim: types.Online<types.UserSim.Usable>
    ): Promise<void> {

        return sendRequest<Params, Response>(
            methodName,
            { "imsi": userSim.sim.imsi }
        );

    };

})();

export const shareSim = (() => {

    const methodName = apiDeclaration.shareSim.methodName;
    type Params = apiDeclaration.shareSim.Params;
    type Response = apiDeclaration.shareSim.Response;

    return async function (
        userSim: types.UserSim.Owned,
        emails: string[],
        message: string
    ): Promise<void> {

        await sendRequest<Params, Response>(
            methodName,
            { "imsi": userSim.sim.imsi, emails, message }
        );

        for (const email of emails) {

            userSim.ownership.sharedWith.notConfirmed.push(email);

        }

    };

})();

export const stopSharingSim = (() => {

    const methodName = apiDeclaration.stopSharingSim.methodName;
    type Params = apiDeclaration.stopSharingSim.Params;
    type Response = apiDeclaration.stopSharingSim.Response;

    return async function (
        userSim: types.UserSim.Owned,
        emails: string[]
    ): Promise<void> {

        await sendRequest<Params, Response>(
            methodName,
            { "imsi": userSim.sim.imsi, emails }
        );

        for (const email of emails) {

            const { notConfirmed, confirmed } = userSim.ownership.sharedWith;

            let arr: string[];
            let index: number;

            index = notConfirmed.indexOf(email);

            if (index > 0) {
                arr = notConfirmed;
            } else {
                index = confirmed.indexOf(email);
                arr = confirmed;
            }

            arr.splice(index, 1);

        }

    };


})();

export const changeSimFriendlyName = (() => {

    const methodName = apiDeclaration.changeSimFriendlyName.methodName;
    type Params = apiDeclaration.changeSimFriendlyName.Params;
    type Response = apiDeclaration.changeSimFriendlyName.Response;

    return async function (
        userSim: types.UserSim.Usable,
        friendlyName: string
    ): Promise<void> {

        await sendRequest<Params, Response>(
            methodName,
            { "imsi": userSim.sim.imsi, friendlyName }
        );

        userSim.friendlyName = friendlyName;

    };

})();

export const acceptSharingRequest = (() => {

    const methodName = apiDeclaration.acceptSharingRequest.methodName;
    type Params = apiDeclaration.acceptSharingRequest.Params;
    type Response = apiDeclaration.acceptSharingRequest.Response;

    return async function (
        notConfirmedUserSim: types.UserSim.Shared.NotConfirmed,
        friendlyName: string
    ): Promise<void> {

        const { password } = await sendRequest<Params, Response>(
            methodName,
            { "imsi": notConfirmedUserSim.sim.imsi, friendlyName }
        );

        const userSim: types.UserSim.Shared.Confirmed = {
            "sim": notConfirmedUserSim.sim,
            friendlyName,
            password,
            "dongle": notConfirmedUserSim.dongle,
            "gatewayLocation": notConfirmedUserSim.gatewayLocation,
            "isOnline": notConfirmedUserSim.isOnline,
            "ownership": {
                "status": "SHARED CONFIRMED",
                "ownerEmail": notConfirmedUserSim.ownership.ownerEmail
            },
            "phonebook": notConfirmedUserSim.phonebook
        };

        (await getUsableUserSims()).push(userSim);

        evtUsableSim.post(userSim);

    };

})();

export const rejectSharingRequest = (() => {

    const methodName = apiDeclaration.rejectSharingRequest.methodName;
    type Params = apiDeclaration.rejectSharingRequest.Params;
    type Response = apiDeclaration.rejectSharingRequest.Response;

    return async function (
        userSim: types.UserSim.Shared.NotConfirmed
    ): Promise<void> {

        await sendRequest<Params, Response>(
            methodName,
            { "imsi": userSim.sim.imsi }
        );

    };

})();

export const createContact = (() => {

    const methodName = apiDeclaration.createContact.methodName;
    type Params = apiDeclaration.createContact.Params;
    type Response = apiDeclaration.createContact.Response;

    return async function (
        userSim: types.UserSim.Usable,
        name: string,
        number: phoneNumber
    ): Promise<types.UserSim.Contact> {


        const resp = await sendRequest<Params, Response>(
            methodName,
            { "imsi": userSim.sim.imsi, name, number }
        );

        const contact: types.UserSim.Contact = {
            "mem_index": !!resp ? resp.mem_index : undefined,
            name,
            "number_raw": number
        };

        userSim.phonebook.push(contact);

        if (!!resp) {

            userSim.sim.storage.contacts.push({
                "index": resp.mem_index,
                name,
                number
            });

            userSim.sim.storage.digest = resp.new_digest;

            userSim.sim.storage.infos.storageLeft--;

        }

        return contact;

    };

})();

export const updateContactName = (() => {

    const methodName = apiDeclaration.updateContactName.methodName;

    /** Assert contact is the ref of the object stored in userSim */
    return async function (
        userSim: types.UserSim.Usable,
        contact: types.UserSim.Contact,
        newName: string
    ): Promise<void> {

        if (contact.mem_index !== undefined) {

            type Params = apiDeclaration.updateContactName.contactInSim.Params;
            type Response = apiDeclaration.updateContactName.contactInSim.Response;

            const {
                name_as_stored_in_sim,
                new_digest
            } = await sendRequest<Params, Response>(
                methodName,
                {
                    "imsi": userSim.sim.imsi,
                    "contactRef": { "mem_index": contact.mem_index },
                    newName
                }
            );

            contact.name = newName;

            userSim
                .sim.storage.contacts.find(({ index }) => index === contact.mem_index)!
                .name = name_as_stored_in_sim;

            userSim.sim.storage.digest = new_digest;

        } else {

            type Params = apiDeclaration.updateContactName.contactNotInSim.Params;
            type Response = apiDeclaration.updateContactName.contactNotInSim.Response;

            await sendRequest<Params, Response>(
                methodName,
                {
                    "imsi": userSim.sim.imsi,
                    "contactRef": { "number": contact.number_raw },
                    newName
                }
            );

            contact.name = newName;

        }

    };

})();

export const deleteContact = (() => {

    const methodName = apiDeclaration.deleteContact.methodName;
    type Params = apiDeclaration.deleteContact.Params;
    type Response = apiDeclaration.deleteContact.Response;

    return async function (
        userSim: types.UserSim.Usable,
        contact: types.UserSim.Contact
    ): Promise<void> {

        const { new_digest } = await sendRequest<Params, Response>(
            methodName,
            {
                "imsi": userSim.sim.imsi,
                "contactRef": contact.mem_index === null ?
                    ({ "mem_index": contact.mem_index }) :
                    ({ "number": contact.number_raw })
            }
        );

        if (contact.mem_index !== null) {

            userSim.sim.storage.contacts.splice(
                userSim.sim.storage.contacts.findIndex(
                    ({ index }) => index === contact.mem_index
                ),
                1
            );

        }

        userSim.phonebook.splice(
            userSim.phonebook.indexOf(contact),
            1
        );

        if (new_digest !== undefined) {

            userSim.sim.storage.digest = new_digest;

        }

    };

})();

//WebData sync things :

export const getUaInstanceIdAndEmail = (() => {

    const methodName = apiDeclaration.getUaInstanceIdAndEmail.methodName;
    type Params = apiDeclaration.getUaInstanceIdAndEmail.Params;
    type Response = apiDeclaration.getUaInstanceIdAndEmail.Response;

    return function (): Promise<{ uaInstanceId: string; email: string; }> {

        return sendRequest<Params, Response>(
            methodName,
            undefined
        );

    };

})();

export const getOrCreateWdInstance = (() => {

    const methodName = apiDeclaration.getOrCreateInstance.methodName;
    type Params = apiDeclaration.getOrCreateInstance.Params;
    type Response = apiDeclaration.getOrCreateInstance.Response;

    async function synchronizeUserSimAndWdInstance(
        userSim: types.UserSim.Usable,
        wdInstance: wd.Instance
    ): Promise<void> {

        const wdChatWhoseContactNoLongerInPhonebook = new Set(wdInstance.chats);

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
    ): Promise<wd.Instance> {

        const { imsi } = userSim.sim;

        const { instance_id, chats } = await sendRequest<Params, Response>(
            methodName,
            { imsi }
        );

        const wdInstance: wd.Instance = {
            "id_": instance_id,
            imsi,
            chats
        };

        await synchronizeUserSimAndWdInstance(userSim, wdInstance);

        return wdInstance;

    };

})();


export const newWdChat = (() => {

    const methodName = apiDeclaration.newChat.methodName;
    type Params = apiDeclaration.newChat.Params;
    type Response = apiDeclaration.newChat.Response;

    return async function (
        wdInstance: wd.Instance,
        contactNumber: phoneNumber,
        contactName: string,
        contactIndexInSim: number | null
    ): Promise<wd.Chat> {

        const { chat_id } = await sendRequest<Params, Response>(
            methodName,
            {
                "instance_id": wdInstance.id_,
                contactNumber,
                contactName,
                contactIndexInSim
            }
        );

        const wdChat: wd.Chat = {
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

    const methodName = apiDeclaration.fetchOlderMessages.methodName;
    type Params = apiDeclaration.fetchOlderMessages.Params;
    type Response = apiDeclaration.fetchOlderMessages.Response;

    return async function (
        wdChat: wd.Chat
    ): Promise<wd.Message[]> {

        const lastMessage = wdChat.messages.slice(-1).pop();

        if (!lastMessage) {
            return [];
        }

        const olderThanMessageId = wdChat.messages[0].id_;

        let olderWdMessages = await sendRequest<Params, Response>(
            methodName,
            {
                "chat_id": wdChat.id_,
                olderThanMessageId
            }
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
export async function updateWdChatIdOfLastMessageSeen(wdChat: wd.Chat): Promise<boolean> {

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
    wdChat: wd.Chat,
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

    const methodName = apiDeclaration.updateChat.methodName;
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
        wdChat: wd.Chat,
        fields: Partial<Pick<wd.Chat, "contactName" | "contactIndexInSim" | "idOfLastMessageSeen">>
    ): Promise<boolean> {

        const params: Params = { "chat_id": wdChat.id_ };

        for (const key in fields) {

            const value = fields[key];

            if (value === undefined || wdChat[key] === value) {
                continue;
            }

            params[key] = value;

        }

        if (Object.keys(params).length === 1) {
            return false;
        }

        await sendRequest<Params, Response>(
            methodName,
            params
        );

        delete params.chat_id;

        for (const key in params) {

            wdChat[key] = params[key];

        }

        return true;

    };


})();

export const destroyWdChat = (() => {

    const methodName = apiDeclaration.destroyChat.methodName;
    type Params = apiDeclaration.destroyChat.Params;
    type Response = apiDeclaration.destroyChat.Response;

    return async function (
        wdInstance: wd.Instance,
        wdChat: wd.Chat
    ): Promise<void> {

        await sendRequest<Params, Response>(
            methodName,
            { "chat_id": wdChat.id_ }
        );

        wdInstance.chats.splice(wdInstance.chats.indexOf(wdChat), 1);

    };

})();



/** Return undefined when the INCOMING message have been received already */
export async function newWdMessage<T extends wd.Message.Outgoing.Pending>(
    wdChat: wd.Chat,
    message: wd.NoId<T>
): Promise<T>;
export async function newWdMessage<T extends wd.Message.Incoming | wd.Message.Outgoing.StatusReportReceived>(
    wdChat: wd.Chat,
    message: wd.NoId<T>
): Promise<T | undefined>;
export async function newWdMessage<T extends (
    wd.Message.Incoming |
    wd.Message.Outgoing.Pending |
    wd.Message.Outgoing.StatusReportReceived
)>(
    wdChat: wd.Chat,
    message_: wd.NoId<T>
): Promise<T | undefined> {

    //NOTE: The type system does not handle it's edge case, need to cast.
    const message:
        wd.NoId<
        wd.Message.Incoming |
        wd.Message.Outgoing.Pending |
        wd.Message.Outgoing.StatusReportReceived
        > = message_ as any;

    const isSameWdMessage = (
        wdMessage: wd.Message
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

    const methodName = apiDeclaration.newMessage.methodName;
    type Params = apiDeclaration.newMessage.Params;
    type Response = apiDeclaration.newMessage.Response;

    const { message_id } = await sendRequest<Params, Response>(
        methodName,
        { "chat_id": wdChat.id_, message }
    );

    const wdMessage = ({ ...message, "id_": message_id }) as any;

    wdChat.messages.push(wdMessage);

    wdChat.messages.sort(wd.compareMessage);

    return wdMessage;

}

export function notifyUaFailedToSendMessage(
    wdChat: wd.Chat,
    wdMessage: wd.Message.Outgoing.Pending
): Promise<wd.Message.Outgoing.SendReportReceived> {

    return _notifySendReportReceived(wdChat, wdMessage, false);

}


export function notifySendReportReceived(
    wdChat: wd.Chat,
    sendReportBundledData: gwTypes.BundledData.ServerToClient.SendReport
): Promise<wd.Message.Outgoing.SendReportReceived | undefined> {

    const wdMessage: wd.Message.Outgoing.Pending | undefined = (() => {

        for (let i = wdChat.messages.length - 1; i >= 0; i--) {

            const message = wdChat.messages[i];

            if (
                message.direction === "OUTGOING" &&
                message.status === "PENDING" &&
                message.time === sendReportBundledData.messageTowardGsm.date.getTime()
            ) {

                return message;

            }

        }

        return undefined;

    })();

    if (!wdMessage) {

        return Promise.resolve(undefined);

    }

    const isSentSuccessfully = sendReportBundledData.sendDate !== null;

    return _notifySendReportReceived(wdChat, wdMessage, isSentSuccessfully);

}

const _notifySendReportReceived = (() => {

    const methodName = apiDeclaration.notifySendReportReceived.methodName;
    type Params = apiDeclaration.notifySendReportReceived.Params;
    type Response = apiDeclaration.notifySendReportReceived.Response;

    return async function (
        wdChat: wd.Chat,
        wdMessage: wd.Message.Outgoing.Pending,
        isSentSuccessfully: boolean
    ): Promise<wd.Message.Outgoing.SendReportReceived> {


        await sendRequest<Params, Response>(
            methodName,
            {
                "message_id": wdMessage.id_,
                isSentSuccessfully
            }
        );

        const updatedWdMessage: wd.Message.Outgoing.SendReportReceived = {
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

    const methodName = apiDeclaration.notifyStatusReportReceived.methodName;
    type Params = apiDeclaration.notifyStatusReportReceived.Params;
    type Response = apiDeclaration.notifyStatusReportReceived.Response;

    /** Assert the status report state that the message was sent from this device. */
    return async function (
        wdChat: wd.Chat,
        statusReportBundledData: gwTypes.BundledData.ServerToClient.StatusReport
    ): Promise<wd.Message.Outgoing.StatusReportReceived.SentByUser | undefined> {

        const wdMessage: wd.Message.Outgoing.SendReportReceived | undefined = (() => {

            for (let i = wdChat.messages.length - 1; i >= 0; i--) {

                const message = wdChat.messages[i];

                if (
                    message.direction === "OUTGOING" &&
                    message.status === "SEND REPORT RECEIVED" &&
                    message.time === statusReportBundledData.messageTowardGsm.date.getTime()
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
            statusReportBundledData.statusReport.dischargeDate.getTime() : null
            ;


        await sendRequest<Params, Response>(
            methodName,
            {
                "message_id": wdMessage.id_,
                deliveredTime
            }
        );

        const updatedWdMessage: wd.Message.Outgoing.StatusReportReceived.SentByUser = {
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


async function sendRequest<Params, Response>(
    methodName: string,
    params: Params,
    retry?: "RETRY"
): Promise<Response> {

    let response;

    try {

        response = sipLibrary.api.client.sendRequest<Params, Response>(
            await connection.get(),
            methodName,
            params,
            { "timeout": 60 * 1000 }
        );

    } catch (error) {

        if (!!retry) {

            return sendRequest<Params, Response>(
                methodName,
                params,
                "RETRY"
            );

        } else {

            throw error;

        }

    }

    return response;

}
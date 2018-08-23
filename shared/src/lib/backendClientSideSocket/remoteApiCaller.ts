
import * as sipLibrary from "ts-sip";
import { SyncEvent } from "ts-events-extended";
import * as apiDeclaration from "../../sip_api_declarations/clientSockets";
import * as store from "./store";
import { phoneNumber } from "../phoneNumber";
import { types as gwTypes } from "../../semasim-gateway";
import * as types from "../types";
import wd = types.webphoneData;
import * as dcTypes from "chan-dongle-extended-client/dist/lib/types";


let usableUserSims: types.UserSim.Usable[] | undefined = undefined;

/** Posted when user register a new sim on he's LAN or accept a sharing request */
export const evtUsableSim= new SyncEvent<types.UserSim.Usable>();

export async function getUsableUserSims(): Promise<types.UserSim.Usable[]> {

    if (!!usableUserSims) {
        return usableUserSims;
    }

    const methodName = apiDeclaration.getUsableUserSims.methodName;
    type Params = apiDeclaration.getUsableUserSims.Params;
    type Response = apiDeclaration.getUsableUserSims.Response;

    usableUserSims = await sendRequest<Params, Response>(
        methodName,
        undefined
    );

    return getUsableUserSims();

}


export function unlockSim( 
    lockedDongle: dcTypes.Dongle.Locked,
    pin: string
): Promise<types.unlockSim_Response> {

    const methodName = apiDeclaration.unlockSim.methodName;
    type Params = apiDeclaration.unlockSim.Params;
    type Response= apiDeclaration.unlockSim.Response;

    return sendRequest<Params, Response>(
        methodName,
        { "imei": lockedDongle.imei, pin }
    );

}

export async function registerSim(
    dongle: dcTypes.Dongle.Usable,
    friendlyName: string
): Promise<void> {

    const methodName = apiDeclaration.registerSim.methodName;
    type Params = apiDeclaration.registerSim.Params;
    type Response = apiDeclaration.registerSim.Response;

    const userSim= await sendRequest<Params, Response>(
        methodName,
        { "imsi": dongle.sim.imsi, friendlyName }
    );

    (await getUsableUserSims()).push(userSim);

    evtUsableSim.post(userSim);

}

export async function unregisterSim(
    userSim: types.UserSim.Usable
): Promise<void> {

    const methodName = apiDeclaration.unregisterSim.methodName;
    type Params = apiDeclaration.unregisterSim.Params;
    type Response = apiDeclaration.unregisterSim.Response;

    await sendRequest<Params, Response>(
        methodName,
        { "imsi": userSim.sim.imsi }
    );

    const usableUserSims= await getUsableUserSims();

    usableUserSims.splice(
        usableUserSims.indexOf(userSim), 
        1
    );

}

export function rebootDongle(
    userSim: types.Online<types.UserSim.Usable>
) {

    const methodName = apiDeclaration.rebootDongle.methodName;
    type Params = apiDeclaration.rebootDongle.Params;
    type Response = apiDeclaration.rebootDongle.Response;

    return sendRequest<Params, Response>(
        methodName,
        { "imsi": userSim.sim.imsi }
    );

}


export async function shareSim(
    userSim: types.UserSim.Owned,
    emails: string[],
    message: string
): Promise<void> {

    const methodName = apiDeclaration.shareSim.methodName;
    type Params = apiDeclaration.shareSim.Params;
    type Response = apiDeclaration.shareSim.Response;

    await sendRequest<Params, Response>(
        methodName,
        { "imsi": userSim.sim.imsi, emails, message }
    );

    for( const email of emails ){

        userSim.ownership.sharedWith.notConfirmed.push(email);

    }

}

export async function stopSharingSim(
    userSim: types.UserSim.Owned,
    emails: string[]
): Promise<void> {

    const methodName = apiDeclaration.stopSharingSim.methodName;
    type Params = apiDeclaration.stopSharingSim.Params;
    type Response = apiDeclaration.stopSharingSim.Response;

    await sendRequest<Params, Response>(
        methodName,
        { "imsi": userSim.sim.imsi, emails }
    );

    for( const email of emails ){

        const { notConfirmed , confirmed } = userSim.ownership.sharedWith;

        let arr: string[];
        let index: number;

        index= notConfirmed.indexOf(email);

        if( index > 0 ){
            arr= notConfirmed;
        }else{
            index= confirmed.indexOf(email);
            arr= confirmed;
        }

        arr.splice(index, 1);

    }

}

export async function changeSimFriendlyName(
    userSim: types.UserSim.Usable,
    friendlyName: string
): Promise<void>{

    const methodName = apiDeclaration.changeSimFriendlyName.methodName;
    type Params = apiDeclaration.changeSimFriendlyName.Params;
    type Response = apiDeclaration.changeSimFriendlyName.Response;

    await sendRequest<Params, Response>(
        methodName,
        { "imsi": userSim.sim.imsi, friendlyName }
    );

    userSim.friendlyName= friendlyName;

};


export async function acceptSharingRequest(
    notConfirmedUserSim: types.UserSim.Shared.NotConfirmed,
    friendlyName: string
):Promise<void> {

    const methodName = apiDeclaration.acceptSharingRequest.methodName;
    type Params = apiDeclaration.acceptSharingRequest.Params;
    type Response = apiDeclaration.acceptSharingRequest.Response;

    const { password }= await sendRequest<Params, Response>(
        methodName,
        { "imsi": notConfirmedUserSim.sim.imsi, friendlyName }
    );

    const userSim: types.UserSim.Shared.Confirmed= {
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

}


export async function rejectSharingRequest(
    userSim: types.UserSim.Shared.NotConfirmed
):Promise<void> {

    const methodName = apiDeclaration.rejectSharingRequest.methodName;
    type Params = apiDeclaration.rejectSharingRequest.Params;
    type Response = apiDeclaration.rejectSharingRequest.Response;

    await sendRequest<Params, Response>(
        methodName,
        { "imsi": userSim.sim.imsi }
    );

}

export async function createContact(
    userSim: types.UserSim.Usable,
    name: string,
    number: phoneNumber
): Promise<types.UserSim.Contact> {

    const methodName = apiDeclaration.createContact.methodName;
    type Params = apiDeclaration.createContact.Params;
    type Response = apiDeclaration.createContact.Response;

    const resp = await sendRequest<Params, Response>(
        methodName,
        { "imsi": userSim.sim.imsi, name, number }
    );

    const contact: types.UserSim.Contact= {
        "mem_index": resp.mem_index !== null ? resp.mem_index : undefined,
        name,
        "number_raw": number,
        "number_local_format": resp.number_local_format
    };

    userSim.phonebook.push(contact);

    if( resp.mem_index !== null ){

        userSim.sim.storage.contacts.push({
            "index": resp.mem_index,
            name,
            number
        });

    }

    return contact;

}

/** Assert contact is the ref of the object stored in userSim */
export async function updateContactName(
    userSim: types.UserSim.Usable,
    contact: types.UserSim.Contact,
    newName: string
): Promise<void> {

    if (contact.mem_index !== undefined) {

        const methodName = apiDeclaration.updateContactName.methodName;
        type Params = apiDeclaration.updateContactName.contactInSim.Params;
        type Response = apiDeclaration.updateContactName.contactInSim.Response;

        const { name_as_stored_in_sim } = await sendRequest<Params, Response>(
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

    } else {

        const methodName = apiDeclaration.updateContactName.methodName;
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

}

export async function deleteContact(
    userSim: types.UserSim.Usable,
    contact: types.UserSim.Contact
): Promise<void> {

    const methodName = apiDeclaration.deleteContact.methodName;
    type Params = apiDeclaration.deleteContact.Params;
    type Response = apiDeclaration.deleteContact.Response;

    await sendRequest<Params, Response>(
        methodName,
        { 
            "imsi": userSim.sim.imsi, 
            "contactRef": contact.mem_index === null ? 
            ({ "mem_index": contact.mem_index }) : ({ "number": contact.number_raw })
        }
    );

}


//WebData sync things :

export function getUaInstanceIdAndEmail(): Promise<{ uaInstanceId: string; email: string; }> {

    const methodName = apiDeclaration.getUaInstanceIdAndEmail.methodName;
    type Params = apiDeclaration.getUaInstanceIdAndEmail.Params;
    type Response = apiDeclaration.getUaInstanceIdAndEmail.Response;

    return sendRequest<Params, Response>(
        methodName,
        undefined
    );

}


export async function getOrCreateWdInstance(
    userSim: types.UserSim.Usable
): Promise<wd.Instance> {

    const methodName = apiDeclaration.getOrCreateInstance.methodName;
    type Params = apiDeclaration.getOrCreateInstance.Params;
    type Response = apiDeclaration.getOrCreateInstance.Response;

    const { imsi } = userSim.sim;

    const { instance_id, chats } = await sendRequest<Params, Response>(
        methodName,
        { imsi }
    );

    const wdInstance: wd.Instance = {
        "id_": instance_id,
        imsi,
        "chats": chats || []
    };

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

    return wdInstance;

}

export async function newWdChat(
    wdInstance: wd.Instance,
    contactNumber: phoneNumber,
    contactName: string,
    contactIndexInSim: number | null
): Promise<wd.Chat> {

    const methodName = apiDeclaration.newChat.methodName;
    type Params = apiDeclaration.newChat.Params;
    type Response = apiDeclaration.newChat.Response;

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

export async function fetchOlderWdMessages(
    wdChat: wd.Chat
): Promise<wd.Message[]> {

    const methodName = apiDeclaration.fetchOlderMessages.methodName;
    type Params = apiDeclaration.fetchOlderMessages.Params;
    type Response = apiDeclaration.fetchOlderMessages.Response;

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

/** 
 * 
 * If same as before the request won't be sent 
 * 
 * return true if update performed 
 * 
 * */
async function updateWdChat(
    wdChat: wd.Chat,
    fields: Partial<Pick<wd.Chat, "contactName" | "contactIndexInSim" | "idOfLastMessageSeen">>
): Promise<boolean> {

    const methodName = apiDeclaration.updateChat.methodName;
    type Params = apiDeclaration.updateChat.Params;
    type Response = apiDeclaration.updateChat.Response;

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

}

export async function destroyWdChat(
    wdInstance: wd.Instance,
    wdChat: wd.Chat
): Promise<void> {

    const methodName = apiDeclaration.destroyChat.methodName;
    type Params = apiDeclaration.destroyChat.Params;
    type Response = apiDeclaration.destroyChat.Response;

    await sendRequest<Params, Response>(
        methodName,
        { "chat_id": wdChat.id_ }
    );

    wdInstance.chats.splice(wdInstance.chats.indexOf(wdChat), 1);

}

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

async function _notifySendReportReceived(
    wdChat: wd.Chat,
    wdMessage: wd.Message.Outgoing.Pending,
    isSentSuccessfully: boolean
): Promise<wd.Message.Outgoing.SendReportReceived> {

    const methodName = apiDeclaration.notifySendReportReceived.methodName;
    type Params = apiDeclaration.notifySendReportReceived.Params;
    type Response = apiDeclaration.notifySendReportReceived.Response;

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

}

/** Warning the status report must state that the message was sent from this device. */
export async function notifyStatusReportReceived(
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

    const methodName = apiDeclaration.notifyStatusReportReceived.methodName;
    type Params = apiDeclaration.notifyStatusReportReceived.Params;
    type Response = apiDeclaration.notifyStatusReportReceived.Response;


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


async function sendRequest<Params, Response>(
    methodName: string,
    params: Params,
    retry?: "RETRY"
): Promise<Response> {

    let response;

    try {

        response = sipLibrary.api.client.sendRequest<Params, Response>(
            await store.get(),
            methodName,
            params,
            { "timeout": 5 * 1000 }
        );

    } catch (error) {

        if (retry) {

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
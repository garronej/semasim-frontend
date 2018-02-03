import { apiClient as api, types } from "../../../api";
import { phoneNumber } from "../../../shared";

export async function fetch(
    usableSims: types.UserSim.Usable[]
): Promise<types.WebphoneData> {

    let webphoneData = await api.webphoneData.fetch();

    let newUserSims = usableSims.filter(
        ({ sim }) => !webphoneData.instances.find( ({ imsi }) => imsi === sim.imsi)
    );

    for (let userSim of newUserSims) {

        let instance = webphoneData.instances.find( ({ imsi }) => imsi === userSim.sim.imsi);

        if (!instance) {

            instance = await api.webphoneData.newInstance(userSim.sim.imsi);

            webphoneData.instances.push(instance);

        }

        for (let simContact of userSim.sim.storage.contacts) {

            if (!instance.chats.find(
                ({ contactNumber }) => phoneNumber.areSame(
                    contactNumber, simContact.number.asStored
                )
            )) {

                instance.chats.push(
                    await api.webphoneData.newChat(
                        instance.id_,
                        phoneNumber.build(
                            simContact.number.asStored,
                            userSim.sim.country ? userSim.sim.country.iso : undefined
                        ),
                        simContact.name.full,
                        true
                    )
                );

            }


        }

    }

    return webphoneData;

}

export async function newChat(
    instance: types.WebphoneData.Instance,
    contactNumber: phoneNumber,
    contactName: string,
    shouldStoreInSim: boolean
): Promise<types.WebphoneData.Chat> {

    if (shouldStoreInSim) {
        //create contact on sim first
        throw new Error("TODO, not implemented");
    }

    let chat = await api.webphoneData.newChat(
        instance.id_,
        contactNumber,
        contactName,
        shouldStoreInSim
    );

    instance.chats.push(chat);

    return chat;

}

export async function deleteChat(
    instance: types.WebphoneData.Instance,
    chat: types.WebphoneData.Chat
): Promise<void> {

    await api.webphoneData.destroyChat(chat.id_);

    instance.chats.splice(instance.chats.indexOf(chat)!, 1);

}

export function getLastSeenChat(
    instance: types.WebphoneData.Instance
): types.WebphoneData.Chat | null {

    let maxLastSeenTime: number = 0;
    let selectedChat: types.WebphoneData.Chat | null = null;

    for (let chat of instance.chats) {

        if (chat.lastSeenTime > maxLastSeenTime) {
            maxLastSeenTime = chat.lastSeenTime;
            selectedChat = chat;
        }

    }

    return selectedChat;

}

export async function updateChat(
    chat: types.WebphoneData.Chat,
    fields: updateChat.Fields
): Promise<void> {

    await api.webphoneData.updateChat(chat.id_, fields);

    for (let key in fields) {

        chat[key] = fields[key];

    }

}

export namespace updateChat {
    export type Fields = Partial<{ lastSeenTime: number; contactName: string; isContactInSim: boolean; }>;
}

export async function newMessage(
    chat: types.WebphoneData.Chat,
    message: types.WebphoneData.Message
): Promise<types.WebphoneData.Message> {

    message = await api.webphoneData.newMessage(chat.id_, message);

    chat.messages.push(message);

    return message;

}

export function getNewerMessageTime(chat: types.WebphoneData.Chat): number {

    if (!chat.messages.length) {
        return 0;
    } else {
        return chat.messages[chat.messages.length - 1].time;
    }

}

export function getNotificationCount(chat: types.WebphoneData.Chat): number {

    let notificationCount = 0;

    let i = chat.messages.length - 1;
    while (chat.messages[i] && chat.messages[i].time > chat.lastSeenTime) {
        notificationCount++;
        i--;
    }

    return notificationCount;

}

export async function updateOutgoingMessageStatus(
    message: types.WebphoneData.Message.Outgoing,
    status: types.WebphoneData.Message.Outgoing["status"]
): Promise<void> {

    await api.webphoneData.updateOutgoingMessageStatus(
        message.id_,
        status
    );

    message.status = status;

}

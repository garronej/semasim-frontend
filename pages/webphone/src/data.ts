import { apiClient as api, types } from "../../../api";
import { phoneNumber } from "../../../shared";
import Wd= types.WebphoneData;

export namespace io {

    //TODO: sort chat by last seen message time
    export async function fetch(
        usableSims: types.UserSim.Usable[]
    ): Promise<Wd> {

        let webphoneData = await api.webphoneData.fetch();

        let newUserSims = usableSims.filter(
            ({ sim }) => !webphoneData.instances.find(({ imsi }) => imsi === sim.imsi)
        );

        for (let userSim of newUserSims) {

            let instance = webphoneData.instances.find(({ imsi }) => imsi === userSim.sim.imsi);

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
        instance: Wd.Instance,
        contactNumber: phoneNumber,
        contactName: string,
        shouldStoreInSim: boolean
    ): Promise<Wd.Chat> {

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
        instance: Wd.Instance,
        chat: Wd.Chat
    ): Promise<void> {

        await api.webphoneData.destroyChat(chat.id_);

        instance.chats.splice(instance.chats.indexOf(chat)!, 1);

    }

    export async function updateChat(
        chat: Wd.Chat,
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

    export async function newMessage<T extends Wd.Message>(
        chat: Wd.Chat,
        message: T
    ): Promise<T> {

        message = await api.webphoneData.newMessage(chat.id_, message);

        let i_ = -1;

        for (let i = chat.messages.length - 1; i >= 0; i--) {

            if (message.time >= chat.messages[i].time) {
                i_ = i;
                break;
            }

        }

        chat.messages.splice(i_ + 1, 0, message);

        return message;

    }

    export async function updateOutgoingMessageStatus(
        message: Wd.Message.Outgoing,
        status: Wd.Message.Outgoing["status"]
    ): Promise<void> {

        await api.webphoneData.updateOutgoingMessageStatus(
            message.id_,
            status
        );

        message.status = status;

    }


}

export namespace read {

    export function lastSeenChat(
        instance: Wd.Instance
    ): Wd.Chat | null {

        let maxLastSeenTime: number = 0;
        let selectedChat: Wd.Chat | null = null;

        for (let chat of instance.chats) {

            if (chat.lastSeenTime > maxLastSeenTime) {
                maxLastSeenTime = chat.lastSeenTime;
                selectedChat = chat;
            }

        }

        return selectedChat;

    }


    export function newerMessageTime(chat: Wd.Chat): number {

        if (!chat.messages.length) {
            return 0;
        } else {
            return chat.messages[chat.messages.length - 1].time;
        }

    }

    export function notificationCount(chat: Wd.Chat): number {

        let notificationCount = 0;

        let i = chat.messages.length - 1;
        while (chat.messages[i] && chat.messages[i].time > chat.lastSeenTime) {

            let message = chat.messages[i];

            if (!(
                message.direction === "OUTGOING" &&
                message.sentBy.who === "MYSELF"
            )) {
                notificationCount++;
            }

            i--;
        }

        return notificationCount;

    }


}

import { apiClient as api, types } from "../../../api";
import { phoneNumber } from "../../../shared";
import Wd= types.WebphoneData;

//TODO: add wd prefix everywhere for the sake of consistency.
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

            for (let chat of instance.chats) {

                const isInPhonebook = !!userSim.phonebook.find(
                    ({ number_raw }) => phoneNumber.areSame(
                        chat.contactNumber, number_raw
                    )
                );

                if (!isInPhonebook) {

                    await updateChat(chat, {
                        "contactName": "",
                        "contactIndexInSim": undefined
                    });

                }

            }

            for (let contact of userSim.phonebook) {

                const chat = instance.chats.find(
                    ({ contactNumber }) => phoneNumber.areSame(
                        contactNumber, contact.number_raw
                    )
                );

                if (!!chat) {

                    const contactName = (contact.name !== chat.contactName)?contact.name:undefined;

                    const contactIndexInSim= (contact.mem_index !== chat.contactIndexInSim)?(contact.mem_index || null):undefined;

                    if (
                        contactName !== undefined || 
                        contactIndexInSim !== undefined
                    ) {

                        await updateChat(chat, { contactName, contactIndexInSim });

                    }

                } else {

                    await newChat(
                        instance,
                        phoneNumber.build(
                            contact.number_raw,
                            userSim.sim.country ? userSim.sim.country.iso : undefined
                        ),
                        contact.name,
                        contact.mem_index || null
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
        contactIndexInSim: number | null
    ): Promise<Wd.Chat> {

        const chat = await api.webphoneData.newChat(
            instance.id_,
            contactNumber,
            contactName,
            contactIndexInSim
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
        export type Fields = Partial<{ lastSeenTime: number; contactName: string; contactIndexInSim: number | null; }>;
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

    export async function updateOutgoingMessageStatusToSendReportReceived(
        message: Wd.Message.Outgoing.TransmittedToGateway,
        dongleSendTime: number | null
    ): Promise<void> {

        await api.webphoneData.updateOutgoingMessageStatusToSendReportReceived(
            message.id_,
            dongleSendTime
        );


        let updatedMessage: Wd.Message.Outgoing.SendReportReceived = message as any;

        updatedMessage.status = "SEND REPORT RECEIVED";
        updatedMessage.dongleSendTime = dongleSendTime;

    }

    export async function updateOutgoingMessageStatusToStatusReportReceived(
        message: Wd.Message.Outgoing.SendReportReceived,
        deliveredTime: number | null
    ): Promise<void> {

        await api.webphoneData.updateOutgoingMessageStatusToStatusReportReceived(
            message.id_,
            deliveredTime
        );

        let updatedMessage: Wd.Message.Outgoing.StatusReportReceived = message as any;

        updatedMessage.status = "STATUS REPORT RECEIVED";
        updatedMessage.deliveredTime = deliveredTime;

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

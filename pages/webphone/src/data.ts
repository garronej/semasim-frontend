import { apiClient as api, types } from "../../../api";
import { phoneNumber } from "../../../shared";
import Wd= types.WebphoneData;

export namespace io {

    export async function fetch(
        usableSims: types.UserSim.Usable[]
    ): Promise<Wd> {

        const webphoneData = await api.webphoneData.fetch();

        for (let userSim of usableSims) {

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
                        "contactIndexInSim": null
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
        wdInstance: Wd.Instance,
        contactNumber: phoneNumber,
        contactName: string,
        contactIndexInSim: number | null
    ): Promise<Wd.Chat> {

        const wdChat = await api.webphoneData.newChat(
            wdInstance.id_,
            contactNumber,
            contactName,
            contactIndexInSim
        );

        wdInstance.chats.push(wdChat);

        return wdChat;

    }

    export async function deleteChat(
        wdInstance: Wd.Instance,
        wdChat: Wd.Chat
    ): Promise<void> {

        await api.webphoneData.destroyChat(wdChat.id_);

        wdInstance.chats.splice(wdInstance.chats.indexOf(wdChat)!, 1);

    }

    export async function updateChat(
        wdChat: Wd.Chat,
        fields: updateChat.Fields
    ): Promise<void> {

        await api.webphoneData.updateChat(wdChat.id_, fields);

        for (let key in fields) {

            wdChat[key] = fields[key];

        }

    }

    export namespace updateChat {
        export type Fields = Partial<{ lastSeenTime: number; contactName: string; contactIndexInSim: number | null; }>;
    }

    /** 
     * Require wdMessage.id_ set to NaN
     * When resolve id_ is set and wdMessage inserted in wdChat.message
     * at a position determined by wdMessage.time
     * 
     * Resolve with "SKIPPED" if it was an INCOMING message 
     * or StatusReportReceived sent by other
     * and it was already recorded. ( case when GW did not received
     * the SIP OK but the query was done on remote DB. )
     *
     */
    export async function newMessage(
        wdChat: Wd.Chat,
        wdMessage: Wd.Message
    ): Promise<undefined | "SKIPPED"> {

        //NEED check only if direction INCOMING hard

        let i_ = -1;

        for (let i = wdChat.messages.length - 1; i >= 0; i--) {

            const wdMessage_i = wdChat.messages[i];

            const diff = wdMessage.time - wdMessage_i.time;

            if (
                diff === 0 && (
                    wdMessage.direction === "INCOMING" &&
                    wdMessage_i.direction === wdMessage.direction &&
                    wdMessage_i.isNotification === wdMessage.isNotification &&
                    wdMessage_i.text === wdMessage.text
                ) || (
                    wdMessage.direction === "OUTGOING" &&
                    wdMessage.status === "STATUS REPORT RECEIVED" &&
                    wdMessage.sentBy.who === "OTHER" &&
                    wdMessage_i.direction === wdMessage.direction &&
                    wdMessage_i.status === wdMessage.status &&
                    wdMessage_i.sentBy.who === wdMessage.sentBy.who &&
                    wdMessage_i.sentBy["email"] === wdMessage.sentBy["email"] &&
                    wdMessage_i.text === wdMessage.text
                )
            ) {

                console.log("Message already in record, SKIPPING", wdMessage);

                return "SKIPPED";

            }

            if (diff >= 0) {

                i_ = i;
                break;

            }


        }

        wdMessage.id_ = await api.webphoneData.newMessage(wdChat.id_, wdMessage);

        wdChat.messages.splice(i_ + 1, 0, wdMessage);

        return undefined;

    }

    /** 
     * 
     * When resolve wdMessage is Wd.Message.Outgoing.SendReportReceived 
     * 
     * Resolve with "SKIPPED" we already received the send report
     * 
     * */
    export async function updateOutgoingMessageStatusToSendReportReceived(
        wdMessage: Wd.Message.Outgoing.TransmittedToGateway,
        dongleSendTime: number | null
    ): Promise<undefined | "SKIPPED"> {

        const castedMessage: Wd.Message.Outgoing.SendReportReceived = wdMessage as any;

        if (
            castedMessage.status === "SEND REPORT RECEIVED" &&
            castedMessage.dongleSendTime === dongleSendTime
        ) {

            console.log("Send report already received, SKIPPING", wdMessage);

            return "SKIPPED";

        }

        await api.webphoneData.updateOutgoingMessageStatusToSendReportReceived(
            wdMessage.id_,
            dongleSendTime
        );


        castedMessage.status = "SEND REPORT RECEIVED";
        castedMessage.dongleSendTime = dongleSendTime;

        return undefined;

    }

    /** 
     * 
     * When resolve wdMessage is Wd.Message.Outgoing.StatusReportReceived
     * 
     * Resolve with "SKIPPED" we already received the status report.
     * 
     * */
    export async function updateOutgoingMessageStatusToStatusReportReceived(
        wdMessage: Wd.Message.Outgoing.SendReportReceived,
        deliveredTime: number | null
    ): Promise<undefined | "SKIPPED"> {

        //Need check easy

        const castedMessage: Wd.Message.Outgoing.StatusReportReceived = wdMessage as any;

        if (
            castedMessage.status === "STATUS REPORT RECEIVED" &&
            castedMessage.deliveredTime === deliveredTime
        ) {

            console.log("Status report already received skipping", wdMessage);

            return "SKIPPED";

        }

        await api.webphoneData.updateOutgoingMessageStatusToStatusReportReceived(
            wdMessage.id_,
            deliveredTime
        );

        castedMessage.status = "STATUS REPORT RECEIVED";
        castedMessage.deliveredTime = deliveredTime;

        return undefined;

    }

}

export namespace read {

    export function lastSeenChat(
        wdInstance: Wd.Instance
    ): Wd.Chat | null {

        let maxLastSeenTime: number = 0;
        let selectedChat: Wd.Chat | null = null;

        for (let chat of wdInstance.chats) {

            if (chat.lastSeenTime > maxLastSeenTime) {
                maxLastSeenTime = chat.lastSeenTime;
                selectedChat = chat;
            }

        }

        return selectedChat;

    }


    export function newerMessageTime(wdChat: Wd.Chat): number {

        if (!wdChat.messages.length) {
            return 0;
        } else {
            return wdChat.messages[wdChat.messages.length - 1].time;
        }

    }

    export function notificationCount(wdChat: Wd.Chat): number {

        let notificationCount = 0;

        let i = wdChat.messages.length - 1;
        while (wdChat.messages[i] && wdChat.messages[i].time > wdChat.lastSeenTime) {

            let message = wdChat.messages[i];

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

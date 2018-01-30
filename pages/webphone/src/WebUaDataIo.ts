import { client as api, declaration } from "../../../api";
import Types = declaration.Types;


export type WebUaData = {
    instanceId: string;
    instances: WebUaData.InstanceData[]
};

export namespace WebUaData {

    export type InstanceData = {
        userSim: Types.UserSim.Usable;
        contacts: Contact[];
    }

    export type Contact = {
        number: { e164: string; prettyPrint: string; },
        name: string | undefined;
        notificationCount: number;
        timestamp: number;
        messages: Message[];
        isSelected: boolean;
        isStoredInSim: boolean;
    };

    export type Message = Message.Incoming | Message.Outgoing;

    export namespace Message {

        export type Incoming = {
            date: Date;
            direction: "INCOMING";
            isNotification: boolean;
            text: string;
        };

        export type Outgoing = {
            date: Date;
            direction: "OUTGOING";
            sentBy: { who: "MYSELF"; } | { who: "OTHER"; email: string; }
            text: string;
            status: "TRANSMITTED TO BACKEND" | "SENT BY DONGLE" | "RECEIVED"
        };

    }




}


export namespace WebUaData {

    export type Conversation = {
        contactName: string | undefined;
        contactNumber: string;
        notifications: number;
        messages: Conversation.Message[];
    }

    export namespace Conversation {

        export type Message = Message.Incoming | Message.Outgoing;

        export namespace Message {

            export type Incoming = {
                date: Date;
                direction: "INCOMING";
                isNotification: boolean;
                text: string;
            };

            export type Outgoing = {
                date: Date;
                direction: "OUTGOING";
                sentBy: { who: "MYSELF"; } | { who: "OTHER"; email: string; }
                text: string;
                status: "TRANSMITTED TO BACKEND" | "SENT BY DONGLE" | "RECEIVED"
            };

        }

    }



}



export type WebUaData_ = {
    userSim: Types.UserSim.Usable;
    instanceId: string;
    contacts: {
        number: string;
        name: string | undefined;
        isStoredInSim: boolean;
        timestamp: number;
        notificationsCount: number;


    }[]
}[];

export class WebUaDataIo {

    private static instance: WebUaDataIo | undefined = undefined;

    public static hasInstance(): boolean {
        return !!this.instance;
    }

    public static getInstance(
    ): WebUaDataIo {

        if (this.instance) {
            return this.instance;
        }

        this.instance = new this();

        return this.instance;

    }

    public readonly initialization: Promise<void>;

    private constructor() {

        this.initialization = (async () => {

            this.value = await api.fetchWebUaData();

        })();


    }

    public value: Types.WebUaData;

    public async insertConversation(
        imsi: string,
        conversation: Types.WebUaData.Conversation
    ) {

        this.value[imsi].push(conversation);

        await api.pushWebUaData(this.value);

    }

    public async resetConversationNotifications(
        conversation: Types.WebUaData.Conversation
    ) {

        conversation.notifications = 0;

        await api.pushWebUaData(this.value);

    }

    public async insertMessage(
        conversation: Types.WebUaData.Conversation,
        message: Types.WebUaData.Conversation.Message
    ) {

        conversation.messages.push(message);

        await api.pushWebUaData(this.value);

    }

}
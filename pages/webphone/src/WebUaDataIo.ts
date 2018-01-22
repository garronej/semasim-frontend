import { client as api, declaration } from "../../../api";
import Types= declaration.Types;

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
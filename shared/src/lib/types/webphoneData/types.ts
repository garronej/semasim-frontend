
export type EncryptionState = "PLAIN" | "ENCRYPTED";

export type Encryptable = {
    "string": {
        "PLAIN": string;
        "ENCRYPTED": { encrypted_string: string; };
    };
    "number | null": {
        "PLAIN": number | null;
        "ENCRYPTED": { encrypted_number_or_null: string; };
    }
};

export type Instance<E extends EncryptionState> = {
    id_: number;
    imsi: string;
    chats: Chat<E>[];
};

export type Chat<E extends EncryptionState> = {
    id_: number;
    contactNumber: Encryptable["string"][E]; /* type phoneNumber */
    contactName: Encryptable["string"][E];
    contactIndexInSim: Encryptable["number | null"][E]; //TODO: Should be encrypted somehow
    messages: Message<E>[];
    idOfLastMessageSeen: number | null; /* id_ of last message not send by user */
};

export type Message<E extends EncryptionState> = Message.Incoming<E> | Message.Outgoing<E>;

export namespace Message {

    export type _Base<E extends EncryptionState> = {
        id_: number;
        time: number;
        direction: "INCOMING" | "OUTGOING";
        text: Encryptable["string"][E];
    };

    export type Incoming<E extends EncryptionState> = Incoming.Text<E> | Incoming.Notification<E>;

    export namespace Incoming {

        export type _Base<E extends EncryptionState> = Message._Base<E> & {
            direction: "INCOMING";
            isNotification: boolean;
        };

        export type Text<E extends EncryptionState> = _Base<E> & {
            isNotification: false;
        };

        export type Notification<E extends EncryptionState> = _Base<E> & {
            isNotification: true;
        };

    }

    export type Outgoing<E extends EncryptionState> =
        Outgoing.Pending<E> |
        Outgoing.SendReportReceived<E> |
        Outgoing.StatusReportReceived<E>;

    export namespace Outgoing {

        export type _Base<E extends EncryptionState> = Message._Base<E> & {
            direction: "OUTGOING";
            status: "PENDING" | "SEND REPORT RECEIVED" | "STATUS REPORT RECEIVED";
        };

        export type Pending<E extends EncryptionState> = _Base<E> & {
            status: "PENDING";
        };

        export type SendReportReceived<E extends EncryptionState> = _Base<E> & {
            status: "SEND REPORT RECEIVED";
            isSentSuccessfully: boolean;
        };

        export type StatusReportReceived<E extends EncryptionState> =
            StatusReportReceived.SentByUser<E> |
            StatusReportReceived.SentByOther<E>;

        export namespace StatusReportReceived {

            export type _Base<E extends EncryptionState> = Outgoing._Base<E> & {
                status: "STATUS REPORT RECEIVED";
                deliveredTime: number | null;
                sentBy: { who: "USER"; } | { who: "OTHER"; email: Encryptable["string"][E]; };
            };

            export type SentByUser<E extends EncryptionState> = _Base<E> & {
                sentBy: { who: "USER"; };
            };

            export type SentByOther<E extends EncryptionState> = _Base<E> & {
                sentBy: { who: "OTHER"; email: Encryptable["string"][E]; };
            };

        }

    }


}

export type NoId<T extends Message<any>> = Pick<T, Exclude<keyof T, "id_">>;

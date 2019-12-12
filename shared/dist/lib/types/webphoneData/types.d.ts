export declare type EncryptionState = "PLAIN" | "ENCRYPTED";
export declare type Encryptable = {
    "string": {
        "PLAIN": string;
        "ENCRYPTED": {
            encrypted_string: string;
        };
    };
    "number | null": {
        "PLAIN": number | null;
        "ENCRYPTED": {
            encrypted_number_or_null: string;
        };
    };
};
export declare type Chat<E extends EncryptionState> = {
    ref: string;
    contactNumber: Encryptable["string"][E];
    contactName: Encryptable["string"][E];
    contactIndexInSim: Encryptable["number | null"][E];
    messages: Message<E>[];
    refOfLastMessageSeen: string | null;
};
export declare type Message<E extends EncryptionState> = Message.Incoming<E> | Message.Outgoing<E>;
export declare namespace Message {
    type _Base<E extends EncryptionState> = {
        ref: string;
        time: number; /** Represent exact send time for outgoing messages and pdu time for incoming */
        direction: "INCOMING" | "OUTGOING";
        text: Encryptable["string"][E];
    };
    type Incoming<E extends EncryptionState> = Incoming.Text<E> | Incoming.Notification<E>;
    namespace Incoming {
        type _Base<E extends EncryptionState> = Message._Base<E> & {
            direction: "INCOMING";
            isNotification: boolean;
        };
        type Text<E extends EncryptionState> = _Base<E> & {
            isNotification: false;
        };
        type Notification<E extends EncryptionState> = _Base<E> & {
            isNotification: true;
        };
    }
    type Outgoing<E extends EncryptionState> = Outgoing.Pending<E> | Outgoing.SendReportReceived<E> | Outgoing.StatusReportReceived<E>;
    namespace Outgoing {
        type _Base<E extends EncryptionState> = Message._Base<E> & {
            direction: "OUTGOING";
            status: "PENDING" | "SEND REPORT RECEIVED" | "STATUS REPORT RECEIVED";
        };
        type Pending<E extends EncryptionState> = _Base<E> & {
            status: "PENDING";
        };
        type SendReportReceived<E extends EncryptionState> = _Base<E> & {
            status: "SEND REPORT RECEIVED";
            isSentSuccessfully: boolean;
        };
        type StatusReportReceived<E extends EncryptionState> = StatusReportReceived.SentByUser<E> | StatusReportReceived.SentByOther<E>;
        namespace StatusReportReceived {
            type _Base<E extends EncryptionState> = Outgoing._Base<E> & {
                status: "STATUS REPORT RECEIVED";
                deliveredTime: number | null;
                sentBy: {
                    who: "USER";
                } | {
                    who: "OTHER";
                    email: Encryptable["string"][E];
                };
            };
            type SentByUser<E extends EncryptionState> = _Base<E> & {
                sentBy: {
                    who: "USER";
                };
            };
            type SentByOther<E extends EncryptionState> = _Base<E> & {
                sentBy: {
                    who: "OTHER";
                    email: Encryptable["string"][E];
                };
            };
        }
    }
}
export declare type NoId<T extends Message<any>> = Pick<T, Exclude<keyof T, "id_">>;

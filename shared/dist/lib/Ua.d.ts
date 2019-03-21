import { SyncEvent } from "ts-events-extended";
import { types as gwTypes } from "../gateway";
declare type phoneNumber = import("phone-number").phoneNumber;
export declare class Ua {
    static email: string;
    static instanceId: string;
    /** Must be called in webphone.ts */
    static setUaInstanceId(uaInstanceId: string, email: string): void;
    /** post isRegistered */
    readonly evtRegistrationStateChanged: SyncEvent<boolean>;
    private readonly jsSipUa;
    private evtRingback;
    private readonly jsSipSocket;
    constructor(imsi: string, sipPassword: string, disabledMessage?: false | "DISABLE MESSAGES");
    isRegistered: boolean;
    register(): void;
    /**
     * Do not actually send a REGISTER expire=0.
     * Assert no packet will arrive to this UA until next register.
     * */
    unregister(): void;
    readonly evtIncomingMessage: SyncEvent<{
        fromNumber: string;
        bundledData: gwTypes.BundledData.ServerToClient.Message | gwTypes.BundledData.ServerToClient.MmsNotification | gwTypes.BundledData.ServerToClient.SendReport | gwTypes.BundledData.ServerToClient.StatusReport | gwTypes.BundledData.ServerToClient.MissedCall | gwTypes.BundledData.ServerToClient.CallAnsweredBy;
        text: string;
        onProcessed: () => void;
    }>;
    private onMessage;
    private postEvtIncomingMessage;
    sendMessage(number: phoneNumber, text: string, exactSendDate: Date, appendPromotionalMessage: boolean): Promise<void>;
    /** return exactSendDate to match with sendReport and statusReport */
    readonly evtIncomingCall: SyncEvent<{
        fromNumber: string;
        terminate(): void;
        prTerminated: Promise<void>;
        onAccepted(): Promise<{
            state: "ESTABLISHED";
            sendDtmf(signal: Ua.DtmFSignal, duration: number): void;
        }>;
    }>;
    private onIncomingCall;
    placeOutgoingCall(number: phoneNumber): Promise<{
        terminate(): void;
        prTerminated: Promise<void>;
        prNextState: Promise<{
            state: "RINGBACK";
            prNextState: Promise<{
                state: "ESTABLISHED";
                sendDtmf(signal: Ua.DtmFSignal, duration: number): void;
            }>;
        }>;
    }>;
}
export declare namespace Ua {
    type DtmFSignal = "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "*" | "#";
}
export {};

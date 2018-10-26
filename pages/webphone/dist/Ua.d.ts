import { SyncEvent } from "ts-events-extended";
import { phoneNumber } from "phone-number";
import * as types from "../../../shared/dist/lib/types";
import { types as gwTypes } from "../../../shared/dist/gateway";
export declare class Ua {
    readonly userSim: types.UserSim.Usable;
    static email: string;
    static instanceId: string;
    /** Must be called in webphone.ts */
    static init(): Promise<void>;
    /** post isRegistered */
    readonly evtRegistrationStateChanged: SyncEvent<boolean>;
    private readonly jsSipUa;
    private evtRingback;
    private readonly jsSipSocket;
    constructor(userSim: types.UserSim.Usable);
    isRegistered: boolean;
    register(): void;
    /**
     * Do not actually send a REGISTER expire=0.
     * Assert no packet will arrive to this UA until next register.
     * */
    unregister(): void;
    readonly evtIncomingMessage: SyncEvent<{
        fromNumber: string;
        bundledData: gwTypes.BundledData.ServerToClient.Message | gwTypes.BundledData.ServerToClient.SendReport | gwTypes.BundledData.ServerToClient.StatusReport | gwTypes.BundledData.ServerToClient.MissedCall | gwTypes.BundledData.ServerToClient.CallAnsweredBy;
        text: string;
        onProcessed: () => void;
    }>;
    private onMessage;
    private postEvtIncomingMessage;
    sendMessage(number: phoneNumber, text: string, exactSendDate: Date): Promise<void>;
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
    placeOutgoingCall(number: phoneNumber): {
        terminate(): void;
        prTerminated: Promise<void>;
        prNextState: Promise<{
            state: "RINGBACK";
            prNextState: Promise<{
                state: "ESTABLISHED";
                sendDtmf(signal: Ua.DtmFSignal, duration: number): void;
            }>;
        }>;
    };
    /** convert raw number in phoneNumber */
    private toPhoneNumber;
}
export declare namespace Ua {
    type DtmFSignal = "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "*" | "#";
}

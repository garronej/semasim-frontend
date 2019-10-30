import { SyncEvent } from "ts-events-extended";
import { types as gwTypes } from "../gateway/types";
import * as cryptoLib from "crypto-lib/dist/sync/types";
declare type phoneNumber = import("phone-number/dist/lib").phoneNumber;
export declare class Ua {
    private readonly towardSimEncryptor;
    static staticParams: {
        ua: Omit<gwTypes.Ua, "platform">;
        towardUserDecryptor: cryptoLib.Decryptor;
    };
    /** Must be set before using the constructor  */
    static staticInitialization(staticParams: typeof Ua.staticParams): void;
    /** post isRegistered */
    readonly evtRegistrationStateChanged: SyncEvent<boolean>;
    private readonly jsSipUa;
    private evtRingback;
    private readonly jsSipSocket;
    /** Assert staticInitialization have been called */
    constructor(imsi: string, sipPassword: string, towardSimEncryptor: cryptoLib.Encryptor);
    isRegistered: boolean;
    register(): void;
    /** To call when we know that the UA is no longer registered,
     * no REGISTER expired 0 will be send
     *
     * It is to use when we receive a notification that that the
     * sim is no longer reachable. In this case the proxy will ditch
     * the route to the gateway so the sip packet we sent can no longer
     * be routed to the gateway.
     * */
    deFactoUnregistered(): void;
    unregister(): void;
    readonly evtIncomingMessage: SyncEvent<{
        fromNumber: string;
        bundledData: gwTypes.BundledData.ServerToClient.Message | gwTypes.BundledData.ServerToClient.MmsNotification | gwTypes.BundledData.ServerToClient.SendReport | gwTypes.BundledData.ServerToClient.StatusReport | gwTypes.BundledData.ServerToClient.MissedCall | gwTypes.BundledData.ServerToClient.FromSipCallSummary | gwTypes.BundledData.ServerToClient.CallAnsweredBy | gwTypes.BundledData.ServerToClient.ConversationCheckedOutFromOtherUa;
        onProcessed: () => void;
    }>;
    private onMessage;
    private postEvtIncomingMessage;
    sendMessage(number: phoneNumber, bundledData: gwTypes.BundledData.ClientToServer): Promise<void>;
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

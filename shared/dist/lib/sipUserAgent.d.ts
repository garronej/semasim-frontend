import { SyncEvent, VoidSyncEvent } from "ts-events-extended";
import { types as gwTypes } from "../gateway/types";
import * as sip from "ts-sip";
declare type phoneNumber = import("phone-number/dist/lib").phoneNumber;
declare type Encryptor = import("./crypto/cryptoLibProxy").Encryptor;
declare type Decryptor = import("./crypto/cryptoLibProxy").Decryptor;
declare type AsyncReturnType<T extends (...args: any) => Promise<any>> = T extends (...args: any) => Promise<infer R> ? R : any;
declare type ParamsNeededToInstantiateUa = AsyncReturnType<typeof import("./crypto/appCryptoSetupHelper")["appCryptoSetupHelper"]>["paramsNeededToInstantiateUa"];
declare type ConnectionApi = {
    url: string;
    evtConnect: SyncEvent<sip.Socket>;
    get: () => Promise<sip.Socket> | sip.Socket;
};
export declare type DtmFSignal = "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "*" | "#";
export declare function sipUserAgentCreateFactory(params: {
    email: string;
    uaInstanceId: string;
    cryptoRelatedParams: ParamsNeededToInstantiateUa;
    pushNotificationToken: string;
    connection: ConnectionApi;
    appEvts: import("./toBackend/appEvts").SubsetOfAppEvts<"evtSimPasswordChanged" | "evtSimPermissionLost" | "evtSimReachabilityStatusChange" | "rtcIceEServer">;
}): (usableUserSim: {
    sim: {
        imsi: string;
    };
    password: string;
    towardSimEncryptKeyStr: string;
}) => SipUserAgent;
declare class SipUserAgent {
    private readonly towardUserDecryptor;
    private getRtcIceServer;
    private readonly jsSipSocket;
    private readonly towardSimEncryptor;
    /** post isRegistered */
    readonly evtRegistrationStateChange: SyncEvent<boolean>;
    private readonly jsSipUa;
    private evtRingback;
    constructor(uaDescriptor: gwTypes.Ua, towardUserDecryptor: Decryptor, getRtcIceServer: () => Promise<RTCIceServer>, evtUnregisteredByGateway: VoidSyncEvent, jsSipSocket: JsSipSocket, imsi: string, sipPassword: string, towardSimEncryptor: Encryptor);
    isRegistered: boolean;
    register(): void;
    readonly evtIncomingMessage: SyncEvent<{
        fromNumber: string;
        bundledData: gwTypes.BundledData.ServerToClient.Message | gwTypes.BundledData.ServerToClient.MmsNotification | gwTypes.BundledData.ServerToClient.SendReport | gwTypes.BundledData.ServerToClient.StatusReport | gwTypes.BundledData.ServerToClient.MissedCall | gwTypes.BundledData.ServerToClient.FromSipCallSummary | gwTypes.BundledData.ServerToClient.CallAnsweredBy;
        handlerCb: () => void;
    }>;
    private onMessage;
    private postEvtIncomingMessage;
    sendMessage(number: phoneNumber, bundledData: gwTypes.BundledData.ClientToServer): Promise<void>;
    readonly evtIncomingCall: SyncEvent<{
        fromNumber: string;
        terminate(): void;
        prTerminated: Promise<void>;
        onAccepted(): Promise<{
            state: "ESTABLISHED";
            sendDtmf(signal: DtmFSignal, duration: number): void;
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
                sendDtmf(signal: DtmFSignal, duration: number): void;
            }>;
        }>;
    }>;
}
/** The socket interface that jsSIP UA take as constructor parameter  */
interface IjsSipSocket {
    via_transport: string;
    url: string;
    sip_uri: string;
    connect(): void;
    disconnect(): void;
    send(data: string): boolean;
    onconnect(): void;
    ondisconnect(error: boolean, code?: number, reason?: string): void;
    ondata(data: string): boolean;
}
interface Hacks {
    /** Posted when a OK response to a REGISTER request is received */
    readonly evtSipRegistrationSuccess: VoidSyncEvent;
    /**
     * To call when receiving as SIP MESSAGE
     * to prevent immediately sending the 200 OK
     * response but rather wait
     * until some action have been completed.
     *
     * @param request the request prop of the
     * eventData emitted by JsSIP UA for the
     * "newMessage" event. ( when originator === remote )
     * @param pr The response to the SIP MESSAGE
     * will not be sent until this promise resolve.
     */
    setMessageOkDelay(request: any, pr: Promise<void>): void;
    readonly evtUnderlyingSocketClose: VoidSyncEvent;
}
declare class JsSipSocket implements IjsSipSocket, Hacks {
    private readonly connection;
    readonly evtSipRegistrationSuccess: VoidSyncEvent;
    readonly evtUnderlyingSocketClose: VoidSyncEvent;
    readonly via_transport: sip.TransportProtocol;
    readonly url: string;
    private sdpHacks;
    readonly sip_uri: string;
    constructor(imsi: string, connection: ConnectionApi);
    connect(): void;
    disconnect(): void;
    private messageOkDelays;
    setMessageOkDelay(request: any, pr: Promise<void>): void;
    send(data: string): true;
    onconnect(): void;
    ondisconnect(error: boolean, code?: number, reason?: string): void;
    ondata(data: string): boolean;
}
export {};

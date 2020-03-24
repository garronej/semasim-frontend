import { Evt, VoidEvt, IObservable } from "evt";
import { types as gwTypes } from "../gateway/types";
import * as types from "./types";
import { AsyncReturnType } from "../tools/typeSafety/AsyncReturnType";
import * as sip from "ts-sip";
declare type phoneNumber = import("phone-number/dist/lib").phoneNumber;
declare type Encryptor = import("./crypto/cryptoLibProxy").Encryptor;
declare type Decryptor = import("./crypto/cryptoLibProxy").Decryptor;
declare type CryptoRelatedParams = AsyncReturnType<typeof import("./crypto/appCryptoSetupHelper")["appCryptoSetupHelper"]>["paramsNeededToInstantiateUa"];
import { NonPostableEvts } from "../tools/NonPostableEvts";
declare type ConnectionApi = Pick<import("./toBackend/connection").ConnectionApi, "url" | "getSocket" | "evtConnect"> & {
    remoteNotifyEvts: Pick<types.RemoteNotifyEvts, "rtcIceServer">;
};
declare type UserSimEvts = Pick<NonPostableEvts<types.UserSim.Evts>, "evtSipPasswordRenewed" | "evtDelete" | "evtReachabilityStatusChange">;
export declare function createSipUserAgentFactory(params: {
    email: string;
    uaInstanceId: string;
    cryptoRelatedParams: CryptoRelatedParams;
    pushNotificationToken: string;
    connectionApi: ConnectionApi;
    userSimEvts: UserSimEvts;
}): (userSim: {
    sim: {
        imsi: string;
    };
    password: string;
    towardSimEncryptKeyStr: string;
    ownership: {
        status: "SHARED CONFIRMED" | "OWNED";
    };
    reachableSimState: Object | undefined;
}) => SipUserAgent;
declare class SipUserAgent {
    private readonly params;
    readonly obsIsRegistered: IObservable<boolean>;
    private readonly jsSipUa;
    private evtRingback;
    constructor(params: {
        uaDescriptor: gwTypes.Ua;
        towardUserDecryptor: Decryptor;
        getCurrentRtcIceServers: () => Promise<RTCIceServer>;
        evtUnregistered: Evt<{
            prReRegister: Promise<void>;
        }>;
        jsSipSocket: JsSipSocket;
        imsi: string;
        password: string;
        towardSimEncryptor: Encryptor;
        prRegister: Promise<void>;
    });
    private register;
    readonly evtIncomingMessage: Evt<{
        fromNumber: string;
        bundledData: gwTypes.BundledData.ServerToClient.StatusReport | gwTypes.BundledData.ServerToClient.Message | gwTypes.BundledData.ServerToClient.MmsNotification | gwTypes.BundledData.ServerToClient.CallAnsweredBy | gwTypes.BundledData.ServerToClient.FromSipCallSummary | gwTypes.BundledData.ServerToClient.MissedCall | gwTypes.BundledData.ServerToClient.SendReport;
        handlerCb: () => void;
    }>;
    private onMessage;
    private postEvtIncomingMessage;
    sendMessage(number: phoneNumber, bundledData: gwTypes.BundledData.ClientToServer): Promise<void>;
    readonly evtIncomingCall: Evt<{
        fromNumber: string;
        terminate(): void;
        prTerminated: Promise<void>;
        onAccepted(): Promise<{
            state: "ESTABLISHED";
            sendDtmf(signal: types.PhoneCallUi.DtmFSignal, duration: number): void;
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
                sendDtmf(signal: types.PhoneCallUi.DtmFSignal, duration: number): void;
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
    readonly evtSipRegistrationSuccess: VoidEvt;
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
    readonly evtUnderlyingSocketClose: VoidEvt;
}
declare class JsSipSocket implements IjsSipSocket, Hacks {
    private readonly connectionApi;
    readonly evtSipRegistrationSuccess: VoidEvt;
    readonly evtUnderlyingSocketClose: VoidEvt;
    readonly via_transport: sip.TransportProtocol;
    readonly url: string;
    private sdpHacks;
    readonly sip_uri: string;
    constructor(imsi: string, connectionApi: ConnectionApi);
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

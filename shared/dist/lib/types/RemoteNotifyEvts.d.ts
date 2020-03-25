import * as dcTypes from "chan-dongle-extended-client/dist/lib/types";
declare type Evt<T> = import("evt").Evt<T>;
declare type VoidEvt = import("evt").VoidEvt;
export declare type RemoteNotifyEvts = {
    evtUserSimChange: Evt<import("../../sip_api_declarations/uaToBackend").notifyUserSimChange.Params>;
    evtDongleOnLan: Evt<{
        type: "LOCKED";
        dongle: dcTypes.Dongle.Locked;
        prSimUnlocked: Promise<void>;
    } | {
        type: "USABLE";
        dongle: dcTypes.Dongle.Usable;
    }>;
    evtOpenElsewhere: VoidEvt;
    getRtcIceServer: () => Promise<DOM_RTCIceServer_subset>;
    evtWdActionFromOtherUa: Evt<import("../../sip_api_declarations/uaToBackend").wd_notifyActionFromOtherUa.Params>;
};
export declare type DOM_RTCIceServer_subset = {
    credential?: string;
    credentialType?: "password";
    urls: string[];
    username?: string;
};
export {};

import { SyncEvent, VoidSyncEvent } from "ts-events-extended";
import * as types from "./types/userSim";
import * as wd from "./types/webphoneData/logic";
import { phoneNumber } from "phone-number/dist/lib";
declare type Ua = import("./Ua").Ua;
declare type UaSimPrototype = (typeof import("./Ua")["UaSim"])["prototype"];
declare type WdEvts = import("./toBackend/remoteApiCaller/webphoneData").WdEvts;
export declare type GetWdApiCallerForSpecificSim = ReturnType<(typeof import("./toBackend/remoteApiCaller"))["getWdApiCallerForSpecificSimFactory"]>;
export declare type WdApiCallerForSpecificSim = ReturnType<GetWdApiCallerForSpecificSim>;
export declare type AppEvts = import("./toBackend/appEvts").SubsetOfAppEvts<"evtContactCreatedOrUpdated" | "evtContactDeleted" | "evtSimReachabilityStatusChange" | "evtSimGsmConnectivityChange" | "evtSimCellSignalStrengthChange" | "evtOngoingCall">;
export declare type CoreApiCaller = CoreApiCaller.HelperType<"shouldAppendPromotionalMessage" | "updateContactName" | "deleteContact" | "createContact">;
export declare namespace CoreApiCaller {
    type TypeofImport = (typeof import("./toBackend/remoteApiCaller"))["core"];
    export type HelperType<K extends keyof TypeofImport> = {
        [key in K]: TypeofImport[key];
    };
    export {};
}
export declare type Webphone = {
    userSim: types.UserSim.Usable;
    evtUserSimUpdated: SyncEvent<"reachabilityStatusChange" | "gsmConnectivityChange" | "cellSignalStrengthChange" | "ongoingCall">;
    wdChats: wd.Chat<"PLAIN">[];
    wdEvts: WdEvts;
    evtIsSipRegisteredValueChanged: VoidSyncEvent;
    getIsSipRegistered: () => boolean;
    evtIncomingCall: SyncEvent<Omit<SyncEvent.Type<UaSimPrototype["evtIncomingCall"]>, "fromNumber"> & {
        wdChat: wd.Chat<"PLAIN">;
    }>;
    sendMessage: (wdChat: wd.Chat<"PLAIN">, text: phoneNumber) => void;
    placeOutgoingCall: UaSimPrototype["placeOutgoingCall"];
    fetchOlderWdMessages: WdApiCallerForSpecificSim["fetchOlderMessages"];
    updateWdChatLastMessageSeen: (wdChat: wd.Chat<"PLAIN">) => void;
    /** NOTE: the number does not need to be a valid phoneNumber */
    getAndOrCreateAndOrUpdateWdChat: (number: string, contactName?: string, contactIndexInSim?: number | null) => Promise<wd.Chat<"PLAIN">>;
    /** NOTE: Return promise instead of void just for discarding loading dialog ( also true for deleteWdChatAndCorrespondingContactInSim ) */
    updateNameOfWdChatAndCreateOrUpdateCorespondingContactInSim: (wdChat: wd.Chat<"PLAIN">, name: string) => Promise<void>;
    deleteWdChatAndCorrespondingContactInSim(wdChat: wd.Chat<"PLAIN">): Promise<void>;
};
export declare namespace Webphone {
    function createFactory(ua: Ua, appEvts: AppEvts, getWdApiCallerForSpecificSim: GetWdApiCallerForSpecificSim, coreApiCaller: CoreApiCaller): (userSim: types.UserSim._Base<types.SimOwnership.Owned | types.SimOwnership.Shared.Confirmed>) => Promise<Webphone>;
    function sortPutingFirstTheOnesWithMoreRecentActivity(webphone1: Webphone, webphone2: Webphone): -1 | 0 | 1;
}
export {};

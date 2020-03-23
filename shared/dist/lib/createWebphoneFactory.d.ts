import * as types from "./types";
import { NonPostableEvts } from "../tools/NonPostableEvts";
declare type CoreApi = Pick<import("./toBackend/remoteApiCaller").CoreApi, "updateContactName" | "createContact" | "deleteContact" | "shouldAppendPromotionalMessage">;
declare type UserSimEvts = Pick<NonPostableEvts<types.UserSim.Usable.Evts>, "evtFriendlyNameChange" | "evtReachabilityStatusChange" | "evtCellularConnectivityChange" | "evtCellularSignalStrengthChange" | "evtOngoingCall" | "evtNewUpdatedOrDeletedContact">;
export declare function createWebphoneFactory(params: {
    createSipUserAgent: ReturnType<typeof import("./createSipUserAgentFactory").createSipUserAgentFactory>;
    getWdApi: ReturnType<ReturnType<typeof import("./toBackend/remoteApiCaller").factory>["getWdApiFactory"]>;
    phoneCallUiCreate: types.PhoneCallUi.Create;
    userSimEvts: UserSimEvts;
    coreApi: CoreApi;
}): (userSim: types.UserSim.Usable) => Promise<types.Webphone>;
export {};

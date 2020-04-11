import * as types from "./types";
declare type CoreApi = Pick<import("./toBackend/remoteApiCaller").CoreApi, "unlockSim" | "registerSim" | "rejectSharingRequest" | "acceptSharingRequest">;
declare type RemoteNotifyEvts = Pick<types.RemoteNotifyEvts, "evtDongleOnLan" | "evtOpenElsewhere">;
declare type UserSimEvts = Pick<types.UserSim.Evts, "evtNew" | "evtSharedUserSetChange">;
export declare function registerInteractiveRemoteNotifyEvtHandlers(params: {
    getUsableSimFriendlyNames: () => string[];
    sharedNotConfirmedUserSims: types.UserSim.Shared.NotConfirmed[];
    userSimEvts: UserSimEvts;
    prReadyToDisplayUnsolicitedDialogs: Promise<void>;
    remoteNotifyEvts: RemoteNotifyEvts;
    coreApi: CoreApi;
    dialogApi: import("../tools/modal/dialog").DialogApi;
    startMultiDialogProcess: typeof import("../tools/modal/dialog").startMultiDialogProcess;
    restartApp: (typeof import("./restartApp"))["restartApp"];
}): void;
export {};

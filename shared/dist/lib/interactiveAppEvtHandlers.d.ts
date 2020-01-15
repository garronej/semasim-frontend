declare type DialogApi = import("../tools/modal/dialog").DialogApi;
export declare type RemoteCoreApiCaller = import("./toBackend/remoteApiCaller").SubsetOfRemoteCoreApiCaller<"getUsableUserSims" | "unlockSim" | "registerSim" | "rejectSharingRequest" | "acceptSharingRequest">;
export declare type AppEvts = import("./toBackend/appEvts").SubsetOfAppEvts<"evtDongleOnLan" | "evtSimSharingRequest" | "evtSharingRequestResponse" | "evtOtherSimUserUnregisteredSim" | "evtOtherSimUserUnregisteredSim" | "evtOpenElsewhere">;
export declare function registerInteractiveAppEvtHandlers(prReadyToInteract: Promise<void>, appEvts: AppEvts, remoteCoreApiCaller: RemoteCoreApiCaller, dialogApi: DialogApi, startMultiDialogProcess: (typeof import("../tools/modal/dialog"))["startMultiDialogProcess"], restartApp: (typeof import("./restartApp"))["restartApp"]): void;
export {};

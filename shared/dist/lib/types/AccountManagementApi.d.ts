import type * as types from "./UserSim";
import type { CoreApi } from "../toBackend/remoteApiCaller";
import type { WebApi } from "../webApiCaller";
/** Remove the events and methods that should not be exposed */
export declare type AccountManagementApi = {
    email: string;
    userSims: types.UserSim.Usable[];
    userSimEvts: Pick<types.UserSim.Usable.Evts, "evtNew" | "evtDelete" | "evtReachabilityStatusChange" | "evtCellularConnectivityChange" | "evtCellularSignalStrengthChange" | "evtOngoingCall" | "evtNewUpdatedOrDeletedContact" | "evtSharedUserSetChange" | "evtFriendlyNameChange">;
    coreApi: Pick<CoreApi, "unregisterSim" | "rebootDongle" | "shareSim" | "stopSharingSim" | "changeSimFriendlyName" | "createContact" | "updateContactName" | "deleteContact">;
    webApi: Pick<WebApi, "logoutUser" | "getSubscriptionInfos" | "subscribeOrUpdateSource" | "unsubscribe" | "createStripeCheckoutSessionForShop" | "createStripeCheckoutSessionForSubscription" | "getCountryIso" | "getChangesRates">;
};

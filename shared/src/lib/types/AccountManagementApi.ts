
import * as types from "./UserSim";
import { NonPostableEvts } from "../../tools/NonPostableEvts";

/** Remove the events and methods that should not be exposed */
export type AccountManagementApi = {
    email: string;
    userSims: types.UserSim.Usable[];
    userSimEvts: Pick<
        NonPostableEvts<types.UserSim.Usable.Evts>,
        "evtNew" | 
        "evtDelete" |
        "evtReachabilityStatusChange" |
        "evtCellularConnectivityChange" |
        "evtCellularSignalStrengthChange" |
        "evtOngoingCall" |
        "evtNewUpdatedOrDeletedContact" |
        "evtSharedUserSetChange" |
        "evtFriendlyNameChange"
    >;
    coreApi: Pick<
        import("../toBackend/remoteApiCaller").CoreApi,
        "unregisterSim" |
        "rebootDongle" |
        "shareSim" |
        "stopSharingSim" |
        "changeSimFriendlyName" |
        "createContact" |
        "updateContactName" |
        "deleteContact"
    >;
    webApi: Pick<
        import("../webApiCaller").WebApi,
        "logoutUser" |
        "getSubscriptionInfos" |
        "subscribeOrUpdateSource" |
        "unsubscribe" |
        "createStripeCheckoutSessionForShop" |
        "createStripeCheckoutSessionForSubscription" |
        "getCountryIso" |
        "getChangesRates"
    >;
};


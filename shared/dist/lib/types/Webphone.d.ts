import { UserSim } from "./UserSim";
import * as wd from "./webphoneData";
import type { StatefulReadonlyEvt } from "evt";
export declare type Webphone = {
    userSim: UserSim.Usable;
    userSimEvts: Pick<UserSim.Usable.Evts.ForSpecificSim, "evtFriendlyNameChange" | "evtReachabilityStatusChange" | "evtCellularConnectivityChange" | "evtCellularSignalStrengthChange" | "evtOngoingCall" | "evtNewUpdatedOrDeletedContact">;
    /** NOTE: At all time there is a Chat for every contact of the phonebook */
    wdChats: wd.Chat[];
    wdEvts: wd.Evts;
    getOrCreateWdChat(params: {
        number_raw: string;
    }): Promise<wd.Chat>;
    updateWdChatContactName(params: {
        wdChat: wd.Chat;
        contactName: string;
    }): Promise<void>;
    /** NOTE: If a contact for the number exist in userSim's phonebook an empty chat will be recreated*/
    deleteWdChat(wdChat: wd.Chat): Promise<void>;
    sendMessage: (params: {
        wdChat: wd.Chat;
        text: string;
    }) => void;
    placeOutgoingCall: (wdChat: wd.Chat) => void;
    fetchOlderWdMessages(params: {
        wdChat: wd.Chat;
        maxMessageCount: number;
    }): Promise<wd.Message[]>;
    updateWdChatLastMessageSeen: (wdChat: wd.Chat) => void;
    evtIsSipRegistered: StatefulReadonlyEvt<boolean>;
};
export declare namespace Webphone {
    function sortPuttingFirstTheOneThatWasLastUsed(webphone1: sortPuttingFirstTheOneThatWasLastUsed.WebphoneLike, webphone2: sortPuttingFirstTheOneThatWasLastUsed.WebphoneLike): -1 | 0 | 1;
    namespace sortPuttingFirstTheOneThatWasLastUsed {
        type WebphoneLike = Pick<Webphone, "userSim" | "wdChats">;
    }
    function canCallFactory(webphone: canCallFactory.WebphoneLike): {
        canCall: (number_raw: string) => boolean;
    };
    namespace canCallFactory {
        type WebphoneLike = Webphone;
    }
}

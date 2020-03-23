import { UserSim } from "./UserSim";
import * as wd from "./webphoneData";
declare type IObservable<T> = import("evt").IObservable<T>;
import { NonPostableEvts } from "../../tools/NonPostableEvts";
export declare type Webphone = {
    userSim: UserSim.Usable;
    userSimEvts: Pick<NonPostableEvts<UserSim.Usable.Evts.ForSpecificSim>, "evtFriendlyNameChange" | "evtReachabilityStatusChange" | "evtCellularConnectivityChange" | "evtCellularSignalStrengthChange" | "evtOngoingCall" | "evtNewUpdatedOrDeletedContact">;
    /** NOTE: At all time there is a Chat for every contact of the phonebook */
    wdChats: wd.Chat[];
    wdEvts: NonPostableEvts<wd.Evts>;
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
    obsIsSipRegistered: IObservable<boolean>;
};
export declare namespace Webphone {
    type Webphone_ = Pick<Webphone, "userSim" | "wdChats">;
    export function sortPuttingFirstTheOneThatWasLastUsed(webphone1: Webphone_, webphone2: Webphone_): -1 | 0 | 1;
    export {};
}
export {};

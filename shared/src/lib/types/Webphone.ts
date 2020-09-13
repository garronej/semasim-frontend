
import { UserSim } from "./UserSim";
import * as wd from "./webphoneData";
import { phoneNumber as phoneNumberLib } from "phone-number/dist/lib";
import type { StatefulReadonlyEvt } from "evt";
import type { NonPostableEvt } from "evt";

export type Webphone = {
    userSim: UserSim.Usable;
    userSimEvts: Pick<
        UserSim.Usable.Evts.ForSpecificSim,
        "evtFriendlyNameChange" |
        "evtReachabilityStatusChange" |
        "evtCellularConnectivityChange" |
        "evtCellularSignalStrengthChange" |
        "evtOngoingCall" |
        "evtNewUpdatedOrDeletedContact" //NOTE: Used only to update ongoing call string description in realtime.
    >;
    /** NOTE: At all time there is a Chat for every contact of the phonebook */
    wdChats: wd.Chat[];
    wdEvts: wd.Evts;
    getOrCreateWdChat(params: { number_raw: string; }): Promise<wd.Chat>;
    updateWdChatContactName(params: { wdChat: wd.Chat; contactName: string; }): Promise<void>;
    /** NOTE: If a contact for the number exist in userSim's phonebook an empty chat will be recreated*/
    deleteWdChat(wdChat: wd.Chat): Promise<void>;
    sendMessage: (params: { wdChat: wd.Chat; text: string; }) => void;
    placeOutgoingCall: (wdChat: wd.Chat) => void;
    fetchOlderWdMessages(params: { wdChat: wd.Chat; maxMessageCount: number; }): Promise<wd.Message[]>;
    updateWdChatLastMessageSeen: (wdChat: wd.Chat) => void;
    evtIsSipRegistered: StatefulReadonlyEvt<boolean>;
};

export namespace Webphone {


    export function sortPuttingFirstTheOneThatWasLastUsed(
        webphone1: sortPuttingFirstTheOneThatWasLastUsed.WebphoneLike,
        webphone2: sortPuttingFirstTheOneThatWasLastUsed.WebphoneLike
    ): -1 | 0 | 1 {

        if (!!webphone1.userSim.reachableSimState !== !!webphone2.userSim.reachableSimState) {
            return !!webphone1.userSim.reachableSimState ? -1 : 1;
        }

        const [wdChat1, wdChat2] = [webphone1, webphone2].map(({ wdChats }) =>
            wd.Chat.findLastOpened(wdChats)
        );

        if (!wdChat1 !== !wdChat2) {
            return !!wdChat1 ? -1 : 1;
        }

        if (!wdChat1) {
            return 0;
        }

        switch (wd.Chat.compare(wdChat1, wdChat2!)) {
            case -1: return 1;
            case 0: return 0;
            case 1: return -1;
        }

    };

    export namespace sortPuttingFirstTheOneThatWasLastUsed {
        export type WebphoneLike = Pick<Webphone, "userSim" | "wdChats">;
    }

    export namespace canCall {

        export function getValue(
            params: {
                webphone: getValue.WebphoneLike;
                phoneNumber: string;
            }
        ): boolean {

            const { webphone, phoneNumber } = params;

            const {
                userSim: { reachableSimState },
                evtIsSipRegistered
            } = webphone;

            return (
                phoneNumberLib.isDialable(phoneNumber) &&
                evtIsSipRegistered.state &&
                !!reachableSimState?.isGsmConnectivityOk &&
                (
                    reachableSimState.ongoingCall === undefined ||
                    reachableSimState.ongoingCall.number === phoneNumber &&
                    !reachableSimState.ongoingCall.isUserInCall
                )
            );

        }

        

        export namespace getValue {

            export type WebphoneLike = {
                userSim: {
                    reachableSimState?: UserSim.ReachableSimState;
                };
                evtIsSipRegistered: { state: boolean; };
            };

        }

        export function getAffectedByEvts(
            params: { webphone: getAffectedByEvts.WebphoneLike; }
        ): NonPostableEvt<any>[] {

            const { webphone } = params;

            const {
                userSimEvts,
                evtIsSipRegistered
            } = webphone;

            return [
                userSimEvts.evtReachabilityStatusChange,
                userSimEvts.evtCellularConnectivityChange,
                userSimEvts.evtOngoingCall,
                evtIsSipRegistered.evtChange
            ];

        }

        export namespace getAffectedByEvts {

            export type WebphoneLike = {
                userSimEvts: Pick<
                    UserSim.Usable.Evts.ForSpecificSim,
                    "evtReachabilityStatusChange" |
                    "evtOngoingCall" |
                    "evtCellularConnectivityChange"
                >
                evtIsSipRegistered: StatefulReadonlyEvt<boolean>;
            };

        }

    }

}
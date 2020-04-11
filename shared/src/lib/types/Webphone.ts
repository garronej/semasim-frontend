
import { UserSim } from "./UserSim";
import * as wd from "./webphoneData";
import { phoneNumber as phoneNumberLib } from "phone-number/dist/lib";
import type { StatefulReadonlyEvt } from "evt";

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



    export function canCallFactory(webphone: canCallFactory.WebphoneLike) {

        const{ userSim, evtIsSipRegistered } = webphone;

        function canCall(number_raw: string): boolean {

            const number= 
                phoneNumberLib.build(
                    number_raw,
                    userSim.sim.country?.iso
                )
                ;

            return (
                phoneNumberLib.isDialable(number) &&
                evtIsSipRegistered.state &&
                !!userSim.reachableSimState?.isGsmConnectivityOk &&
                (
                    userSim.reachableSimState.ongoingCall === undefined ||
                    userSim.reachableSimState.ongoingCall.number === number &&
                    !userSim.reachableSimState.ongoingCall.isUserInCall
                )
            );

        }

        return { canCall };

    }

    export namespace canCallFactory {

        /*
        export type WebphoneLike = {
            userSim: { 
                sim: { country: Webphone["userSim"]["sim"]["country"]; };
                reachableSimState: Webphone["userSim"]["reachableSimState"];
            },
            obsIsSipRegistered: Webphone["obsIsSipRegistered"];
        };
        */

        export type WebphoneLike = Webphone;

    }
    /*

    export function useEffect(
        canCallEffect: (canCall: boolean) => void,
        trkWebphone: Trackable<Webphone>,
        trkPhoneNumberRaw: Trackable<string>,
        ctx: import("evt").Ctx<any>
    ) {

        const obsPhoneNumber= Tracked.from(
            ctx,
            trkPhoneNumberRaw,
            number_raw => phoneNumberLib.build(
                number_raw,
                trkWebphone.val.userSim.sim.country?.iso
            )
        );

        const trkIsNumberDialable = Tracked.from(
            obsPhoneNumber,
            number=> phoneNumberLib.isDialable(number)
        );

        trkIsNumberDialable;

        



        Evt.useEffect(
            previousWebphone => {

                if (!!previousWebphone) {
                    Evt.getCtx(previousWebphone).done();
                }

                const webphone = trkWebphone.val;

                const { canCall } = canCallFactory(webphone);

                const webphoneCtx = Evt.getCtx(webphone);

                ctx.evtDoneOrAborted.attach(
                    webphoneCtx,
                    () => webphoneCtx.done()
                );

                Evt.useEffect(
                    () => canCallEffect(canCall(trkPhoneNumberRaw.val)),
                    Evt.merge(
                        webphoneCtx,
                        [
                            trkPhoneNumberRaw.evt,
                            webphone.trkIsSipRegistered.evt,
                            webphone.userSimEvts.evtReachabilityStatusChange,
                            webphone.userSimEvts.evtCellularConnectivityChange,
                            webphone.userSimEvts.evtOngoingCall
                        ]
                    )
                );

            },
            trkWebphone.evtDiff.pipe(
                ctx,
                ({ prevVal }) => [prevVal]
            )
        );

    }
    */



}
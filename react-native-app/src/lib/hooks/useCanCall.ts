
import { useState, useMemo, useCallback } from "react";
import { Evt } from "frontend-shared/node_modules/evt";
import { useEvt } from "frontend-shared/node_modules/evt/hooks";
import { Webphone } from "frontend-shared/dist/lib/types/Webphone";
import { phoneNumber as phoneNumberLib } from "frontend-shared/node_modules/phone-number/dist/lib";

export function useCanCall(
    params: {
        webphone: Webphone;
        phoneNumberRaw: string;
    }
): boolean {

    const { webphone, phoneNumberRaw } = params;

    const phoneNumber = useMemo(
        () =>
            phoneNumberLib.build(
                phoneNumberRaw,
                webphone.userSim.sim.country?.iso
            ),
        [webphone, phoneNumberRaw]
    );

    const getCanCall = useCallback(
        ()=> Webphone.canCall.getValue({ webphone, phoneNumber }),
        [webphone, phoneNumber]
    );

    const [canCall, setCanCall] = useState(getCanCall);

    useEvt(ctx => {

        Evt.useEffect(
            () => setCanCall(getCanCall()),
            Evt.merge(
                ctx,
                Webphone.canCall.getAffectedByEvts({ webphone })
            )
        );

    }, [webphone, getCanCall]);

    return canCall;

}


/*
//NOTE: Alternative, less efficient, more hacky, implementation.
export function useCanCall(
    params: {
        webphone: Webphone;
        phoneNumberRaw: string;
    }
): boolean {

    const { webphone, phoneNumberRaw } = params;

    const [counter, incrementCounter] = useReducer(x => x + 1, 0);

    useEvt(ctx => {

        const { evtIsSipRegistered, userSimEvts } = webphone;

        Evt.merge(ctx, [
            evtIsSipRegistered.evtChange,
            userSimEvts.evtReachabilityStatusChange,
            userSimEvts.evtCellularConnectivityChange,
            userSimEvts.evtOngoingCall
        ]).attach(() => incrementCounter(undefined as any));

    }, [webphone]);

    const phoneNumber = useMemo(
        () =>
            phoneNumberLib.build(
                phoneNumberRaw,
                webphone.userSim.sim.country?.iso
            ),
        [webphone, phoneNumberRaw]
    );

    return useMemo(
        () => {

            const { evtIsSipRegistered, userSim } = webphone;

            return (
                phoneNumberLib.isDialable(phoneNumber) &&
                evtIsSipRegistered.state &&
                !!userSim.reachableSimState?.isGsmConnectivityOk &&
                (
                    userSim.reachableSimState.ongoingCall === undefined ||
                    userSim.reachableSimState.ongoingCall.number === phoneNumber &&
                    !userSim.reachableSimState.ongoingCall.isUserInCall
                )
            )
        },
        [webphone, phoneNumber, counter]
    );

}
*/
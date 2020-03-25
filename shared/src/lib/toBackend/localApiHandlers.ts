
import * as apiDeclaration from "../../sip_api_declarations/uaToBackend";
import * as sipLibrary from "ts-sip";
import { Evt, VoidEvt, UnpackEvt } from "evt";
import * as dcTypes from "chan-dongle-extended-client/dist/lib/types";
import * as types from "../types/RemoteNotifyEvts";

export function getHandlers(): {
    handlers: sipLibrary.api.Server.Handlers
    remoteNotifyEvts: types.RemoteNotifyEvts;
} {

    const evtRtcIceServer = new Evt<{
        rtcIceServer: types.DOM_RTCIceServer_subset;
        attachOnNoLongerValid: (onNoLongerValid: () => void) => void;
    }>();

    const remoteNotifyEvts: types.RemoteNotifyEvts = {
        "evtUserSimChange": new Evt(),
        "evtDongleOnLan": new Evt(),
        "evtOpenElsewhere": new VoidEvt(),
        "getRtcIceServer": (() => {


            let current: types.DOM_RTCIceServer_subset | undefined = undefined;

            const evtUpdated = new VoidEvt();

            evtRtcIceServer.attach(({ rtcIceServer, attachOnNoLongerValid }) => {

                attachOnNoLongerValid(() => current = undefined);

                current = rtcIceServer;

                evtUpdated.post();

            });

            return async function callee(): Promise<types.DOM_RTCIceServer_subset> {

                if (current !== undefined) {
                    return current;
                }

                await evtUpdated.waitFor();

                return callee();

            };




        })(),
        "evtWdActionFromOtherUa": new Evt()
    };

    const handlers: sipLibrary.api.Server.Handlers = {};

    {

        const { methodName } = apiDeclaration.notifyUserSimChange;
        type Params = apiDeclaration.notifyUserSimChange.Params;
        type Response = apiDeclaration.notifyUserSimChange.Response;

        const handler: sipLibrary.api.Server.Handler<Params, Response> = {
            "handler": eventData => {

                if (eventData.type === "IS NOW REACHABLE") {
                    evtUsableDongle.post({ "imei": eventData.simDongle.imei });
                }

                remoteNotifyEvts.evtUserSimChange.post(eventData);

                return Promise.resolve(undefined);

            }
        };

        handlers[methodName] = handler;

    }


    /** 
     * Posted when a Dongle with an unlocked SIM goes online.
     * Used so we can display a loading between the moment 
     * when the card have been unlocked and the card is ready 
     * to use.
     */
    const evtUsableDongle = new Evt<{ imei: string; }>();


    {

        const { methodName } = apiDeclaration.notifyDongleOnLan;
        type Params = apiDeclaration.notifyDongleOnLan.Params;
        type Response = apiDeclaration.notifyDongleOnLan.Response;

        const handler: sipLibrary.api.Server.Handler<Params, Response> = {
            "handler": async dongle => {

                const data: UnpackEvt<typeof remoteNotifyEvts.evtDongleOnLan> =
                    dcTypes.Dongle.Locked.match(dongle) ? ({
                        "type": "LOCKED",
                        dongle,
                        "prSimUnlocked": evtUsableDongle
                            .waitFor(({ imei }) => imei === dongle.imei)
                            .then(() => undefined)
                    }) : ({
                        "type": "USABLE",
                        dongle
                    });

                if (data.type === "USABLE") {
                    evtUsableDongle.post({ "imei": dongle.imei });
                }

                remoteNotifyEvts.evtDongleOnLan.postAsyncOnceHandled(data);

                return undefined;

            }
        };

        handlers[methodName] = handler;

    }

    {

        const { methodName } = apiDeclaration.notifyLoggedFromOtherTab;
        type Params = apiDeclaration.notifyLoggedFromOtherTab.Params;
        type Response = apiDeclaration.notifyLoggedFromOtherTab.Response;

        const handler: sipLibrary.api.Server.Handler<Params, Response> = {
            "handler": () => {

                remoteNotifyEvts.evtOpenElsewhere.postAsyncOnceHandled();

                return Promise.resolve(undefined);

            }
        };

        handlers[methodName] = handler;

    }


    {

        const { methodName } = apiDeclaration.notifyIceServer;
        type Params = apiDeclaration.notifyIceServer.Params;
        type Response = apiDeclaration.notifyIceServer.Response;

        const handler: sipLibrary.api.Server.Handler<Params, Response> = {
            "handler": (params, fromSocket) => {

                evtRtcIceServer.post({
                    "rtcIceServer": params !== undefined ? params :
                        ({
                            "urls": [
                                "stun:stun1.l.google.com:19302",
                                "stun:stun2.l.google.com:19302",
                                "stun:stun3.l.google.com:19302",
                                "stun:stun4.l.google.com:19302"
                            ]
                        }),
                    "attachOnNoLongerValid": onNoLongerValid => fromSocket.evtClose.attachOnce(
                        () => onNoLongerValid()
                    )

                });

                return Promise.resolve(undefined);

            }
        };

        handlers[methodName] = handler;

    }

    {

        const { methodName } = apiDeclaration.wd_notifyActionFromOtherUa;
        type Params = apiDeclaration.wd_notifyActionFromOtherUa.Params;
        type Response = apiDeclaration.wd_notifyActionFromOtherUa.Response;

        const handler: sipLibrary.api.Server.Handler<Params, Response> = {
            "handler": params => {

                remoteNotifyEvts.evtWdActionFromOtherUa.post(params);

                return Promise.resolve(undefined);

            }
        };

        handlers[methodName] = handler;

    }

    return { handlers, remoteNotifyEvts };


}

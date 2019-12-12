//NOTE: Require ion sound loaded on the page.

import { SyncEvent } from "frontend-shared/node_modules/ts-events-extended";
import * as types from "frontend-shared/dist/lib/types/UserSim";
import * as wd from "frontend-shared/dist/lib/types/webphoneData/types";
import { phoneNumber } from "frontend-shared/node_modules/phone-number";
type DtmFSignal = import("frontend-shared/dist/lib/Ua").DtmFSignal;
import { default as RNCallKeep, Events as RNCallKeepEventType } from "react-native-callkeep";
import { default as uuid } from "uuid";

const log: typeof console.log = true ? console.log.bind(console) : () => { };

const evts = {
    "didReceiveStartCallAction": new SyncEvent<{
        handle: string;
        callUUID: string;
        name: string;
    }>(),
    "answerCall": new SyncEvent<{
        callUUID: string;
    }>(),
    "endCall": new SyncEvent<{
        callUUID: string;
    }>(),
    "didDisplayIncomingCall": new SyncEvent<{
        error: string | null;
    }>(),
    "didPerformSetMutedCallAction": new SyncEvent<{
        muted: boolean; callUUID: string;
    }>(),
    "didToggleHoldCallAction": new SyncEvent<{
        hold: boolean; callUUID: string;
    }>(),
    "didPerformDTMFAction": new SyncEvent<{
        digits: string; callUUID: string;
    }>(),
    "didActivateAudioSession": new SyncEvent<{}>()
};


export class UiVoiceCall {

    private readonly countryIso: string | undefined;

    private static initialization() {

        for (const type of [
            "didReceiveStartCallAction",
            "answerCall",
            "endCall",
            "didDisplayIncomingCall",
            "didPerformSetMutedCallAction",
            "didToggleHoldCallAction",
            "didPerformDTMFAction",
            "didActivateAudioSession"
        ] as const) {

            RNCallKeep.addEventListener(type, data => evts[type].post(data));

        }

        RNCallKeep.addEventListener(
            "checkReachability",
            () => RNCallKeep.setReachable()
        );


        try {

            RNCallKeep.setup({
                "ios": {
                    "appName": 'ReactNativeSemasimDemo',
                    //"imageName": 'sim_icon',
                    "supportsVideo": false as const,
                    "maximumCallGroups": '1' as const,
                    "maximumCallsPerCallGroup": '1' as const
                },
                "android": {
                    "alertTitle": 'Permissions Required',
                    "alertDescription":
                        'This application needs to access your phone calling accounts to make calls',
                    "cancelButton": 'Cancel',
                    "okButton": 'ok',
                    //"imageName": 'sim_icon',
                    "additionalPermissions": []
                }
            });

        } catch (error) {

            log("Unrecoverable error: " + error.message);

            throw error;

        }


        RNCallKeep.setAvailable(true); // Only used for Android. TODO: bind to isRegistered

    }

    private static isInitialized = false;

    constructor(
        private readonly userSim: types.UserSim.Usable
    ) {

        if (!UiVoiceCall.isInitialized) {

            UiVoiceCall.isInitialized = true;

            UiVoiceCall.initialization();

        }

        this.countryIso = userSim.sim.country ?
            userSim.sim.country.iso : undefined;


    }



    private onEstablished(callRef: { uuid: string; }): {
        evtUserInput: SyncEvent<UiVoiceCall.InCallUserAction>
    } {

        const evtUserInput = new SyncEvent<UiVoiceCall.InCallUserAction>();

        evts.didPerformDTMFAction.attach(
            callRef,
            ({ digits }) => evtUserInput.post({
                "userAction": "DTMF",
                "signal": digits as DtmFSignal,
                "duration": 250
            }
            )
        );

        evts.didPerformSetMutedCallAction.attach(
            callRef,
            ({ muted })=>{

                log({ muted }, "TODO ?");

            }
        );

        evts.endCall.attachOnce(
            callRef,
            () => {

                evts.didPerformSetMutedCallAction.detach(callRef);
                evts.didPerformDTMFAction.detach(callRef);

                evtUserInput.post({
                    "userAction": "HANGUP"
                });

            }
        );

        return { evtUserInput };

    }

    public onOutgoing(wdChat: wd.Chat<"PLAIN">): {
        onTerminated(message: string): void;
        onRingback(): {
            onEstablished: () => ReturnType<typeof UiVoiceCall.prototype.onEstablished>,
            prUserInput: Promise<{ userAction: "HANGUP"; }>;
        };
        prUserInput: Promise<{ userAction: "CANCEL"; }>;
    } {

        const callRef = { "uuid": uuid.v4() };

        const contactName = wdChat.contactName ? wdChat.contactName : "";

        const prettyNumber = phoneNumber.prettyPrint(
            wdChat.contactNumber,
            this.countryIso
        );


        // Use startCall to ask the system to start a call - Initiate an outgoing call from this point
        RNCallKeep.startCall(
            callRef.uuid,
            prettyNumber,
            `${contactName} with ${this.userSim.friendlyName}`
        );

        return {
            "onTerminated": message => {

                evts.endCall.detach(callRef);
                evts.didPerformDTMFAction.detach(callRef);
                evts.didPerformSetMutedCallAction.detach(callRef);

                //TODO: modify api to match end call reason.

                RNCallKeep.reportEndCallWithUUID(callRef.uuid, 2);

            },
            "onRingback": () => {

                evts.endCall.detach(callRef);

                RNCallKeep.reportConnectingOutgoingCallWithUUID(callRef.uuid);

                return {
                    "onEstablished": () => {

                        evts.endCall.detach(callRef);

                        //NOTE: For android
                        (RNCallKeep.setCurrentCallActive as any)(callRef.uuid);

                        //NOTE: For ios
                        RNCallKeep.reportConnectedOutgoingCallWithUUID(callRef.uuid);

                        return this.onEstablished(callRef)

                    },
                    "prUserInput": new Promise(
                        resolve => evts.endCall.attachOnce(
                            callRef,
                            () => resolve({ "userAction": "HANGUP" })
                        )
                    )
                };

            },
            "prUserInput": new Promise(
                resolve => evts.endCall.attachOnce(
                    callRef,
                    () => resolve({ "userAction": "CANCEL" })
                )
            )
        };


    }


    public onIncoming(wdChat: wd.Chat<"PLAIN">): {
        onTerminated(message: string): void;
        prUserInput: Promise<{
            userAction: "ANSWER";
            onEstablished: typeof UiVoiceCall.prototype.onEstablished;
        } | {
            userAction: "REJECT";
        }>;
    } {

        //TODO
        return null as any;

    }



}


export declare namespace UiVoiceCall {

    export type State = "RINGING" | "RINGBACK" | "ESTABLISHED" | "LOADING" | "TERMINATED";

    export type InCallUserAction =
        InCallUserAction.Dtmf |
        InCallUserAction.Hangup;

    export namespace InCallUserAction {

        export type Dtmf = {
            userAction: "DTMF";
            signal: DtmFSignal;
            duration: number;
        };

        export type Hangup = {
            userAction: "HANGUP";
        };

    }

}

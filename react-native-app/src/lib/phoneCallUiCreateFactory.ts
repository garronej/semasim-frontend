
import { SyncEvent, VoidSyncEvent } from "frontend-shared/node_modules/ts-events-extended";
import { phoneNumber } from "frontend-shared/node_modules/phone-number";
import * as uuid from "uuid";
import RNCallKeep from "react-native-callkeep";
import * as types from "frontend-shared/dist/lib/types/userSimAndPhoneCallUi";
import { Observable, ObservableImpl } from "frontend-shared/dist/tools/Observable";
import * as helperTypes from "frontend-shared/dist/tools/helperTypes";
import { askUserForPermissions } from "./askUserForPermissions";
import * as rn from "react-native";
import * as hostKeepAlive from "frontend-shared/dist/lib/nativeModules/hostKeepAlive";
import * as hostAudioManager from "frontend-shared/dist/lib/nativeModules/hostAudioManager";

declare const alert: Function;

const log: typeof console.log = true ?
    ((...args: any[]) => console.log.apply(console, ["[lib/phoneCallUiCreateFactory]", ...args])) :
    (() => { });


let hasBeenCalled = false;

export const phoneCallUiCreateFactory: types.PhoneCallUi.CreateFactory = async params => {

    if (hasBeenCalled) {
        throw new Error("Wrong assertion");
    }

    hasBeenCalled = true;

    if (params.assertJsRuntimeEnv === "browser") {
        throw new Error("Wrong assertion");
    }

    const evts = await initialization(params.obsIsAtLeastOneSipRegistration);



    evts.didReceiveStartCallAction.attach(async evtData=> {

        log("TODO: evtDidReceiveStartCallAction", { evtData });

        /*
        log("Back to foreground");

        await new Promise(resolve => setTimeout(resolve, 5000));

        log("should go back to foreground...");

        RNCallKeep.backToForeground();

        rn.Alert.alert(
            "my title",
            "my content",
            [
              {
                text: "my cancel button",
                onPress: ()=> console.log("cancel pressed"),
                style: 'cancel',
              },
              { text: "ok",
                onPress: () => console.log("ok pressed")
              },
            ],
            { cancelable: false },
          );
        
        alert("So so so so");
        */

    });

    const onEstablished= getOnEstablished(evts);

    return userSim => ({
        "onIncoming": wdChat => {
            return null as any;
        },
        "onOutgoing": wdChat => {

            const callRef = { "uuid": uuid.v4() };

            RNCallKeep.startCall(
                callRef.uuid,
                wdChat.contactNumber,
                wdChat.contactName
            );

            log("====================> wesh c labu");


            //const obsEndCall= new ObservableImpl<boolean>(false);



            //TODO: Remove, hasardous test
            //RNCallKeep.updateDisplay(callRef.uuid, "foo bar", wdChat.contactNumber);

            hostKeepAlive.start();

            return {
                "onTerminated": message => {
                    

                    log(`onTerminated: ${message}`);

                    hostKeepAlive.stop();

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

                            log("====================> on established !!!!");

                            evts.endCall.detach(callRef);

                            //NOTE: For android
                            (RNCallKeep.setCurrentCallActive as any)(callRef.uuid);


                            //NOTE: For ios
                            RNCallKeep.reportConnectedOutgoingCallWithUUID(callRef.uuid);

                            return onEstablished(callRef)

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


    });


};



async function initialization(obsIsAtLeastOneSipRegistration: Observable<boolean>) {

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
        "didActivateAudioSession": new SyncEvent<null>(),
        "checkReachability": new SyncEvent<null>()
    };

    for (const type of [
        "didReceiveStartCallAction",
        "answerCall",
        "endCall",
        "didActivateAudioSession",
        "didDeactivateAudioSession",
        "didDisplayIncomingCall",
        "didPerformSetMutedCallAction",
        "didToggleHoldCallAction",
        "didPerformDTMFAction",
        "didResetProvider",
        "checkReachability"
    ] as const) {

        RNCallKeep.addEventListener(type, data => {

            log(`====================> event: ${type}`, data);

            if( !(type in evts)){
                log(`==========> WARNING: no handler for ${type}`);
                return;
            }

            const evt: SyncEvent<any> = evts[type as keyof typeof evts];

            evt.post(data);

        });

    }

    evts.checkReachability.attach(() => RNCallKeep.setReachable());

    await askUserForPermissions();

    try {

        log("Setup RNCallKeep");

        await RNCallKeep.setup({
            "ios": {
                "appName": "Semasim",
                "supportsVideo": false as const,
                "maximumCallGroups": "1" as const,
                "maximumCallsPerCallGroup": "1" as const
            },
            "android": {
                "alertTitle": "Permissions Required",
                "alertDescription":
                    "This application needs to access your phone calling accounts to make calls",
                "cancelButton": "Cancel",
                "okButton": "ok",
                "imageName": "semasim_icon_grayscale",
                "additionalPermissions": []
            }
        });

    } catch (error) {

        log("Unrecoverable error: " + error.message);

        throw error;

    }

    log("RNCallKeep setup success");

    {

        const setAvailability = () => { 

            log(`setAvailability: ${obsIsAtLeastOneSipRegistration.value}`);

            RNCallKeep.setAvailable(obsIsAtLeastOneSipRegistration.value);

        };

        obsIsAtLeastOneSipRegistration.evtChange.attach(() => setAvailability());

        setAvailability();

    }

    return evts;


}

function getCallEvts( 
    callUUID: string,
    evts: Pick<helperTypes.UnpackPromise<ReturnType<typeof initialization>>, "didPerformDTMFAction" | "didPerformSetMutedCallAction" | "endCall">,
) {


    const evts_ = {
        "didPerformSetMutedCallAction": new SyncEvent<{ muted: boolean; }>(),
        "didPerformDTMFAction": new SyncEvent<{ digits: string; }>()
    };


    const matcher= (evtData: { callUUID: string })=> evtData.callUUID === callUUID;

    const detach= ()=>{

        evts.endCall.getHandlers().filter(handler => handler.matcher === matcher).forEach(handler => handler.detach());

    };

    const evtEndCall = (() => {

        const out = new VoidSyncEvent();

        evts.endCall.attachOnce(
            matcher,
            () => {

                detach();

                out.post();

            }

        );

        return out;

    })();






    return {
        evts,
        "onLogicEndCall": () => {
            detach();
        },
        "setOnceUniqEndCallHandler": (() => {

            const boundTo: never[] = [];

            return (handler: () => void) => {

                evtEndCall.detach(boundTo);

                evtEndCall.attachOnce(boundTo, handler);

            };

        })()

    };



}


function getOnEstablished(
    evts: Pick<helperTypes.UnpackPromise<ReturnType<typeof initialization>>, "didPerformDTMFAction" | "didPerformSetMutedCallAction" | "endCall">,
) {
    return function onEstablished(callRef: { uuid: string; }): ReturnType<types.PhoneCallUi.OnEstablished> {

        const evtUserInput = new SyncEvent<types.PhoneCallUi.InCallUserAction>();

        evts.didPerformDTMFAction.attach(
            callRef,
            ({ digits }) => evtUserInput.post({
                "userAction": "DTMF",
                "signal": digits as types.PhoneCallUi.DtmFSignal,
                "duration": 250
            }
            )
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
}








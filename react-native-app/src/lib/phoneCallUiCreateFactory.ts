
import { SyncEvent } from "frontend-shared/node_modules/ts-events-extended";
import { phoneNumber } from "frontend-shared/node_modules/phone-number";
import * as uuid from "uuid";
import RNCallKeep from "react-native-callkeep";
import * as types from "frontend-shared/dist/lib/types/userSimAndPhoneCallUi";
import { Observable } from "frontend-shared/dist/tools/Observable";
import * as helperTypes from "frontend-shared/dist/tools/helperTypes";
import { askUserForPermissions } from "./askUserForPermissions";

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

    const onEstablished= getOnEstablished(evts);

    return userSim => ({
        "onIncoming": wdChat => {
            return null as any;
        },
        "onOutgoing": wdChat => {

            const callRef = { "uuid": uuid.v4() };

            RNCallKeep.startCall(
                callRef.uuid,
                phoneNumber.prettyPrint(
                    wdChat.contactNumber,
                    userSim.sim.country?.iso
                ),
                `${wdChat.contactName} with ${userSim.friendlyName}`
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
        "didActivateAudioSession": new SyncEvent<{}>()
    };

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

    log("RNCallKeep setup sucess");

    {

        const setAvailability = () => RNCallKeep.setAvailable(obsIsAtLeastOneSipRegistration.value);

        obsIsAtLeastOneSipRegistration.evtChange.attach(() => setAvailability());

        setAvailability();

    }

    return evts;


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

        evts.didPerformSetMutedCallAction.attach(
            callRef,
            ({ muted }) => {

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
}








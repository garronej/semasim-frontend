
import { SyncEvent } from "frontend-shared/node_modules/ts-events-extended";
import { phoneNumber } from "frontend-shared/node_modules/phone-number";
import * as hostPhoneCallUi from "../nativeModules/hostPhoneCallUi";
import * as hostKeepAlive from "../nativeModules/hostKeepAlive";
import * as types from "frontend-shared/dist/lib/types/PhoneCallUi";
import { askUserForPermissions } from "../askUserForPermissions";

const log: typeof console.log = true ?
    ((...args: any[]) => console.log(...["[lib/phoneCallUiCreateFactory/index.android]", ...args])) :
    (() => { });


let hasBeenCalled = false;

export const phoneCallUiCreateFactory: types.PhoneCallUi.CreateFactory = async params => {

    if (hasBeenCalled) {
        throw new Error("Should be called only once");
    }

    hasBeenCalled = true;

    if (params.assertJsRuntimeEnv !== "react-native") {
        throw new Error("Wrong assertion");
    }

    log("factory");

    try {

        await askUserForPermissions();

    } catch (error) {

        log(`TODO correct error: ${error.message}`);

    }

    hostPhoneCallUi.unregisterOtherPhoneAccounts(
        params.userSims.map(({ sim })=> sim.imsi)
    );

    await Promise.all(
        params.userSims.map(
            userSim => hostPhoneCallUi.registerOrUpdatePhoneAccount(
                userSim.sim.imsi,
                userSim.friendlyName,
                (() => {

                    const { fromImsi, fromNetwork } = userSim.sim.serviceProvider;

                    return fromImsi ?? fromNetwork ?? "";

                })(),
                userSim.sim.storage.number !== undefined ?
                    phoneNumber.build(
                        userSim.sim.storage.number,
                        userSim.sim.country?.iso
                    ) : null
            )
        )
    );

    while (true) {

        const areAllPhoneAccountEnabled = await Promise.all(
            params.userSims.map(({ sim: { imsi } }) =>
                hostPhoneCallUi.getIsSimPhoneAccountEnabled(imsi)
            )
        ).then(arr => arr.every(isSimPhoneAccountEnabled => isSimPhoneAccountEnabled));

        //TODO: Message, all SIMs need do be enabled

        if (!areAllPhoneAccountEnabled) {
            await hostPhoneCallUi.openPhoneAccountSettings();
            continue;
        }

        break;

    }

    //TODO: Incorporate to hotPhoneCallUi implementation.
    hostPhoneCallUi.evtEndCall.attach(() => hostKeepAlive.stop());

    //TODO: We need an event to watch when friendlyName change and restart app.

    log("factory return");

    return function phoneCallUiCreate(params) {

        if (params.assertJsRuntimeEnv !== "react-native") {
            throw new Error("Wrong assertion");
        }

        log("create", params.userSim.friendlyName);

        const { userSim, obsIsSipRegistered } = params;

        hostPhoneCallUi.setIsPhoneAccountSipRegistered(
            userSim.sim.imsi, obsIsSipRegistered.value
        );

        obsIsSipRegistered.evtChange.attach(
            isSipRegistered => hostPhoneCallUi.setIsPhoneAccountSipRegistered(
                userSim.sim.imsi, isSipRegistered
            )
        );

        const phoneCallUi: types.PhoneCallUi = {
            "openUiForOutgoingCall": wdChat => hostPhoneCallUi.placeCall(
                ~~(Math.random() * 100000),
                userSim.sim.imsi,
                wdChat.contactNumber,
                wdChat.contactName
            ),
            "openUiForIncomingCall": wdChat => {
                throw new Error("TODO");
            },
            "evtUiOpenedForOutgoingCall": new SyncEvent()
        };

        hostPhoneCallUi.evtUiOpenForOutgoingCall.attach(
            ({ imsi }) => imsi === userSim.sim.imsi,
            ({ phoneNumber, phoneCallRef }) => {

                hostKeepAlive.start();

                phoneCallUi.evtUiOpenedForOutgoingCall.post({
                    phoneNumber,
                    "onTerminated": message => {

                        hostKeepAlive.stop();

                        log(`Call terminated from logic, message: ${message}`);

                        hostPhoneCallUi.reportCallTerminated(phoneCallRef);

                    },
                    "onRingback": () => ({
                        "onEstablished": () => {

                            hostPhoneCallUi.setCallActive(phoneCallRef);

                            return getOnEstablishedReturnedApi(phoneCallRef);

                        },
                        "prUserInput": new Promise(
                            resolve => hostPhoneCallUi.evtEndCall.attachOnce(
                                ({ phoneCallRef: phoneCallRef_ }) =>
                                    phoneCallRef_ === phoneCallRef,
                                () => resolve({ "userAction": "HANGUP" })
                            )
                        )
                    }),
                    "prUserInput": new Promise(
                        resolve => hostPhoneCallUi.evtEndCall.attachOnce(
                            ({ phoneCallRef: phoneCallRef_ }) => phoneCallRef_ === phoneCallRef,
                            () => resolve({ "userAction": "CANCEL" })
                        )
                    )
                });


            }
        );

        return phoneCallUi;

    }

}

function getOnEstablishedReturnedApi(phoneCallRef: number): ReturnType<types.PhoneCallUi.OnEstablished> {

    const evtUserInput = new SyncEvent<types.PhoneCallUi.InCallUserAction>();

    hostPhoneCallUi.evtDtmf.attach(
        ({ phoneCallRef: phoneCallRef_ }) => phoneCallRef_ === phoneCallRef,
        ({ dtmf }) => evtUserInput.post({
            "userAction": "DTMF",
            "signal": dtmf as types.PhoneCallUi.DtmFSignal,
            "duration": 250
        })
    );

    hostPhoneCallUi.evtEndCall.attachOnce(
        ({ phoneCallRef: phoneCallRef_ }) => phoneCallRef_ === phoneCallRef,
        () => evtUserInput.post({ "userAction": "HANGUP" })
    );

    return { evtUserInput };

}


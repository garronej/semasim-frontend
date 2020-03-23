
import { SyncEvent } from "frontend-shared/node_modules/ts-events-extended";
import * as hostPhoneCallUi from "../nativeModules/hostPhoneCallUi";
import * as hostKeepAlive from "../nativeModules/hostKeepAlive";
import * as types from "frontend-shared/dist/lib/types/PhoneCallUi";
import { askUserForPermissions } from "../askUserForPermissions";
import { assert } from "frontend-shared/dist/tools/assert";

const log: typeof console.log = true ?
    ((...args: any[]) => console.log(...["[lib/phoneCallUiCreateFactory/index.android]", ...args])) :
    (() => { });


let hasBeenCalled = false;

export const phoneCallUiCreateFactory: types.PhoneCallUi.CreateFactory = async params => {

    if (hasBeenCalled) {
        throw new Error("Should be called only once");
    }

    hasBeenCalled = true;

    const { sims } = params;

    try {

        await askUserForPermissions();

    } catch (error) {

        log(`TODO correct error: ${error.message}`);

    }

    /*
    hostPhoneCallUi.unregisterOtherPhoneAccounts(
        params.userSims.map(({ sim })=> sim.imsi)
    );
    */

    hostPhoneCallUi.unregisterOtherPhoneAccounts(
        sims.map(({ imsi })=> imsi)
    );

    await Promise.all(
        sims.map(
            sim => hostPhoneCallUi.registerOrUpdatePhoneAccount(
                sim.imsi,
                sim.friendlyName,
                sim.serviceProvider ?? "",
                sim.phoneNumber ?? null
            )
        )
    );

    while (true) {

        const areAllPhoneAccountEnabled = await Promise.all(
            sims.map(({ imsi }) =>
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


    //TODO: We need an event to watch when friendlyName change and restart app.

    return function phoneCallUiCreate(params) {

        assert(params.assertJsRuntimeEnv === "react-native");

        const sim = sims.find(({ imsi })=> imsi === params.imsi)!;

        log("create", sim.friendlyName);


        /*

        const { obsIsSipRegistered } = params;
        hostPhoneCallUi.setIsPhoneAccountSipRegistered(
            userSim.sim.imsi, obsIsSipRegistered.value
        );

        obsIsSipRegistered.evtChange.attach(
            isSipRegistered => hostPhoneCallUi.setIsPhoneAccountSipRegistered(
                userSim.sim.imsi, isSipRegistered
            )
        );
        */


        const phoneCallUi: types.PhoneCallUi = {
            "openUiForOutgoingCall": (phoneNumberRaw) => hostPhoneCallUi.placeCall(
                ~~(Math.random() * 100000),
                sim.imsi,
                phoneNumberRaw
            ),
            "openUiForIncomingCall": wdChat => {
                throw new Error("TODO");
            },
            "evtUiOpenedForOutgoingCall": new SyncEvent()
        };

        hostPhoneCallUi.evtUiOpenForOutgoingCall.attach(
            ({ imsi }) => imsi === sim.imsi,
            ({ phoneNumberRaw, phoneCallRef, setContactName, evtDtmf, evtEndCall }) => {

                setContactName(
                    params.getContactName(phoneNumberRaw)
                );

                hostKeepAlive.start();

                //TODO: Incorporate to hotPhoneCallUi implementation.
                evtEndCall.attach(() => hostKeepAlive.stop());

                phoneCallUi.evtUiOpenedForOutgoingCall.post({
                    phoneNumberRaw,
                    "onTerminated": message => {

                        hostKeepAlive.stop();

                        log(`Call terminated from logic, message: ${message}`);

                        hostPhoneCallUi.reportCallTerminated(phoneCallRef);

                    },
                    "onRingback": () => ({
                        "onEstablished": () => {

                            hostPhoneCallUi.setCallActive(phoneCallRef);

                            return getOnEstablishedReturnedApi({evtDtmf, evtEndCall});

                        },
                        "prUserInput": new Promise(
                            resolve => evtEndCall.attachOnce(
                                () => resolve({ "userAction": "HANGUP" })
                            )
                        )
                    }),
                    "prUserInput": new Promise(
                        resolve => evtEndCall.attachOnce(
                            () => resolve({ "userAction": "CANCEL" })
                        )
                    )
                });


            }
        );

        return phoneCallUi;

    }

}

//function getOnEstablishedReturnedApi(phoneCallRef: number): ReturnType<types.PhoneCallUi.OnEstablished> {
function getOnEstablishedReturnedApi(
    {evtDtmf, evtEndCall}: Pick<SyncEvent.Type<typeof hostPhoneCallUi.evtUiOpenForOutgoingCall>, "evtDtmf" | "evtEndCall">
): ReturnType<types.PhoneCallUi.OnEstablished> {

    const evtUserInput = new SyncEvent<types.PhoneCallUi.InCallUserAction>();

    evtDtmf.attach(
        ({ dtmf }) => evtUserInput.post({
            "userAction": "DTMF",
            "signal": dtmf as types.PhoneCallUi.DtmFSignal,
            "duration": 250
        })
    );

    evtEndCall.attachOnce(
        () => evtUserInput.post({ "userAction": "HANGUP" })
    );

    return { evtUserInput };

}


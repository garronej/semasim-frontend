

import * as rn from "react-native";
import { Evt, UnpackEvt } from "frontend-shared/node_modules/evt";
declare const window: any;

const log: typeof console.log = true ?
    ((...args: any[]) => console.log(...["[lib/exposeNativeModule]", ...args])) :
    (() => { });


const apiExposedToHostInvocationEventName = "apiExposedToHostInvocation";

const evtApiExposeToHostInvocation = new Evt<{
    functionName: string;
    params: (string | number | null)[];
}>();

//NOTE: We do it here or we risk missing events.
rn.DeviceEventEmitter.addListener(
    apiExposedToHostInvocationEventName,
    (eventData: UnpackEvt<typeof evtApiExposeToHostInvocation>) =>
        evtApiExposeToHostInvocation.postAsyncOnceHandled(eventData)
);

export async function run() {

    if (run.hasBeenCalled) {
        throw new Error("should be called only once");
    }

    run.hasBeenCalled = true;

    if (rn.Platform.OS === "android" && !doHeadlessTaskRegistering.hasBeenCalled) {
        throw new Error("headless tasks should have been registered");
    }

    {

        const apiExposedByHost = {};

        const { HostCryptoLib, HostWebRtc, HostKfd, HostKeepAlive, HostAudioManager, HostPhoneCallUi } = rn.NativeModules;

        [HostCryptoLib, HostWebRtc, HostKfd, HostKeepAlive, HostAudioManager, HostPhoneCallUi].forEach(hostApi => Object.assign(apiExposedByHost, hostApi));

        Object.assign(window, { apiExposedByHost });

    }

    {

        const apiExposedToHost: any = await Promise.all([
            import("frontend-shared/dist/lib/nativeModules/hostCryptoLib"),
            import("frontend-shared/dist/lib/nativeModules/hostWebRtc"),
            import("frontend-shared/dist/lib/nativeModules/hostKfd"),
            import("./nativeModules/hostKeepAlive"),
            import("./nativeModules/hostAudioManager"),
            import("./nativeModules/hostPhoneCallUi")
        ] as const).then(
            arr => arr
                .map(({ apiExposedToHost }) => apiExposedToHost)
                .reduce((acc, val) => ({ ...acc, ...val }), {})
        );


        evtApiExposeToHostInvocation.attach(
            ({ functionName, params }) => apiExposedToHost[functionName](...params)
        );

    }


}

run.hasBeenCalled = false;

export function doHeadlessTaskRegistering(
    registerHeadlessTask: typeof rn.AppRegistry["registerHeadlessTask"]
) {

    if (doHeadlessTaskRegistering.hasBeenCalled) {
        throw new Error("should be called only once");
    }

    log("running doHeadlessTaskRegistering");

    doHeadlessTaskRegistering.hasBeenCalled = true;

    registerHeadlessTask(
        apiExposedToHostInvocationEventName,
        () => async (eventData: UnpackEvt<typeof evtApiExposeToHostInvocation>) => {

            log(`==========> ${eventData.functionName} called from HeadlessJS`);

            evtApiExposeToHostInvocation.postAsyncOnceHandled(eventData);

        }
    );

}

doHeadlessTaskRegistering.hasBeenCalled = false;




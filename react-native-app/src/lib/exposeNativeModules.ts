

import * as rn from "react-native";
declare const window: any;

export async function run() {

    {

        const apiExposedByHost = {};

        const { HostCryptoLib, HostWebRtc, HostKfd } = rn.NativeModules;

        [HostCryptoLib, HostWebRtc, HostKfd].forEach(hostApi => Object.assign(apiExposedByHost, hostApi));

        Object.assign(window, { apiExposedByHost });

    }

    const apiExposedToHost: any = await Promise.all([
        import("frontend-shared/dist/lib/nativeModules/hostCryptoLib"),
        import("frontend-shared/dist/lib/nativeModules/hostWebRtc"),
        import("frontend-shared/dist/lib/nativeModules/hostKfd"),
    ]).then(
        arr => arr
            .map(({ apiExposedToHost }) => apiExposedToHost)
            .reduce((acc, val) => ({ ...acc, ...val }), {})
    );


    rn.DeviceEventEmitter.addListener(
        "apiExposedToHostInvocation",
        (e: { functionName: string; params: (string | number | null)[] }) => 
            apiExposedToHost[e.functionName].apply(apiExposedToHost, e.params)
    );

}



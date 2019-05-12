import { SyncEvent } from "ts-events-extended";

export type Api = {
    setListeners(listeners: Api.Listeners): void;
    methods: Api.Methods;
};

export namespace Api {

    export type Methods = {
        getUserMedia(
            mediaStreamRef: number,
            mediaStreamConstraintsJson: string,
            callRef: number
        ): void;
        createRTCPeerConnection(
            rtcPeerConnectionRef: number,
            rtcConfigurationJson: string
        ): void;
        addStreamToRTCPeerConnection(
            rtcPeerConnectionRef: number,
            mediaStreamRef: number
        ): void;
        stopMediaStreamTrack(
            mediaStreamRef: number
        ): void;
        /** return RtcSessionDescriptionInit serialized ( string )*/
        createOfferForRTCPeerConnection(
            rtcPeerConnectionRef: number,
            callRef: number
        ): void;
        setLocalDescriptionOfRTCPeerConnection(
            rtcPeerConnectionRef: number,
            rtcSessionDescriptionInitJson: string,
            callRef: number
        ): void;
        setRemoteDescriptionOfRTCPeerConnection(
            rtcPeerConnectionRef: number,
            rtcSessionDescriptionInitJson: string,
            callRef: number
        );
        closeRTCPeerConnection(
            rtcPeerConnectionRef: number
        ): void;
    };

    export type Listeners = {
        onIceconnectionstatechange(
            rtcPeerConnectionRef: number,
            iceConnectionState: RTCIceConnectionState
        ): void;
        onIcecandidate(
            rtcPeerConnectionRef: number,
            rtcIceCandidateInitOrNullJson: string,
            localDescriptionRTCSessionDescriptionInitOrNullJson: string
        ): void;
        onSignalingstatechange(
            rtcPeerConnectionRef: number,
            rtcSignalingState: RTCSignalingState
        ): void;
        onMethodReturn(
            callRef: number,
            out: string | null
        ): void;
    };

}

export function useAlternativeWebRTCImplementation(api: Api) {

    console.log("Using alternative WebRTC implementation");

    const getCounter = (() => {

        let counter = 0;

        return () => counter++;

    })();

    const evtIcecandidate = new SyncEvent<{
        rtcPeerConnectionRef: number;
        rtcIceCandidateInitOrNullJson: string;
        localDescriptionRTCSessionDescriptionInitOrNullJson: string;
    }>();

    const evtIceconnectionstatechange = new SyncEvent<{
        rtcPeerConnectionRef: number;
        iceConnectionState: RTCIceConnectionState;
    }>();

    const evtSignalingstatechange = new SyncEvent<{
        rtcPeerConnectionRef: number;
        rtcSignalingState: RTCSignalingState;
    }>();

    const evtMethodReturn = new SyncEvent<{
        callRef: number;
        out: string | null;
    }>();

    api.setListeners({
        "onIcecandidate": (
            rtcPeerConnectionRef,
            rtcIceCandidateInitOrNullJson,
            localDescriptionRTCSessionDescriptionInitOrNullJson
        ) => evtIcecandidate.post({
            rtcPeerConnectionRef,
            rtcIceCandidateInitOrNullJson,
            localDescriptionRTCSessionDescriptionInitOrNullJson
        }),
        "onIceconnectionstatechange": (
            rtcPeerConnectionRef,
            iceConnectionState
        ) => evtIceconnectionstatechange.post({
            rtcPeerConnectionRef,
            iceConnectionState
        }),
        "onSignalingstatechange": (
            rtcPeerConnectionRef,
            rtcSignalingState
        ) => evtSignalingstatechange.post({
            rtcPeerConnectionRef,
            rtcSignalingState
        }),
        "onMethodReturn": (
            callRef,
            out
        ) => evtMethodReturn.post({ callRef, out })
    });

    const refByMediaStream = new WeakMap<Object, number>();

    const getUserMediaProxy = async function getUserMedia(mediaStreamConstraints: MediaStreamConstraints): Promise<MediaStream> {

        const mediaStreamRef = getCounter();

        {

            const ref = getCounter();

            api.methods.getUserMedia(
                mediaStreamRef,
                JSON.stringify(mediaStreamConstraints),
                ref
            );

            await evtMethodReturn.waitFor(({ callRef }) => callRef === ref);

        }

        const mediaStreamProxy = (() => {

            const getTracks: () => MediaStreamTrack[] = () => {

                const mediaStreamTrackProxy = (() => {

                    const stop: () => void = () =>
                        api.methods.stopMediaStreamTrack(mediaStreamRef);

                    return { stop };

                })();

                return [mediaStreamTrackProxy as MediaStreamTrack];

            };

            const wrap = { getTracks };

            return Object.setPrototypeOf(
                wrap,
                { "constructor": function MediaStream() { } }
            ) as typeof wrap;

        })();

        refByMediaStream.set(mediaStreamProxy, mediaStreamRef);

        return mediaStreamProxy as any;

    };

    const RTCPeerConnectionProxy = function RTCPeerConnection(rtcConfiguration: RTCConfiguration): RTCPeerConnection {

        const rtcPeerConnectionRef = getCounter();

        api.methods.createRTCPeerConnection(
            rtcPeerConnectionRef,
            JSON.stringify(rtcConfiguration)
        );


        const properties = {
            //WARNING: Never updated, I guess in our implementation it's ok...
            "iceGatheringState": "new" as RTCIceGatheringState,
            "iceConnectionState": "new" as RTCIceConnectionState,
            "localDescription": null as RTCSessionDescription | null,
            "signalingState": "stable" as RTCSignalingState
        };

        evtIceconnectionstatechange.attach(
            ({ rtcPeerConnectionRef: ref }) => ref === rtcPeerConnectionRef,
            ({ iceConnectionState }) => properties.iceConnectionState = iceConnectionState
        );

        evtSignalingstatechange.attach(
            ({ rtcPeerConnectionRef: ref }) => ref === rtcPeerConnectionRef,
            ({ rtcSignalingState }) => properties.signalingState = rtcSignalingState
        );

        evtIcecandidate.attach(
            ({ rtcPeerConnectionRef: ref }) => ref === rtcPeerConnectionRef,
            ({ localDescriptionRTCSessionDescriptionInitOrNullJson }) => properties.localDescription = (() => {

                const localDescriptionRTCSessionDescriptionInitOrNull: RTCSessionDescriptionInit | null =
                    JSON.parse(localDescriptionRTCSessionDescriptionInitOrNullJson);

                return localDescriptionRTCSessionDescriptionInitOrNull !== null ?
                    new RTCSessionDescription(localDescriptionRTCSessionDescriptionInitOrNull) : null;

            })()
        );

        const rtcPeerConnectionProxy = {
            "createOffer": async (_options?: RTCOfferOptions): Promise<RTCSessionDescriptionInit> => {

                const ref = getCounter();

                api.methods.createOfferForRTCPeerConnection(rtcPeerConnectionRef, ref);

                const { out: rtcSessionDescriptionInitJson } = await evtMethodReturn.waitFor(({ callRef }) => callRef === ref);

                //NOTE: Just to help debug, RTCSessionDescriptionInit is not a class, just a type.
                /*
                return Object.setPrototypeOf(
                    JSON.parse(rtcSessionDescriptionInitJson!),
                    { "constructor": function RTCSessionDescriptionInit() { } }
                );
                */

                return new RTCSessionDescription(
                    JSON.parse(rtcSessionDescriptionInitJson!)
                );

            },
            "setLocalDescription": async (rtcSessionDescriptionInit: RTCSessionDescriptionInit): Promise<void> => {

                properties.localDescription = new RTCSessionDescription(rtcSessionDescriptionInit);

                const ref = getCounter();

                api.methods.setLocalDescriptionOfRTCPeerConnection(
                    rtcPeerConnectionRef,
                    JSON.stringify(rtcSessionDescriptionInit),
                    ref
                );

                await evtMethodReturn.waitFor(({ callRef }) => callRef === ref);

            },
            "setRemoteDescription": async (rtcSessionDescriptionInit: RTCSessionDescriptionInit): Promise<void> => {

                const ref = getCounter();

                api.methods.setRemoteDescriptionOfRTCPeerConnection(
                    rtcPeerConnectionRef,
                    JSON.stringify(rtcSessionDescriptionInit),
                    ref
                );

                await evtMethodReturn.waitFor(({ callRef }) => callRef === ref);

            },
            ...(() => {

                const boundToByListener = new WeakMap<
                    (ev: RTCPeerConnectionEventMap[keyof RTCPeerConnectionEventMap]) => any,
                    Object
                >();

                const addEventListener: <K extends keyof RTCPeerConnectionEventMap>(
                    type: K,
                    listener: (this: RTCPeerConnection, ev: RTCPeerConnectionEventMap[K]) => any
                ) => void = (type, listener) => {

                    const boundTo = {};
                    boundToByListener.set(listener, boundTo);

                    switch (type) {
                        case "iceconnectionstatechange":
                            evtIceconnectionstatechange.attach(
                                ({ rtcPeerConnectionRef: ref }) => ref === rtcPeerConnectionRef,
                                boundTo,
                                () => listener.call(rtcPeerConnectionProxy, undefined)
                            );
                            return;;
                        case "icecandidate":
                            evtIcecandidate.attach(
                                ({ rtcPeerConnectionRef: ref }) => ref === rtcPeerConnectionRef,
                                boundTo,
                                ({ rtcIceCandidateInitOrNullJson }) =>
                                    listener.call(
                                        rtcPeerConnectionProxy,
                                        {
                                            "candidate": (() => {

                                                const rtcIceCandidateInitOrNull: RTCIceCandidateInit | null = JSON.parse(rtcIceCandidateInitOrNullJson);

                                                return rtcIceCandidateInitOrNull !== null ? new RTCIceCandidate(rtcIceCandidateInitOrNull) : null;

                                            })()
                                        }
                                    )
                            );
                            return;
                        case "track":
                            //NOTE: Swallow the event, JsSip does not listen to this event, track attached by remote.
                            return;
                    }

                    throw Error(`no handler for event ${type}`);

                };

                const removeEventListener: <K extends keyof RTCPeerConnectionEventMap>(
                    type: K,
                    listener: (this: RTCPeerConnection, ev: RTCPeerConnectionEventMap[K]) => any, options?: boolean | EventListenerOptions
                ) => void = (type, listener) => {

                    const evt: SyncEvent<any> | undefined = (() => {

                        switch (type) {
                            case "iceconnectionstatechange": return evtIceconnectionstatechange;
                            case "icecandidate": return evtIcecandidate;
                            default: return undefined;
                        }

                    })();

                    if (evt === undefined) {
                        return;
                    }

                    evt
                        .getHandlers()
                        .find(({ boundTo }) => boundTo === boundToByListener.get(listener))!
                        .detach()
                        ;

                };

                return { addEventListener, removeEventListener };

            })(),
            "addStream": (mediaStream: MediaStream): void => api.methods.addStreamToRTCPeerConnection(
                rtcPeerConnectionRef,
                refByMediaStream.get(mediaStream)!
            ),
            "close": (): void => api.methods.closeRTCPeerConnection(rtcPeerConnectionRef)
        };

        for (const propertyName of Object.keys(properties)) {

            Object.defineProperty(
                rtcPeerConnectionProxy,
                propertyName,
                { 
                    "get": () => properties[propertyName], 
                    "enumerable": true, 
                    "configurable": true 
                }
            );

        }

        return Object.setPrototypeOf(
            rtcPeerConnectionProxy,
            { "constructor": RTCPeerConnection }
        ) as any;

    };

    navigator.mediaDevices.getUserMedia = getUserMediaProxy;
    window["RTCPeerConnection"] = RTCPeerConnectionProxy;


}

export const localApi: Api = (() => {

    const RTCPeerConnectionBackup = RTCPeerConnection;
    const getUserMediaBackup = navigator.mediaDevices.getUserMedia;

    const mediaStreamByRef = new Map<number, MediaStream>();

    const rtcPeerConnectionByRef = new Map<number, RTCPeerConnection>();

    let listeners: Api.Listeners;

    const methods: Api.Methods = {
        "getUserMedia": (mediaStreamRef, mediaStreamConstraintsJson, callRef) =>
            getUserMediaBackup(
                JSON.parse(mediaStreamConstraintsJson)
            ).then(mediaStream => {
                mediaStreamByRef.set(mediaStreamRef, mediaStream);
                listeners.onMethodReturn(callRef, null);
            }),
        "createRTCPeerConnection": (rtcPeerConnectionRef, rtcConfigurationJson) => {

            const rtcPeerConnection = new RTCPeerConnectionBackup((() => {

                const rtcConfiguration: RTCConfiguration = JSON.parse(rtcConfigurationJson);

                return rtcConfiguration;

            })());

            rtcPeerConnection.addEventListener(
                "iceconnectionstatechange",
                () => listeners.onIceconnectionstatechange(
                    rtcPeerConnectionRef,
                    rtcPeerConnection.iceConnectionState
                )
            );

            rtcPeerConnection.addEventListener(
                "icecandidate",
                rtcPeerConnectionEvent => listeners.onIcecandidate(
                    rtcPeerConnectionRef,
                    JSON.stringify(rtcPeerConnectionEvent.candidate),
                    JSON.stringify(rtcPeerConnection.localDescription)
                )
            );

            rtcPeerConnection.addEventListener(
                "signalingstatechange",
                () => listeners.onSignalingstatechange(
                    rtcPeerConnectionRef,
                    rtcPeerConnection.signalingState
                )
            );

            rtcPeerConnection.addEventListener(
                "track",
                ({ streams: [stream] }) => {

                    const audio = document.createElement("audio");

                    audio.autoplay = true;

                    audio.srcObject = stream;

                }
            );

            rtcPeerConnectionByRef.set(rtcPeerConnectionRef, rtcPeerConnection);

        },
        "addStreamToRTCPeerConnection": (rtcPeerConnectionRef, mediaStreamRef) =>
            rtcPeerConnectionByRef.get(rtcPeerConnectionRef)!["addStream"](
                mediaStreamByRef.get(mediaStreamRef)!
            ),
        "stopMediaStreamTrack": mediaStreamRef => {

            const [mediaStreamTrack] = mediaStreamByRef.get(mediaStreamRef)!.getTracks()

            if (mediaStreamTrack === undefined) {
                return;
            }

            mediaStreamTrack.stop();

        },
        "createOfferForRTCPeerConnection": (rtcPeerConnectionRef, callRef) =>
            rtcPeerConnectionByRef.get(rtcPeerConnectionRef)!
                .createOffer()
                .then(rtcSessionDescriptionInit => listeners.onMethodReturn(
                    callRef,
                    JSON.stringify(rtcSessionDescriptionInit)
                )),
        "setLocalDescriptionOfRTCPeerConnection": (rtcPeerConnectionRef, rtcSessionDescriptionInitJson, callRef) =>
            rtcPeerConnectionByRef.get(rtcPeerConnectionRef)!
                .setLocalDescription(JSON.parse(rtcSessionDescriptionInitJson))
                .then(() => listeners.onMethodReturn(callRef, null)),
        "setRemoteDescriptionOfRTCPeerConnection": (rtcPeerConnectionRef, rtcSessionDescriptionInitJson, callRef) =>
            rtcPeerConnectionByRef.get(rtcPeerConnectionRef)!
                .setRemoteDescription(JSON.parse(rtcSessionDescriptionInitJson))
                .then(() => listeners.onMethodReturn(callRef, null))
        ,
        "closeRTCPeerConnection": rtcPeerConnectionRef =>
            rtcPeerConnectionByRef.get(rtcPeerConnectionRef)!
                .close()
    };

    return { methods, "setListeners": listeners_ => listeners = listeners_ };

})();


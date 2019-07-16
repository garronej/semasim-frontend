import { SyncEvent } from "ts-events-extended";

/** Api that the host should expose. (apiExposedByHost)*/
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
    /** return RtcSessionDescriptionInit */
    createAnswerForRTCPeerConnection(
        rtcPeerConnectionRef: number,
        callRef: number
    ): void;
    /** return RtcSessionDescriptionInit */
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
    ): void;
    closeRTCPeerConnection(
        rtcPeerConnectionRef: number
    ): void;
};

/** Api that should be exposed to the host (apiExposedToHost) */
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
        out: string | undefined
    ): void;
};


export function overrideWebRTCImplementation(methods: Methods): Listeners {

    console.log("Using alternative WebRTC implementation !");

    const getCounter = (() => {

        let counter = (() => {
            const min = -2147483000;
            const max = 1147483000;
            return Math.floor(Math.random() * (max - min)) + min;
        })();

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
        out: string | undefined;
    }>();



    const refByMediaStream = new WeakMap<MediaStream, number>();

    const getUserMediaProxy = async function getUserMedia(mediaStreamConstraints: MediaStreamConstraints): Promise<MediaStream> {

        const mediaStreamRef = getCounter();

        {

            const ref = getCounter();

            methods.getUserMedia(
                mediaStreamRef,
                JSON.stringify(mediaStreamConstraints),
                ref
            );

            await evtMethodReturn.waitFor(({ callRef }) => callRef === ref);

        }

        const mediaStreamProxy: MediaStream = Object.setPrototypeOf(
            {
                "getTracks": (): MediaStreamTrack[] => [
                    ({
                        "stop": (): void => methods.stopMediaStreamTrack(mediaStreamRef)
                    }) as any
                ]
            },
            { "constructor": function MediaStream() { } }
        );

        refByMediaStream.set(mediaStreamProxy, mediaStreamRef);

        return mediaStreamProxy;

    };

    const RTCPeerConnectionProxy = function RTCPeerConnection(rtcConfiguration: RTCConfiguration): RTCPeerConnection {

        const rtcPeerConnectionRef = getCounter();

        methods.createRTCPeerConnection(
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
            "createAnswer": async (_options?: RTCOfferOptions): Promise<RTCSessionDescriptionInit> => {

                const ref = getCounter();

                methods.createAnswerForRTCPeerConnection(rtcPeerConnectionRef, ref);

                const { out: rtcSessionDescriptionInitJson } = await evtMethodReturn.waitFor(({ callRef }) => callRef === ref);

                //NOTE: We could just JSON.parse, as the return type is *Init
                return new RTCSessionDescription(
                    JSON.parse(rtcSessionDescriptionInitJson!)
                );


            },
            "createOffer": async (_options?: RTCOfferOptions): Promise<RTCSessionDescriptionInit> => {

                const ref = getCounter();

                methods.createOfferForRTCPeerConnection(rtcPeerConnectionRef, ref);

                const { out: rtcSessionDescriptionInitJson } = await evtMethodReturn.waitFor(({ callRef }) => callRef === ref);

                //NOTE: We could just JSON.parse, as the return type is *Init
                return new RTCSessionDescription(
                    JSON.parse(rtcSessionDescriptionInitJson!)
                );

            },
            "setLocalDescription": async (rtcSessionDescriptionInit: RTCSessionDescriptionInit): Promise<void> => {

                properties.localDescription = new RTCSessionDescription(rtcSessionDescriptionInit);

                const ref = getCounter();

                methods.setLocalDescriptionOfRTCPeerConnection(
                    rtcPeerConnectionRef,
                    JSON.stringify(rtcSessionDescriptionInit),
                    ref
                );

                await evtMethodReturn.waitFor(({ callRef }) => callRef === ref);

            },
            "setRemoteDescription": async (rtcSessionDescriptionInit: RTCSessionDescriptionInit): Promise<void> => {

                const ref = getCounter();

                methods.setRemoteDescriptionOfRTCPeerConnection(
                    rtcPeerConnectionRef,
                    JSON.stringify(rtcSessionDescriptionInit),
                    ref
                );

                await evtMethodReturn.waitFor(({ callRef }) => callRef === ref);

            },
            ...(() => {

                const boundToByListener = new WeakMap<(ev: any) => any, Object>();

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
            "addStream": (mediaStream: MediaStream): void => methods.addStreamToRTCPeerConnection(
                rtcPeerConnectionRef,
                refByMediaStream.get(mediaStream)!
            ),
            "close": (): void => methods.closeRTCPeerConnection(rtcPeerConnectionRef)
        } as any as RTCPeerConnection;

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
        );

    };

    navigator.mediaDevices.getUserMedia = getUserMediaProxy;

    window["RTCPeerConnection"] = RTCPeerConnectionProxy;

    return {
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
    };


}

export function testOverrideWebRTCImplementation() {

    const RTCPeerConnectionBackup = RTCPeerConnection;
    const getUserMediaBackup = navigator.mediaDevices.getUserMedia;

    const mediaStreamByRef = new Map<number, MediaStream>();

    const rtcPeerConnectionByRef = new Map<number, RTCPeerConnection>();

    const listeners = overrideWebRTCImplementation({
        "getUserMedia": (mediaStreamRef, mediaStreamConstraintsJson, callRef) =>
            getUserMediaBackup(
                JSON.parse(mediaStreamConstraintsJson)
            ).then(mediaStream => {
                mediaStreamByRef.set(mediaStreamRef, mediaStream);
                listeners.onMethodReturn(callRef, undefined);
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
        ...(() => {

            const createXForRTCPeerConnection = (
                xIs: "ANSWER" | "OFFER",
                rtcPeerConnectionRef: number,
                callRef: number
            ) => rtcPeerConnectionByRef.get(rtcPeerConnectionRef)!
            [xIs === "ANSWER" ? "createAnswer" : "createOffer"]()
                .then(rtcSessionDescriptionInit => listeners.onMethodReturn(
                    callRef,
                    JSON.stringify(rtcSessionDescriptionInit)
                ));

            const createAnswerForRTCPeerConnection: Methods["createAnswerForRTCPeerConnection"] =
                (rtcPeerConnectionRef, callRef) => createXForRTCPeerConnection("ANSWER", rtcPeerConnectionRef, callRef);

            const createOfferForRTCPeerConnection: Methods["createOfferForRTCPeerConnection"] =
                (rtcPeerConnectionRef, callRef) => createXForRTCPeerConnection("OFFER", rtcPeerConnectionRef, callRef);

            return { createAnswerForRTCPeerConnection, createOfferForRTCPeerConnection };

        })(),
        "setLocalDescriptionOfRTCPeerConnection": (rtcPeerConnectionRef, rtcSessionDescriptionInitJson, callRef) =>
            rtcPeerConnectionByRef.get(rtcPeerConnectionRef)!
                .setLocalDescription(JSON.parse(rtcSessionDescriptionInitJson))
                .then(() => listeners.onMethodReturn(callRef, undefined)),
        "setRemoteDescriptionOfRTCPeerConnection": (rtcPeerConnectionRef, rtcSessionDescriptionInitJson, callRef) =>
            rtcPeerConnectionByRef.get(rtcPeerConnectionRef)!
                .setRemoteDescription(JSON.parse(rtcSessionDescriptionInitJson))
                .then(() => listeners.onMethodReturn(callRef, undefined))
        ,
        "closeRTCPeerConnection": rtcPeerConnectionRef =>
            rtcPeerConnectionByRef.get(rtcPeerConnectionRef)!
                .close()

    });


}



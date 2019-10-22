/** Api that the host should expose. (apiExposedByHost)*/
export declare type Methods = {
    getUserMedia(mediaStreamRef: number, mediaStreamConstraintsJson: string, callRef: number): void;
    createRTCPeerConnection(rtcPeerConnectionRef: number, rtcConfigurationJson: string): void;
    addStreamToRTCPeerConnection(rtcPeerConnectionRef: number, mediaStreamRef: number): void;
    stopMediaStreamTrack(mediaStreamRef: number): void;
    /** return RtcSessionDescriptionInit */
    createAnswerForRTCPeerConnection(rtcPeerConnectionRef: number, callRef: number): void;
    /** return RtcSessionDescriptionInit */
    createOfferForRTCPeerConnection(rtcPeerConnectionRef: number, callRef: number): void;
    setLocalDescriptionOfRTCPeerConnection(rtcPeerConnectionRef: number, rtcSessionDescriptionInitJson: string, callRef: number): void;
    setRemoteDescriptionOfRTCPeerConnection(rtcPeerConnectionRef: number, rtcSessionDescriptionInitJson: string, callRef: number): void;
    closeRTCPeerConnection(rtcPeerConnectionRef: number): void;
};
/** Api that should be exposed to the host (apiExposedToHost) */
export declare type Listeners = {
    onIceconnectionstatechange(rtcPeerConnectionRef: number, iceConnectionState: RTCIceConnectionState): void;
    onIcecandidate(rtcPeerConnectionRef: number, rtcIceCandidateInitOrNullJson: string, localDescriptionRTCSessionDescriptionInitOrNullJson: string): void;
    onSignalingstatechange(rtcPeerConnectionRef: number, rtcSignalingState: RTCSignalingState): void;
    onMethodReturn(callRef: number, out: string | undefined): void;
};
export declare function overrideWebRTCImplementation(methods: Methods): Listeners;
export declare function testOverrideWebRTCImplementation(): void;

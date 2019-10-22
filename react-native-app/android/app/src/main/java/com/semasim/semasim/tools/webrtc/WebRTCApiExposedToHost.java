package com.semasim.semasim.tools.webrtc;

public interface WebRTCApiExposedToHost {
    void onIceconnectionstatechange(
            int rtcPeerConnectionRef,
            String iceConnectionState
    );

    void onIcecandidate(
            int rtcPeerConnectionRef,
            String rtcIceCandidateInitOrNullJson,
            String localDescriptionRTCSessionDescriptionInitOrNullJson
    );

    void onSignalingstatechange(
            int rtcPeerConnectionRef,
            String rtcSignalingState
    );

    void onMethodReturn(
            int callRef,
            String out
    );
}

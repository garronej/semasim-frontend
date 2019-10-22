package com.semasim.semasim.tools.webrtc;

public interface WebRTCApiExposedByHost {

    void createRTCPeerConnection(
            int rtcPeerConnectionRef,
            String rtcConfigurationJson
    );

    void getUserMedia(int mediaStreamRef, String mediaStreamConstraintsJson, int callRef);

    void addStreamToRTCPeerConnection(int rtcPeerConnectionRef, int mediaStreamRef);

    void stopMediaStreamTrack(int mediaStreamRef);

    void closeRTCPeerConnection(int rtcPeerConnectionRef);


    void setLocalDescriptionOfRTCPeerConnection(
            int rtcPeerConnectionRef,
            String rtcSessionDescriptionInitJson,
            int callRef
    );

    void setRemoteDescriptionOfRTCPeerConnection(
            int rtcPeerConnectionRef,
            String rtcSessionDescriptionInitJson,
            int callRef
    );

    /** Return rtcSessionDescriptionInitJson via listeners.onMethodReturn */
    void createOfferForRTCPeerConnection(
            int rtcPeerConnectionRef,
            int callRef
    );

    /** Return rtcSessionDescriptionInitJson via listeners.onMethodReturn */
    void createAnswerForRTCPeerConnection(
            int rtcPeerConnectionRef,
            int callRef
    );

}

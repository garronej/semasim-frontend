package com.semasim.semasim.tools.webrtc;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;
import org.webrtc.AudioSource;
import org.webrtc.AudioTrack;

import android.content.Context;
import android.os.Handler;
import android.os.Looper;
import android.util.SparseArray;
import android.webkit.JavascriptInterface;

import com.semasim.semasim.tools.Log;

import org.webrtc.DataChannel;
import org.webrtc.IceCandidate;
import org.webrtc.MediaConstraints;
import org.webrtc.MediaStream;
import org.webrtc.PeerConnection;
import org.webrtc.PeerConnectionFactory;
import org.webrtc.RtpReceiver;
import org.webrtc.SdpObserver;
import org.webrtc.SessionDescription;
import org.webrtc.audio.AudioDeviceModule;
import org.webrtc.audio.JavaAudioDeviceModule;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class WebRTCApiExposedByHostImpl implements WebRTCApiExposedByHost {

    public interface AppContextGetter {
        Context getContext();
    }

    private static AppContextGetter appContextGetter;

    public static void setAppContextGetter(AppContextGetter appContextGetter) {
        WebRTCApiExposedByHostImpl.appContextGetter= appContextGetter;
    }

    private class PeerConnectionObserverImpl implements PeerConnection.Observer {

        private final WebRTCApiExposedByHostImpl webRTCApiExposedByHost;
        private final int rtcPeerConnectionRef;

        PeerConnectionObserverImpl(WebRTCApiExposedByHostImpl webRTCApiExposedByHost, int rtcPeerConnectionRef) {
            this.webRTCApiExposedByHost = webRTCApiExposedByHost;
            this.rtcPeerConnectionRef = rtcPeerConnectionRef;
        }

        @Override
        public void onSignalingChange(PeerConnection.SignalingState signalingState) {

            uiThreadHandler.post(() ->
                    this.webRTCApiExposedByHost.listeners.onSignalingstatechange(
                            rtcPeerConnectionRef,
                            signalingState.name().toLowerCase().replaceAll("_", "-")
                    )
            );

        }

        @Override
        public void onIceConnectionChange(PeerConnection.IceConnectionState iceConnectionState) {

            uiThreadHandler.post(() ->
                    this.webRTCApiExposedByHost.listeners.onIceconnectionstatechange(
                            rtcPeerConnectionRef,
                            iceConnectionState.name().toLowerCase()
                    )
            );

        }

        @Override
        public void onIceCandidate(IceCandidate iceCandidate) {

            //NOTE: Because of get description
            executor.execute(() -> {

                String rtcIceCandidateInitOrNullJson;
                {

                    if (iceCandidate == null) {
                        rtcIceCandidateInitOrNullJson = null;
                    } else {

                        JSONObject rtcIceCandidateInitJs;
                        {

                            rtcIceCandidateInitJs = new JSONObject();

                            if (iceCandidate.sdp != null) {

                                try {
                                    rtcIceCandidateInitJs.put("candidate", iceCandidate.sdp);
                                } catch (JSONException e) {
                                    throw new RuntimeException(e);
                                }

                            }

                            try {
                                rtcIceCandidateInitJs.put("sdpMLineIndex", iceCandidate.sdpMLineIndex);
                            } catch (JSONException e) {
                                throw new RuntimeException(e);
                            }

                            if (iceCandidate.sdpMid != null) {

                                try {
                                    rtcIceCandidateInitJs.put("sdpMid", iceCandidate.sdpMid);
                                } catch (JSONException e) {
                                    throw new RuntimeException(e);
                                }

                            }

                        }

                        rtcIceCandidateInitOrNullJson = rtcIceCandidateInitJs.toString();

                    }
                }

                String localDescriptionRTCSessionDescriptionInitOrNullJson;
                {

                    SessionDescription localDescription = webRTCApiExposedByHost.peerConnectionByRef
                            .get(rtcPeerConnectionRef)
                            .getLocalDescription();

                    if (localDescription == null) {
                        localDescriptionRTCSessionDescriptionInitOrNullJson = null;
                    } else {

                        JSONObject localDescriptionRTCSessionDescriptionInitOrNullJs;
                        {
                            localDescriptionRTCSessionDescriptionInitOrNullJs = new JSONObject();

                            if (localDescription.description != null) {

                                try {
                                    localDescriptionRTCSessionDescriptionInitOrNullJs.put("sdp", localDescription.description);
                                } catch (JSONException e) {
                                    throw new RuntimeException(e);
                                }

                            }

                            try {
                                localDescriptionRTCSessionDescriptionInitOrNullJs.put(
                                        "type",
                                        localDescription.type.canonicalForm()
                                );
                            } catch (JSONException e) {
                                throw new RuntimeException(e);
                            }

                        }

                        localDescriptionRTCSessionDescriptionInitOrNullJson =
                                localDescriptionRTCSessionDescriptionInitOrNullJs.toString();

                    }

                }

                uiThreadHandler.post(() ->
                        webRTCApiExposedByHost.listeners.onIcecandidate(
                                rtcPeerConnectionRef,
                                rtcIceCandidateInitOrNullJson,
                                localDescriptionRTCSessionDescriptionInitOrNullJson
                        )
                );


            });

        }

        @Override
        public void onIceConnectionReceivingChange(boolean b) {

        }

        @Override
        public void onIceGatheringChange(PeerConnection.IceGatheringState iceGatheringState) {

        }

        @Override
        public void onIceCandidatesRemoved(IceCandidate[] iceCandidates) {

        }

        @Override
        public void onAddStream(MediaStream mediaStream) {

        }

        @Override
        public void onRemoveStream(MediaStream mediaStream) {

        }

        @Override
        public void onDataChannel(DataChannel dataChannel) {

        }

        @Override
        public void onRenegotiationNeeded() {

        }

        @Override
        public void onAddTrack(RtpReceiver rtpReceiver, MediaStream[] mediaStreams) {

        }
    }


    // Executor thread is started once in private ctor and is used for all
    // peer connection API calls to ensure new peer connection factory is
    // created on the same thread as previously destroyed factory.
    private static final ExecutorService executor = Executors.newSingleThreadExecutor();
    private static final Handler uiThreadHandler = new Handler(Looper.getMainLooper());

    private final SparseArray<PeerConnection> peerConnectionByRef = new SparseArray<>();

    private PeerConnectionFactory peerConnectionFactory;
    private MediaConstraints audioMediaConstraints;
    private MediaConstraints sdpMediaConstraints;
    private final WebRTCApiExposedToHost listeners;

    public WebRTCApiExposedByHostImpl(WebRTCApiExposedToHost listeners) {

        this.listeners = listeners;

        executor.execute(() -> {

            //TODO: Warning! this should be called only once right ?!
            PeerConnectionFactory.initialize(
                    PeerConnectionFactory.InitializationOptions.builder(appContextGetter.getContext())
                            .setEnableInternalTracer(true)
                            .createInitializationOptions()
            );

            PeerConnectionFactory peerConnectionFactory;
            {

                AudioDeviceModule audioDeviceModule = JavaAudioDeviceModule.builder(appContextGetter.getContext())
                        .setSamplesReadyCallback(null)
                        .setUseHardwareAcousticEchoCanceler(true)
                        .setUseHardwareNoiseSuppressor(true)
                        .setAudioRecordErrorCallback(new AudioRecordErrorCallbackImpl())
                        .setAudioTrackErrorCallback(new AudioTrackErrorCallbackImpl())
                        .createAudioDeviceModule();

                peerConnectionFactory = PeerConnectionFactory.builder()
                        .setOptions(new PeerConnectionFactory.Options()) //TODO: we should be allowed to set this to null or even completely remove the line
                        .setAudioDeviceModule(audioDeviceModule)
                        .createPeerConnectionFactory();

                audioDeviceModule.release();

            }
            this.peerConnectionFactory = peerConnectionFactory;

            audioMediaConstraints = new MediaConstraints();

            /*
            for( String constraintName: new String[]{
                    "googEchoCancellation",
                    "googEchoCancellation2",
                    "googDAEchoCancellation",
                    "googAutoGainControl",
                    "googAutoGainControl2",
                    "googNoiseSuppression",
                    "googNoiseSuppression2",
                    "googHighpassFilter",
                    "googTypingNoiseDetection",
                    "googAudioMirroring",
                    "googAudioNetworkAdaptorConfig"
            } ) {

                audioMediaConstraints.mandatory.add(
                        new MediaConstraints.KeyValuePair(
                                constraintName,
                                "false"
                        )
                );

            }
            */

            MediaConstraints sdpMediaConstraints;
            {
                sdpMediaConstraints = new MediaConstraints();
                sdpMediaConstraints.mandatory.add(new MediaConstraints.KeyValuePair("OfferToReceiveAudio", "true"));
                sdpMediaConstraints.mandatory.add(new MediaConstraints.KeyValuePair("OfferToReceiveVideo", "false"));

                //sdpMediaConstraints.mandatory.add(new MediaConstraints.KeyValuePair("VoiceActivityDetection", "false"));


            }
            this.sdpMediaConstraints = sdpMediaConstraints;


        });

    }

    @Override @JavascriptInterface
    public void createRTCPeerConnection(
            int rtcPeerConnectionRef,
            String rtcConfigurationJson
    ) {

        executor.execute(() -> {


            PeerConnection.RTCConfiguration rtcConfiguration;
            {

                List<PeerConnection.IceServer> iceServers;
                {
                    try {

                        JSONArray rtcIceServersJs = (new JSONObject(rtcConfigurationJson)).getJSONArray("iceServers");

                        if (rtcIceServersJs == null) {
                            throw new RuntimeException("in this implementation iceServers must be provided");
                        }

                        iceServers = iceServersFromJs(rtcIceServersJs);

                    } catch (JSONException e) {
                        throw new RuntimeException(e);
                    }
                }

                rtcConfiguration = new PeerConnection.RTCConfiguration(iceServers);

                rtcConfiguration.tcpCandidatePolicy = PeerConnection.TcpCandidatePolicy.DISABLED;
                rtcConfiguration.bundlePolicy = PeerConnection.BundlePolicy.BALANCED;
                rtcConfiguration.rtcpMuxPolicy = PeerConnection.RtcpMuxPolicy.REQUIRE;
                rtcConfiguration.continualGatheringPolicy = PeerConnection.ContinualGatheringPolicy.GATHER_ONCE;
                rtcConfiguration.keyType = PeerConnection.KeyType.ECDSA;
                rtcConfiguration.enableDtlsSrtp = true;
                rtcConfiguration.sdpSemantics = PeerConnection.SdpSemantics.UNIFIED_PLAN;

                /*
                rtcConfiguration.audioJitterBufferFastAccelerate= true;
                rtcConfiguration.audioJitterBufferMaxPackets= 5;
                */

            }


            PeerConnection peerConnection = peerConnectionFactory.createPeerConnection(
                    rtcConfiguration,
                    new PeerConnectionObserverImpl(this, rtcPeerConnectionRef)

            );

            peerConnectionByRef.put(rtcPeerConnectionRef, peerConnection);


        });


    }

    //TODO: Change to whatever.
    private static final String AUDIO_TRACK_ID = "ARDAMS";

    private final SparseArray<AudioTrack> audioTrackByRef = new SparseArray<>();

    @Override @JavascriptInterface
    public void getUserMedia(int mediaStreamRef, String mediaStreamConstraintsJson, int callRef) {

        //TODO: Validate that mediaStreamConstraintJson is { "video": false, "audio": true }

        executor.execute(() -> {

            AudioTrack audioTrack;
            {

                AudioSource audioSource = peerConnectionFactory.createAudioSource(
                        audioMediaConstraints
                );

                audioTrack = peerConnectionFactory.createAudioTrack(
                        AUDIO_TRACK_ID + "a0",
                        audioSource
                );

                audioTrack.setEnabled(true);

            }
            audioTrackByRef.put(mediaStreamRef, audioTrack);


            listeners.onMethodReturn(callRef, null);

        });

    }

    @Override @JavascriptInterface
    public void addStreamToRTCPeerConnection(int rtcPeerConnectionRef, int mediaStreamRef) {

        executor.execute(
                () -> peerConnectionByRef.get(rtcPeerConnectionRef).addTrack(
                        audioTrackByRef.get(mediaStreamRef),
                        Collections.singletonList(AUDIO_TRACK_ID)
                )
        );


    }

    @Override @JavascriptInterface
    public void stopMediaStreamTrack(int mediaStreamRef) {

        executor.execute(() -> {

            //NOTE: Close enough I guess...
            audioTrackByRef.get(mediaStreamRef).setVolume(0);

            audioTrackByRef.delete(mediaStreamRef);

        });


    }

    @Override @JavascriptInterface
    public void closeRTCPeerConnection(int rtcPeerConnectionRef) {

        executor.execute(() -> {

            PeerConnection peerConnection = peerConnectionByRef.get(rtcPeerConnectionRef);

            if( peerConnection == null ){
                return;
            }

            peerConnection.close();

            peerConnectionByRef.delete(rtcPeerConnectionRef);

        });

    }


    private void setDescriptionOfRTCPeerConnection(
            int rtcPeerConnectionRef,
            String rtcSessionDescriptionInitJson,
            int callRef,
            boolean toLocal
    ) {

        SessionDescription sessionDescription;
        {

            JSONObject rtcSessionDescriptionJs;

            try {

                rtcSessionDescriptionJs = new JSONObject(rtcSessionDescriptionInitJson);

            } catch (JSONException e) {
                throw new RuntimeException(e.getMessage());
            }

            String rtcSessionDescriptionJs_sdp;

            try {
                rtcSessionDescriptionJs_sdp = rtcSessionDescriptionJs.getString("sdp");
            } catch (JSONException e) {
                throw new RuntimeException(e.getMessage());
            }

            String rtcSessionDescriptionJs_type;

            try {
                rtcSessionDescriptionJs_type = rtcSessionDescriptionJs.getString("type");
            } catch (JSONException e) {
                throw new RuntimeException(e.getMessage());
            }

            sessionDescription = new SessionDescription(
                    SessionDescription.Type.fromCanonicalForm(rtcSessionDescriptionJs_type),
                    rtcSessionDescriptionJs_sdp
            );

        }



        SdpObserver sdpObserver = new SdpObserverBase() {
            @Override
            public void onSetSuccess() {
                listeners.onMethodReturn(callRef, null);
            }

            @Override
            public void onSetFailure(String s) {
                throw new RuntimeException(s);
            }

        };

        PeerConnection peerConnection = peerConnectionByRef.get(rtcPeerConnectionRef);

        executor.execute(() -> {


            if (toLocal) {

                peerConnection.setLocalDescription(
                        sdpObserver,
                        sessionDescription
                );

            } else {

                peerConnection.setRemoteDescription(
                        sdpObserver,
                        sessionDescription
                );

            }

        });

    }


    @Override @JavascriptInterface
    public void setLocalDescriptionOfRTCPeerConnection(
            int rtcPeerConnectionRef,
            String rtcSessionDescriptionInitJson,
            int callRef
    ) {

        setDescriptionOfRTCPeerConnection(
                rtcPeerConnectionRef,
                rtcSessionDescriptionInitJson,
                callRef,
                true
        );

    }

    @Override @JavascriptInterface
    public void setRemoteDescriptionOfRTCPeerConnection(
            int rtcPeerConnectionRef,
            String rtcSessionDescriptionInitJson,
            int callRef
    ) {

        setDescriptionOfRTCPeerConnection(
                rtcPeerConnectionRef,
                rtcSessionDescriptionInitJson,
                callRef,
                false
        );

    }

    private void createOfferOrAnswerForRTCPeerConnection(boolean isOffer, int rtcPeerConnectionRef, int callRef){

        SdpObserver sdpObserver = new SdpObserverBase(){

            @Override
            public void onCreateSuccess(SessionDescription sessionDescription) {

                JSONObject rtcSessionDescriptionInitJs = new JSONObject();

                try {
                    rtcSessionDescriptionInitJs.put(
                            "sdp",
                            sessionDescription.description
                    );
                }catch(JSONException e){
                    throw new RuntimeException(e.getMessage());
                }

                try {
                    rtcSessionDescriptionInitJs.put(
                            "type",
                            sessionDescription.type.canonicalForm()
                    );
                }catch(JSONException e){
                    throw new RuntimeException(e.getMessage());
                }


                listeners.onMethodReturn(
                        callRef,
                        rtcSessionDescriptionInitJs.toString()
                );

            }

            @Override
            public void onCreateFailure(String s) {
                throw new RuntimeException(s);
            }

        };

        executor.execute(
                () -> {

                    PeerConnection peerConnection = peerConnectionByRef.get(rtcPeerConnectionRef);

                    if( isOffer ){

                        peerConnection.createOffer(
                                sdpObserver,
                                sdpMediaConstraints
                        );

                    }else{

                        peerConnection.createAnswer(
                                sdpObserver,
                                sdpMediaConstraints
                        );

                    }

                }
        );


    }

    @Override @JavascriptInterface
    public void createOfferForRTCPeerConnection(
            int rtcPeerConnectionRef,
            int callRef
    ) {

        createOfferOrAnswerForRTCPeerConnection(
                true,
                rtcPeerConnectionRef,
                callRef
        );

    }

    @Override @JavascriptInterface
    public void createAnswerForRTCPeerConnection(
            int rtcPeerConnectionRef,
            int callRef
    ) {

        createOfferOrAnswerForRTCPeerConnection(
                false,
                rtcPeerConnectionRef,
                callRef
        );

    }

    /**
     * |rtcIceServersJs|: RTCIceServer[], attached to RTCConfiguration["iceServers"]
     * ( JavaScript types as defined by MDN )
     *  */
    private static List<PeerConnection.IceServer> iceServersFromJs(JSONArray rtcIceServersJs) throws JSONException {

        List<PeerConnection.IceServer> out = new ArrayList<>();

        for (int i = 0; i < rtcIceServersJs.length(); i++) {

            PeerConnection.IceServer.Builder builder;
            {

                JSONObject serverJs = rtcIceServersJs.getJSONObject(i);

                List<String> urls;
                {


                    urls = new ArrayList<>();

                    JSONArray urlsJs;
                    {

                        String key= "urls";

                        try {

                            urlsJs = serverJs.getJSONArray(key);

                        } catch (ClassCastException e) {

                            urlsJs = new JSONArray();

                            urlsJs.put(0, serverJs.getString(key));

                        }
                    }


                    for (int j = 0; j < urlsJs.length(); ++j) {

                        urls.add(urlsJs.getString(j));

                    }




                }


                builder = PeerConnection.IceServer.builder(urls);

                {

                    String key= "username";

                    if( serverJs.has(key)){

                        builder.setUsername(serverJs.getString(key));

                    }

                }

                {

                    String key= "credential";

                    if( serverJs.has(key)){

                        if( !"password".equals(serverJs.getString("credentialType")) ){
                            throw new RuntimeException("in this implementation credentialType must be 'password'");
                        }

                        builder.setPassword(serverJs.getString(key));

                    }

                }


            }

            builder.setTlsCertPolicy(PeerConnection.TlsCertPolicy.TLS_CERT_POLICY_INSECURE_NO_CHECK);

            PeerConnection.IceServer iceServer =builder.createIceServer();

            out.add(iceServer);

        }

        return out;

    }




    private class SdpObserverBase implements SdpObserver {
        @Override
        public void onCreateSuccess(SessionDescription sessionDescription) { }

        @Override
        public void onSetSuccess() { }

        @Override
        public void onCreateFailure(String s) { }

        @Override
        public void onSetFailure(String s) { }

    }

    private class AudioRecordErrorCallbackImpl implements  JavaAudioDeviceModule.AudioRecordErrorCallback {
        @Override
        public void onWebRtcAudioRecordInitError(String errorMessage) {
            throw new RuntimeException(errorMessage);
        }

        @Override
        public void onWebRtcAudioRecordStartError(
                JavaAudioDeviceModule.AudioRecordStartErrorCode errorCode, String errorMessage) {
            throw new RuntimeException(errorMessage);
        }

        @Override
        public void onWebRtcAudioRecordError(String errorMessage) {
            throw new RuntimeException(errorMessage);
        }
    }

    private class AudioTrackErrorCallbackImpl implements JavaAudioDeviceModule.AudioTrackErrorCallback {
        @Override
        public void onWebRtcAudioTrackInitError(String errorMessage) {
            throw new RuntimeException(errorMessage);
        }

        @Override
        public void onWebRtcAudioTrackStartError(
                JavaAudioDeviceModule.AudioTrackStartErrorCode errorCode, String errorMessage) {
            throw new RuntimeException(errorMessage);
        }

        @Override
        public void onWebRtcAudioTrackError(String errorMessage) {
            throw new RuntimeException(errorMessage);
        }
    }



}

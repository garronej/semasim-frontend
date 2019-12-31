
package com.semasim.semasim;


import androidx.annotation.NonNull;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.semasim.semasim.tools.webrtc.WebRTCApiExposedByHost;
import com.semasim.semasim.tools.webrtc.WebRTCApiExposedByHostImpl;
import com.semasim.semasim.tools.webrtc.WebRTCApiExposedToHost;

import java.lang.reflect.Proxy;

public class HostWebRtc extends ReactContextBaseJavaModule {

    @NonNull
    @Override
    public String getName() {
        return "HostWebRtc";
    }

    private WebRTCApiExposedByHost webRTCApiExposedByHost;

    HostWebRtc(ReactApplicationContext reactContext) {
        super(reactContext);

        webRTCApiExposedByHost= new WebRTCApiExposedByHostImpl(
                (WebRTCApiExposedToHost) Proxy.newProxyInstance(
                        WebRTCApiExposedToHost.class.getClassLoader(),
                        new Class[]{WebRTCApiExposedToHost.class},
                        (proxy, method, args) -> {

                            ApiExposedToHostCallerService.invokeFunction(
                                    reactContext,
                                    method.getName(),
                                    params -> {

                                        for( Object arg: args){

                                            if( arg == null ){

                                                params.pushNull();

                                            }else if( arg instanceof Integer ){


                                                params.pushInt((Integer)arg);

                                            }else if( arg instanceof String ){

                                                params.pushString((String)arg);

                                            }else{

                                                throw new RuntimeException("never");

                                            }

                                        }

                                    }
                            );

                            return null;
                        }
                )

        );


    }

    @SuppressWarnings("unused")
    @ReactMethod
    public void createRTCPeerConnection(
            int rtcPeerConnectionRef,
            String rtcConfigurationJson
    ){

        webRTCApiExposedByHost.createRTCPeerConnection(
                rtcPeerConnectionRef,
                rtcConfigurationJson
        );
    }

    @SuppressWarnings("unused")
    @ReactMethod
    public void getUserMedia(int mediaStreamRef, String mediaStreamConstraintsJson, int callRef){

        webRTCApiExposedByHost.getUserMedia(
                mediaStreamRef,
                mediaStreamConstraintsJson,
                callRef
        );
    }

    @SuppressWarnings("unused")
    @ReactMethod
    public void addStreamToRTCPeerConnection(int rtcPeerConnectionRef, int mediaStreamRef) {

        webRTCApiExposedByHost.addStreamToRTCPeerConnection(
                rtcPeerConnectionRef,
                mediaStreamRef
        );
    }

    @SuppressWarnings("unused")
    @ReactMethod
    public void stopMediaStreamTrack(int mediaStreamRef){

        webRTCApiExposedByHost.stopMediaStreamTrack(
                mediaStreamRef
        );
    }

    @SuppressWarnings("unused")
    @ReactMethod
    public void closeRTCPeerConnection(int rtcPeerConnectionRef){

        webRTCApiExposedByHost.closeRTCPeerConnection(
                rtcPeerConnectionRef
        );

    }


    @SuppressWarnings("unused")
    @ReactMethod
    public void setLocalDescriptionOfRTCPeerConnection(
            int rtcPeerConnectionRef,
            String rtcSessionDescriptionInitJson,
            int callRef
    ){

        webRTCApiExposedByHost.setLocalDescriptionOfRTCPeerConnection(
                rtcPeerConnectionRef,
                rtcSessionDescriptionInitJson,
                callRef
        );
    }

    @SuppressWarnings("unused")
    @ReactMethod
    public void setRemoteDescriptionOfRTCPeerConnection(
            int rtcPeerConnectionRef,
            String rtcSessionDescriptionInitJson,
            int callRef
    ){

        webRTCApiExposedByHost.setRemoteDescriptionOfRTCPeerConnection(
                rtcPeerConnectionRef,
                rtcSessionDescriptionInitJson,
                callRef
        );
    }

    @SuppressWarnings("unused")
    @ReactMethod
    public void createOfferForRTCPeerConnection(
            int rtcPeerConnectionRef,
            int callRef
    ){

        webRTCApiExposedByHost.createOfferForRTCPeerConnection(
                rtcPeerConnectionRef,
                callRef
        );
    }

    @SuppressWarnings("unused")
    @ReactMethod
    public void createAnswerForRTCPeerConnection(
            int rtcPeerConnectionRef,
            int callRef
    ){

        webRTCApiExposedByHost.createAnswerForRTCPeerConnection(
                rtcPeerConnectionRef,
                callRef
        );
    }


}

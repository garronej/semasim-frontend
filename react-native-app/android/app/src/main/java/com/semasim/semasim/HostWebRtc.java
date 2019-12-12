
package com.semasim.semasim;

import android.content.Intent;
import android.os.Handler;
import android.os.Looper;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableArray;
//import com.semasim.semasim.tools.Log;
//import com.semasim.semasim.tools.WebViewManager;
import com.semasim.semasim.tools.Log;
import com.semasim.semasim.tools.webrtc.WebRTCApiExposedByHost;
import com.semasim.semasim.tools.webrtc.WebRTCApiExposedByHostImpl;
import com.semasim.semasim.tools.webrtc.WebRTCApiExposedToHost;

import java.lang.reflect.Proxy;

public class HostWebRtc extends ReactContextBaseJavaModule {

    @Override
    public String getName() {
        return "HostWebRtc";
    }

    private ReactApplicationContext reactContext;
    private WebRTCApiExposedByHost webRTCApiExposedByHost;

    HostWebRtc(ReactApplicationContext reactContext) {
        super(reactContext);

        this.reactContext= reactContext;


        /*
        Log.i("(not)ReactNativeJS hack mode in call <===================================================");

        final AudioManager audioManager = (AudioManager) reactContext.getSystemService(Context.AUDIO_SERVICE);

        final Runnable updateAudioManager = () -> {

            audioManager.setMode(AudioManager.MODE_IN_CALL);
            audioManager.setSpeakerphoneOn(true);
            audioManager.setMicrophoneMute(false);

        };

        updateAudioManager.run();
        */

        webRTCApiExposedByHost= new WebRTCApiExposedByHostImpl(
                (WebRTCApiExposedToHost) Proxy.newProxyInstance(
                        WebRTCApiExposedToHost.class.getClassLoader(),
                        new Class[]{WebRTCApiExposedToHost.class},
                        (proxy, method, args) -> {

                            WritableArray params= Arguments.createArray();

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

                            ApiExposedToHostCaller.invokeFunction(
                                    reactContext,
                                    method.getName(),
                                    params
                            );

                            return null;
                        }
                )

        );


    }

    private static final Handler uiThreadHandler = new Handler(Looper.getMainLooper());

    @ReactMethod
    public void createRTCPeerConnection(
            int rtcPeerConnectionRef,
            String rtcConfigurationJson
    ){

        {
            Log.i("Starting EndlessPhonyTask");

            //NOTE: Keep the app alive while call ongoing ( so the timers callback are run )
            reactContext.startService(new Intent(reactContext, EndlessPhonyTaskService.class));

            //HeadlessJsTaskService.acquireWakeLockNow(reactContext);
        }

        webRTCApiExposedByHost.createRTCPeerConnection(
                rtcPeerConnectionRef,
                rtcConfigurationJson
        );
    }

    @ReactMethod
    public void getUserMedia(int mediaStreamRef, String mediaStreamConstraintsJson, int callRef){

        webRTCApiExposedByHost.getUserMedia(
                mediaStreamRef,
                mediaStreamConstraintsJson,
                callRef
        );
    }

    @ReactMethod
    void addStreamToRTCPeerConnection(int rtcPeerConnectionRef, int mediaStreamRef) {

        webRTCApiExposedByHost.addStreamToRTCPeerConnection(
                rtcPeerConnectionRef,
                mediaStreamRef
        );
    }

    @ReactMethod
    void stopMediaStreamTrack(int mediaStreamRef){

        webRTCApiExposedByHost.stopMediaStreamTrack(
                mediaStreamRef
        );
    }

    @ReactMethod
    void closeRTCPeerConnection(int rtcPeerConnectionRef){

        {
            Log.i("End EndlessPhonyTask");

            reactContext.stopService(new Intent(reactContext, EndlessPhonyTaskService.class));
        }

        webRTCApiExposedByHost.closeRTCPeerConnection(
                rtcPeerConnectionRef
        );

    }


    @ReactMethod
    void setLocalDescriptionOfRTCPeerConnection(
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

    @ReactMethod
    void setRemoteDescriptionOfRTCPeerConnection(
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

    @ReactMethod
    void createOfferForRTCPeerConnection(
            int rtcPeerConnectionRef,
            int callRef
    ){

        webRTCApiExposedByHost.createOfferForRTCPeerConnection(
                rtcPeerConnectionRef,
                callRef
        );
    }

    @ReactMethod
    void createAnswerForRTCPeerConnection(
            int rtcPeerConnectionRef,
            int callRef
    ){

        webRTCApiExposedByHost.createAnswerForRTCPeerConnection(
                rtcPeerConnectionRef,
                callRef
        );
    }


}

package com.semasim.semasim;

import android.content.Context;
import android.media.AudioManager;

import androidx.annotation.NonNull;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.semasim.semasim.tools.Log;


public class HostAudioManager extends ReactContextBaseJavaModule {


    HostAudioManager(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    @NonNull
    @Override
    public String getName() {
        return "HostAudioManager";
    }

    @SuppressWarnings("unused")
    @ReactMethod
    public void setMicrophoneMute( boolean isMicrophoneMute ){

        Log.i("(not)ReactNativeJS setMicrophoneMute: " + isMicrophoneMute);

        AudioManager audioManager = (AudioManager) getReactApplicationContext().getSystemService(Context.AUDIO_SERVICE);

        //audioManager.setMode(AudioManager.MODE_IN_CALL);
        audioManager.setMicrophoneMute(isMicrophoneMute);

    }

}

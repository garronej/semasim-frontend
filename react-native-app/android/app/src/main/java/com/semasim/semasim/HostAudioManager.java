package com.semasim.semasim;

import android.content.Context;
import android.media.AudioManager;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableArray;
import com.semasim.semasim.tools.JsCaller;
import com.semasim.semasim.tools.Log;

import org.jdeferred2.Deferred;
import org.jdeferred2.DoneCallback;
import org.jdeferred2.Promise;
import org.jdeferred2.android.AndroidDeferredObject;
import org.liquidplayer.javascript.JSBaseArray;
import org.liquidplayer.javascript.JSValue;

import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class HostAudioManager extends ReactContextBaseJavaModule {

    private ReactApplicationContext reactContext;

    HostAudioManager(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
    }

    @Override
    public String getName() {
        return "HostAudioManager";
    }

    @ReactMethod
    public void setMicrophoneMute( boolean isMicrophoneMute ){

        Log.i("(not)ReactNativeJS setMicrophoneMute: " + isMicrophoneMute);

        AudioManager audioManager = (AudioManager) reactContext.getSystemService(Context.AUDIO_SERVICE);

        //audioManager.setMode(AudioManager.MODE_IN_CALL);
        audioManager.setMicrophoneMute(isMicrophoneMute);

    }

}


package com.semasim.semasim;

import android.content.Intent;

import androidx.annotation.NonNull;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

public class HostKeepAlive extends ReactContextBaseJavaModule {


    HostKeepAlive(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    @NonNull
    @Override
    public String getName() {
        return "HostKeepAlive";
    }


    @SuppressWarnings("unused")
    @ReactMethod
    public void runHeadlessTask( ){

        //NOTE: Keep the app alive while call ongoing ( so the timers callback are run )
        getReactApplicationContext().startService(
                new Intent(
                        getReactApplicationContext(),
                        HostKeepAliveTaskService.class
                )
        );

        //NOTE: If we have problems see how they do it inreact-native-webrtc/react-native-callkeep
        //HostKeepAliveTaskService.acquireWakeLockNow(getReactApplicationContext());


    }


}

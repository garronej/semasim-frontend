
package com.semasim.semasim;

import android.content.Intent;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.semasim.semasim.tools.Log;


public class HostKeepAlive extends ReactContextBaseJavaModule {

    private ReactApplicationContext reactContext;

    HostKeepAlive(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
    }

    @Override
    public String getName() {
        return "HostKeepAlive";
    }

    private boolean isKeptAlive= false;

    @ReactMethod
    public void startKeepAlive( ){

        if( isKeptAlive ) {
            return;
        }

        isKeptAlive= true;

        Log.i("Starting EndlessPhonyTask");

        //NOTE: Keep the app alive while call ongoing ( so the timers callback are run )
        reactContext.startService(new Intent(reactContext, EndlessPhonyTaskService.class));

        //NOTE: If we have problems see how they do it inreact-native-webrtc/react-native-callkeep
        //HeadlessJsTaskService.acquireWakeLockNow(reactContext);


    }

    @ReactMethod
    public void stopKeepAlive(
    ){

        if( !isKeptAlive ) {
            return;
        }

        isKeptAlive=false;

        Log.i("End EndlessPhonyTask");

        reactContext.stopService(new Intent(reactContext, EndlessPhonyTaskService.class));

    }

}

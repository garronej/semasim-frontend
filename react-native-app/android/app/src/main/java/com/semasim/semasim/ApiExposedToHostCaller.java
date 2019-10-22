package com.semasim.semasim;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;

class ApiExposedToHostCaller {

    static void invokeFunction(ReactApplicationContext reactContext, String functionName, WritableArray params){

        WritableMap event= Arguments.createMap();

        event.putString("functionName", functionName);
        event.putArray("params", params);

        reactContext
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                .emit("apiExposedToHostInvocation", event)
        ;

    }

}

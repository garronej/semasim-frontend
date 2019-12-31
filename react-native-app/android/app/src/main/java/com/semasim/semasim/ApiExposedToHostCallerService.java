
package com.semasim.semasim;

import android.content.Context;
import android.content.Intent;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import com.facebook.react.HeadlessJsTaskService;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.jstasks.HeadlessJsTaskConfig;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import com.semasim.semasim.tools.Log;
import com.semasim.semasim.tools.Serializer;

import java.util.Objects;

public class ApiExposedToHostCallerService extends HeadlessJsTaskService {

    private static final String API_EXPOSED_TO_HOST_INVOCATION= "apiExposedToHostInvocation";

    private static final String EVENT_DATA_JSON= "eventKeyJson";

    @Override
    protected @Nullable
    HeadlessJsTaskConfig getTaskConfig(Intent intent) {

        return new HeadlessJsTaskConfig(
                API_EXPOSED_TO_HOST_INVOCATION,
                Serializer.parseReactBrigeWritableMapFromJson(
                        Objects.requireNonNull(intent.getExtras())
                                .getString(EVENT_DATA_JSON)
                ),
                0,
                false //TODO: Put to true in production.
        );
    }

    interface ParamsEditor {
        void editParams(@NonNull WritableArray params);
    }

    static void invokeFunction(
            ReactApplicationContext reactContext,
            @NonNull String functionName,
            ParamsEditor paramsEditor
    ){


        WritableMap eventData;
        {
            eventData=Arguments.createMap();

            eventData.putString("functionName", functionName);

            WritableArray params = Arguments.createArray();

            if (paramsEditor != null) {

                paramsEditor.editParams(params);

            }

            eventData.putArray("params", params);
        }

        if( !MainActivity.getIsVisible() || reactContext == null ) {

            Context applicationContext = SemasimApplication.getContext();

            applicationContext.startService(
                    new Intent(
                            applicationContext,
                            ApiExposedToHostCallerService.class
                    )
                            .putExtra(
                                    EVENT_DATA_JSON,
                                    Serializer.stringifyReactBridgeReadableMap(
                                            eventData
                                    )
                            )
            );

            return;

        }

        reactContext
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                .emit(API_EXPOSED_TO_HOST_INVOCATION, eventData)
        ;


    }

    static void invokeOnResultFunction(
            ReactApplicationContext reactContext,
            @NonNull String returningResultForFunctionName,
            int callRef,
            ParamsEditor paramsEditor
    ){


        invokeFunction(
                reactContext,
                "on" +
                        returningResultForFunctionName.substring(0, 1).toUpperCase() +
                        returningResultForFunctionName.substring(1) +
                        "Result",
                params -> {

                    params.pushInt(callRef);

                    if( paramsEditor != null ){

                        paramsEditor.editParams(params);

                    }

                }
        );


    }


}

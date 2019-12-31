package com.semasim.semasim;

import androidx.annotation.NonNull;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableArray;
import com.semasim.semasim.tools.JsCaller;
import com.semasim.semasim.tools.Log;
import com.semasim.semasim.tools.MethodNameGetter;

import org.jdeferred2.Deferred;
import org.jdeferred2.DoneCallback;
import org.jdeferred2.Promise;
import org.jdeferred2.android.AndroidDeferredObject;
import org.liquidplayer.javascript.JSBaseArray;
import org.liquidplayer.javascript.JSValue;

import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class HostCryptoLib extends ReactContextBaseJavaModule {


    HostCryptoLib(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    @NonNull
    @Override
    public String getName() {
        return "HostCryptoLib";
    }

    @ReactMethod
    public void aesEncryptOrDecrypt(
            String action,
            String keyB64,
            String inputDataB64,
            int callRef
    ){


        String methodName = MethodNameGetter.get();

        aesEncryptOrDecrypt(action, keyB64, inputDataB64).done(
                (DoneCallback<String>) outputDataB64 -> ApiExposedToHostCallerService.invokeOnResultFunction(
                        getReactApplicationContext(),
                        methodName,
                        callRef,
                        params -> params.pushString(outputDataB64)
                )
        );


    }



    @ReactMethod
    public void rsaEncryptOrDecrypt(
            String action,
            String keyStr,
            String inputDataB64,
            int callRef
    ){

        String methodName = MethodNameGetter.get();

        rsaEncryptOrDecrypt(action, keyStr, inputDataB64).done(
                (DoneCallback<String>) outputDataB64 -> ApiExposedToHostCallerService.invokeOnResultFunction(
                        getReactApplicationContext(),
                        methodName,
                        callRef,
                        params -> params.pushString(outputDataB64)
                )
        );



    }

    @ReactMethod
    public void rsaGenerateKeys(
            String seedB64,
            int keysLengthBytes,
            int callRef
    ){

        String methodName = MethodNameGetter.get();

        rsaGenerateKeys(seedB64, keysLengthBytes).done(
                (DoneCallback<String[]>) result -> ApiExposedToHostCallerService.invokeOnResultFunction(
                        getReactApplicationContext(),
                        methodName,
                        callRef,
                        params -> {

                            params.pushString(result[0]);
                            params.pushString(result[1]);

                        }
                )
        );


    }


    static final String scriptPath= "crypto-lib-standalone.js";

    //NOTE: Single thread as we need the messages to be decrypted in order.
    //And well we use the same executor for aes only for convenience.
    private static final ExecutorService executor = Executors.newSingleThreadExecutor();

    private  static Promise<String, ?, ?> aesEncryptOrDecrypt(
            String action,
            String keyB64,
            String inputDataB64

    ) {

        String methodName= MethodNameGetter.get();

        Deferred<String, ?, ?> d= new AndroidDeferredObject<>();

        executor.execute(()-> d.resolve(
                JsCaller.callJsFunction(
                        scriptPath,
                        methodName,
                        (args, jsContext) -> {

                            for( String arg: new String[]{ action, keyB64, inputDataB64 }){

                                args.add(
                                        new JSValue(
                                                jsContext,
                                                arg
                                        )
                                );

                            }


                        }
                ).toString()
        ));

        return d.promise();

    }

    private  static Promise<String, ?, ?> rsaEncryptOrDecrypt(
            String action,
            String keyStr,
            String inputDataB64

    ) {

        String methodName= MethodNameGetter.get();


        Deferred<String, ?, ?> d= new AndroidDeferredObject<>();

        executor.execute(()-> d.resolve(
                JsCaller.callJsFunction(
                        scriptPath,
                        methodName,
                        (args, jsContext) -> {

                            for( String arg: new String[]{ action, keyStr, inputDataB64 }){

                                args.add(
                                        new JSValue(
                                                jsContext,
                                                arg
                                        )
                                );

                            }


                        }
                ).toString()
        ));

        return d.promise();

    }


    private static Promise<String[], ?, ?> rsaGenerateKeys(
            String seedB64,
            int keysLengthBytes
    ){

        String methodName= MethodNameGetter.get();

        Log.i("methodName: " + methodName);

        Deferred<String[], ?, ?> d= new AndroidDeferredObject<>();

        executor.execute(()-> {

            JSBaseArray<JSValue> result= JsCaller.callJsFunction(
                    scriptPath,
                    methodName,
                    (args, jsContext) -> {

                        for( Object arg: new Object[]{ seedB64, keysLengthBytes }){

                            args.add(
                                    new JSValue(
                                            jsContext,
                                            arg
                                    )
                            );

                        }


                    }
            ).toJSArray();


            d.resolve( new String[] { result.get(0).toString(), result.get(1).toString() } );


        });

        return d.promise();


    }








}

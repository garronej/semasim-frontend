package com.semasim.semasim;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableArray;
import com.semasim.semasim.tools.JsCaller;

import org.jdeferred2.Deferred;
import org.jdeferred2.DoneCallback;
import org.jdeferred2.Promise;
import org.jdeferred2.android.AndroidDeferredObject;
import org.liquidplayer.javascript.JSBaseArray;
import org.liquidplayer.javascript.JSValue;

import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class HostCryptoLib extends ReactContextBaseJavaModule {

    private ReactApplicationContext reactContext;

    HostCryptoLib(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
    }

    @Override
    public String getName() {
        return "HostCryptoLib";
    }



    @ReactMethod
    public void rsaEncryptOrDecrypt(
            String action,
            String keyStr,
            String inputDataB64,
            int callRef
    ){

        HostCryptoLib.rsaEncryptOrDecrypt(action, keyStr, inputDataB64)
                .done((DoneCallback<String>) outputDataB64 -> {

                    WritableArray params = Arguments.createArray();

                    params.pushInt(callRef);
                    params.pushString(outputDataB64);

                    ApiExposedToHostCaller.invokeFunction(
                            reactContext,
                            "onRsaEncryptOrDecryptResult",
                            params
                    );

                });


    }

    @ReactMethod
    public void rsaGenerateKeys(
            String seedB64,
            int keysLengthBytes,
            int callRef
    ){

        HostCryptoLib.rsaGenerateKeys(seedB64, keysLengthBytes)
                .done((DoneCallback<String[]>) result -> {

                    WritableArray params = Arguments.createArray();

                    params.pushInt(callRef);
                    params.pushString(result[0]);
                    params.pushString(result[1]);

                    ApiExposedToHostCaller.invokeFunction(
                            reactContext,
                            "onRsaGenerateKeysResult",
                            params
                    );

                });


    }


    static final String scriptPath= "crypto-lib-standalone.js";

    //NOTE: Single thread as we need the messages to be decrypted in order.
    private static final ExecutorService executor = Executors.newSingleThreadExecutor();

    private  static Promise<String, ?, ?> rsaEncryptOrDecrypt(
            String action,
            String keyStr,
            String inputDataB64

    ) {

        Deferred<String, ?, ?> d= new AndroidDeferredObject<>();

        executor.execute(()-> d.resolve(
                JsCaller.callJsFunction(
                        scriptPath,
                        "rsaEncryptOrDecrypt",
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


    public static Promise<String[], ?, ?> rsaGenerateKeys(
            String seedB64,
            int keysLengthBytes
    ){

        Deferred<String[], ?, ?> d= new AndroidDeferredObject<>();

        executor.execute(()-> {

            JSBaseArray<JSValue> result= JsCaller.callJsFunction(
                    scriptPath,
                    "rsaGenerateKeys",
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

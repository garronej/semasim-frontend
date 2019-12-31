
package com.semasim.semasim;

import android.webkit.ConsoleMessage;
import android.webkit.WebChromeClient;
import android.webkit.WebView;

import androidx.annotation.NonNull;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.UiThreadUtil;
import com.semasim.semasim.tools.HexStringBinaryRepresentation;
import com.semasim.semasim.tools.Log;
import com.semasim.semasim.tools.PBKDF2WithHmacSHA1;
import com.semasim.semasim.tools.WebViewManager;
import org.jdeferred2.Deferred;
import org.jdeferred2.DoneCallback;
import org.jdeferred2.Promise;
import org.jdeferred2.android.AndroidDeferredObject;


public class HostKfd extends ReactContextBaseJavaModule {

    @NonNull
    @Override
    public String getName() {
        return "HostKfd";
    }

    HostKfd(final ReactApplicationContext reactContext) {
        super(reactContext);
    }

    @SuppressWarnings("unused")
    @ReactMethod
    public void kfd( String password, String saltHex, int iterations, int callRef ) {
        UiThreadUtil.runOnUiThread(() -> kfdAssertUiThread(password, saltHex, iterations, callRef));
    }


    private final static  String resultPrefix= "__result__:";

    private static String getHtml(String password, String saltHex, int iterations) {

        return (
                "<!DOCTYPE html>\n" +
                        "<html>\n" +
                        "<head></head>\n" +
                        "<body>\n" +
                        "    <script>\n" +
                        "    function hexStringToUint8Array(hexString) {\n" +
                        "        var out = new Uint8Array(Math.ceil(hexString.length / 2));\n" +
                        "        for (var i = 0; i < out.length; i++) {\n" +
                        "            out[i] = parseInt(hexString.substr(i * 2, 2), 16);\n" +
                        "        }\n" +
                        "        return out;\n" +
                        "    }\n" +
                        "    function uint8ArrayToHexString(uint8Array) {\n" +
                        "        var out = '';\n" +
                        "        for (var i = 0; i < uint8Array.length; i++) {\n" +
                        "            if (uint8Array[i] < 16) {\n" +
                        "                out += '0';\n" +
                        "            }\n" +
                        "            out += uint8Array[i].toString(16);\n" +
                        "        }\n" +
                        "        return out;\n" +
                        "    }\n" +
                        "    crypto.subtle.importKey(\n" +
                        "        'raw',\n" +
                        "        (new TextEncoder()).encode('"+password+"'),\n" +
                        "        { 'name': 'PBKDF2' },\n" +
                        "        false,\n" +
                        "        ['deriveBits']\n" +
                        "    ).then(function (baseKey) {\n" +
                        "        crypto.subtle.deriveBits(\n" +
                        "            {\n" +
                        "                'name': 'PBKDF2',\n" +
                        "                'salt': hexStringToUint8Array('"+saltHex+"'),\n" +
                        "                'iterations': "+iterations+",\n" +
                        "                'hash': 'SHA-1'\n" +
                        "            },\n" +
                        "            baseKey,\n" +
                        "            256\n" +
                        "    ).then(function(result) {\n" +
                        "            console.log(\n" +
                        "                '"+resultPrefix+"' + uint8ArrayToHexString(\n" +
                        "                    new Uint8Array(result)\n" +
                        "                )\n" +
                        "            );\n" +
                        "        });\n" +
                        "    });\n" +
                        "    </script>\n" +
                        "</body>\n" +
                        "</html>"
        );

    }


    private Promise<Void, ?, ?> pRunExclusive = null;

    private void kfdAssertUiThread(
            String password,
            String saltHex,
            int iterations,
            int callRef
    ){

        if( pRunExclusive != null ) {

            pRunExclusive.done(
                    (DoneCallback<Void>) result -> kfdAssertUiThread(password, saltHex, iterations, callRef)
            );

            return;

        }

        Deferred<Void, ?,?> dRunExclusive = new AndroidDeferredObject<>();

        pRunExclusive= dRunExclusive.promise();

        WebViewManager.isWebViewEngineDead().done((DoneCallback<Boolean>) isDead -> {

            if( isDead ) {

                Log.i("webView dead");

                PBKDF2WithHmacSHA1.run(
                        password,
                        HexStringBinaryRepresentation.fromStringHex(saltHex),
                        iterations
                ).done((DoneCallback<byte[]>) result -> {

                    sendResult(callRef, HexStringBinaryRepresentation.toStringHex(result) );

                    pRunExclusive= null;

                    dRunExclusive.resolve(null);


                } );

                return;


            }

            WebView webView= new WebView(SemasimApplication.getContext());

            webView.resumeTimers();

            webView.getSettings().setJavaScriptEnabled(true);

            webView.setWebChromeClient(new WebChromeClient(){

                @Override
                public boolean onConsoleMessage(ConsoleMessage consoleMessage) {

                    boolean out= super.onConsoleMessage(consoleMessage);

                    String message= consoleMessage.message();

                    if( !message.startsWith(resultPrefix) ){

                        return out;

                    }

                    String resultHex= message.substring(resultPrefix.length());


                    WebViewManager.destroyWebView(webView);

                    sendResult(callRef, resultHex);

                    pRunExclusive= null;

                    dRunExclusive.resolve(null);

                    return out;

                }

            });

            webView.loadDataWithBaseURL(
                    "https://localhost/",
                    getHtml(password, saltHex, iterations),
                    "text/html",
                    "UTF-8",
                    ""
            );


        });


    }


    private void sendResult(int callRef, String resultHex){

        ApiExposedToHostCallerService.invokeOnResultFunction(
                getReactApplicationContext(),
                "kfd",
                callRef,
                params -> params.pushString(resultHex)
        );

    }


}

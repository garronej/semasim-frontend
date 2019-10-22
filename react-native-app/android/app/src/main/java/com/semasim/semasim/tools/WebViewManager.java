package com.semasim.semasim.tools;

import android.annotation.SuppressLint;
import android.content.Context;
import android.content.res.AssetManager;
import android.media.AudioManager;
import android.net.Uri;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;
import android.text.TextUtils;
import android.view.ViewGroup;
import android.webkit.ConsoleMessage;
import android.webkit.CookieManager;
import android.webkit.CookieSyncManager;
import android.webkit.PermissionRequest;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import org.jdeferred2.Deferred;
import org.jdeferred2.DoneCallback;
import org.jdeferred2.Promise;
import org.jdeferred2.android.AndroidDeferredObject;
import org.json.JSONArray;
import org.json.JSONObject;

import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.lang.reflect.Proxy;
import java.util.HashMap;
import java.util.Map;


public class WebViewManager {

    private static final String API_EXPOSED_TO_HOST_NAMESPACE= "apiExposedToHost";
    private static final String API_EXPOSED_BY_HOST_NAMESPACE= "apiExposedByHost";

    public interface WebViewApi<ApiExposedToHost> {
        void setSpeakerphoneOn(boolean value);
        boolean isSpeakerphoneOn();
        void setMicrophoneMute(boolean value);
        boolean isMicrophoneMute();
        /**
         * Does not matter if called more than once
         * Return boolean value isWebViewEngineDead
         * */
        Promise<Boolean, ?, ?> destroyWebView();

        /**
         * Once the web page is fully loaded
         * the api exposed by the web page's JavaScript
         * code can be called from java using the
         * ApiExposedTo host object.
         */
        Promise<ApiExposedToHost, ?, ?> getPrReady();
        WebView getWebView();
    }

    private static class Mutable<T> {
        public T value;
        Mutable(T value ){
            this.value= value;
        }
    }


    public interface AppContextGetter {
        Context getContext();
    }

    private static Runnable mOnWebviewEngineDeadHandler= null;
    private static AppContextGetter appContextGetter;

    public static void setAppContextGetterAndWebviewEngineDeadHandler(
            AppContextGetter appContextGetter,
            Runnable onWebviewEngineDeadHandler
    ) {
        WebViewManager.appContextGetter= appContextGetter;
        mOnWebviewEngineDeadHandler= onWebviewEngineDeadHandler;
    }


    private static final Handler uiHandler = new Handler(Looper.getMainLooper());

    /**
     *
     * |activityContext| can be null, if so the App context will be used.
     * |assetBaseDir|: |ifUseLocalAssets| set to true pages resources
     * that are not embedded to the page html will be loaded from
     * /assets/|assetBaseDir|.
     * eg: https://static.semasim.com/img/logo.png will be loaded from /assets/|assetBaseDir|/img/logo.png
     * If an asset is not found in local it will be downloaded.
     *
     * NOTE: Methods of |ApiExposedToHost| do not have to be called from the UI thread.
     *
     * WARNINGS:
     * - All methods of apiExposedByHost should be annotated @JavascriptInterface or they wont be exposed.
     * - All the apiExposedByHost methods will be called from a thread that is NOT the main thread.
     *
     * assetBase dir if not null is the android assets directory where
     * the resources ( js, css ) will be loaded from.
     * ( To prevent download thus speeding up page load )
     *
     * Target web page should expose window[API_EXPOSED_TO_HOST_NAMESPACE]
     *
     * Target web page can assume window[API_EXPOSED_BY_HOST_NAMESPACE] is defined
     *
     */
    @SuppressLint("JavascriptInterface")
    public static <ApiExposedToHost> WebViewApi<ApiExposedToHost> newWebView(
            final Context activityContext,
            final String url,
            final boolean useLocalAssets,
            final String assetBaseDir,
            final Class<ApiExposedToHost> interfaceOfApiExposedToHost,
            final Object apiExposedByHost
    ){

        if (Build.VERSION.SDK_INT >= 19 ) {

            WebView.setWebContentsDebuggingEnabled(true);

        }

        final Mutable<WebView> webViewMutable = new Mutable<>(
                new WebView(
                        activityContext == null ?
                                appContextGetter.getContext() :
                                activityContext
                )
        );

        webViewMutable.value.resumeTimers();

        {

            WebSettings webSettings = webViewMutable.value.getSettings();

            webSettings.setJavaScriptEnabled(true);

            if (Build.VERSION.SDK_INT >= 17 ) {

                webSettings.setMediaPlaybackRequiresUserGesture(false);

            }

        }

        final Deferred<ApiExposedToHost,? , ?> dReady= new AndroidDeferredObject<>();

        final AssetManager assetManager = appContextGetter.getContext().getAssets();

        final Map<String,String> assetMap = new HashMap<>();


        webViewMutable.value.setWebViewClient(new WebViewClient(){

            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {

                if( Build.VERSION.SDK_INT < 21 || assetBaseDir == null ){
                    return null;
                }

                final String assetPath= assetBaseDir + request.getUrl().getPath();

                if( useLocalAssets ) {

                    InputStream inputStream;

                    try {

                        inputStream = assetManager.open(assetPath);

                    }catch(IOException exception ){

                        Log.i("garronej: File:  " + request.getUrl() + " not in resource " + exception.getMessage());

                        return null;

                    }

                    return new WebResourceResponse(null, null, inputStream);

                }else {

                    final String assetUrl= request.getUrl().toString();

                    uiHandler.post(() -> {

                        assetMap.put(assetPath, assetUrl);

                        FileOutputStream outputStream;

                        try {
                            outputStream = appContextGetter.getContext().openFileOutput(
                                    "webview_static_" + Uri.parse(url).getPath().substring(1) + ".json",
                                    Context.MODE_PRIVATE
                            );

                            outputStream.write(
                                    new JSONObject(assetMap)
                                            .toString()
                                            .getBytes()
                            );

                            outputStream.close();

                        } catch (Exception e) {

                            throw new RuntimeException(e.getMessage());

                        }

                    });

                    return null;

                }


            }


        });


        webViewMutable.value.setWebChromeClient(new WebChromeClient(){

            @Override
            public void onPermissionRequest(PermissionRequest request) {

                if (Build.VERSION.SDK_INT >= 21 ) {

                    request.grant(request.getResources());

                }

            }

            @Override
            @SuppressWarnings("unchecked")
            public boolean onConsoleMessage(ConsoleMessage consoleMessage) {

                Log.i("garronej: (console.log) ->" + consoleMessage.messageLevel() + " " + consoleMessage.lineNumber() + ": " + consoleMessage.message());

                if( dReady.isResolved() || !consoleMessage.message().equals("->__PAGE_READY__<-") ) {

                    return super.onConsoleMessage(consoleMessage);

                }

                dReady.resolve(
                        (ApiExposedToHost) Proxy.newProxyInstance(
                                interfaceOfApiExposedToHost.getClassLoader(),
                                new Class[]{interfaceOfApiExposedToHost},
                                (proxy, method, args) -> {

                                    int length = args != null ? args.length : 0;

                                    String[] strArgs= new String[length];

                                    for( int i = 0; i<length; i++){

                                        Object arg= args[i];

                                        String str;

                                        if( arg == null ){
                                            str = "null";
                                        }else if( arg instanceof String ){

                                            JSONArray jsonArray = new JSONArray();

                                            jsonArray.put(0, arg);

                                            str= jsonArray.toString()
                                                    .replaceFirst(".$","")
                                                    .replaceFirst("^.","")
                                            ;

                                        }else if( arg instanceof Boolean ) {
                                            str = (Boolean) arg ? "true" : "false";
                                        }else if( arg instanceof Integer) {
                                            str = String.valueOf(arg);
                                        }else if( arg instanceof Character){
                                            str= arg.toString();
                                        }else{
                                            throw new RuntimeException("Not a valid argument: " + arg);
                                        }

                                        strArgs[i]= str;

                                    }

                                    String script = API_EXPOSED_TO_HOST_NAMESPACE
                                            + "."+ method.getName() + "("
                                            + TextUtils.join(", ", strArgs) + ")";

                                    Log.i("garronej: about to invoke javascript method: " + script);

                                    uiHandler.post(()-> {


                                        if( webViewMutable.value == null ) {

                                            Log.i("garronej: can't invoke method, webView destroyed");

                                            return;

                                        }


                                        webViewMutable.value.loadUrl("javascript:" + script);


                                    });

                                    return null;

                                }
                        )
                );

                return super.onConsoleMessage(consoleMessage);

            }

        });

        webViewMutable.value.addJavascriptInterface(apiExposedByHost, API_EXPOSED_BY_HOST_NAMESPACE);

        //Clearing cookies
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP_MR1) {
            CookieManager.getInstance().removeAllCookies(null);
            CookieManager.getInstance().flush();
        } else {
            CookieSyncManager cookieSyncMngr = CookieSyncManager.createInstance(appContextGetter.getContext());
            cookieSyncMngr.startSync();
            CookieManager cookieManager = CookieManager.getInstance();
            cookieManager.removeAllCookie();
            cookieManager.removeSessionCookie();
            cookieSyncMngr.stopSync();
            cookieSyncMngr.sync();
        }

        Log.i("garronej loading url now " + (assetBaseDir == null ? "( assets will be downloaded from remote )": "" ));

        webViewMutable.value.loadUrl(url);

        final AudioManager audioManager = (AudioManager) webViewMutable.value.getContext().getSystemService(Context.AUDIO_SERVICE);

        final Mutable<Boolean> isSpeakerEnabledMutable= new Mutable<>(false);
        final Mutable<Boolean> isMicrophoneMuteMutable= new Mutable<>(false);

        final Runnable updateAudioManager = () -> {

            audioManager.setMode(AudioManager.MODE_IN_CALL);
            audioManager.setSpeakerphoneOn(isSpeakerEnabledMutable.value);
            audioManager.setMicrophoneMute(isMicrophoneMuteMutable.value);

        };

        return new WebViewApi<ApiExposedToHost>() {
            @Override
            public void setSpeakerphoneOn(boolean value) {
                isSpeakerEnabledMutable.value=value;
                updateAudioManager.run();
            }

            @Override
            public boolean isSpeakerphoneOn() {
                return isSpeakerEnabledMutable.value;
            }

            @Override
            public void setMicrophoneMute(boolean value) {
                isMicrophoneMuteMutable.value= value;
                updateAudioManager.run();
            }

            @Override
            public boolean isMicrophoneMute() {
                return isMicrophoneMuteMutable.value;
            }


            @Override
            public Promise<Boolean, ?, ?> destroyWebView() {

                if( webViewMutable.value == null ){
                    return (new AndroidDeferredObject<Boolean, Void, Void>())
                            .resolve(false)
                            .promise();
                }

                WebViewManager.destroyWebView(webViewMutable.value);

                webViewMutable.value= null;


                return isWebViewEngineDead()
                        .done((DoneCallback<Boolean>) isDead -> {

                            if( mOnWebviewEngineDeadHandler == null || !isDead){
                                return;
                            }

                            mOnWebviewEngineDeadHandler.run();

                        })
                        ;



            }

            @Override
            public Promise<ApiExposedToHost, ?, ?> getPrReady() {
                return dReady.promise();
            }

            @Override
            public WebView getWebView() {
                return webViewMutable.value;
            }
        };

    }

    public static void destroyWebView(WebView webView){

        webView.setWebViewClient(new WebViewClient());
        webView.setWebChromeClient(new WebChromeClient());

        {

            ViewGroup viewGroup = (ViewGroup) webView.getParent();

            if (viewGroup != null) {

                viewGroup.removeView(webView);

            }

        }

        webView.clearHistory();

        webView.clearCache(true);

        webView.loadUrl("about:blank");

        webView.onPause();

        webView.removeAllViews();

        webView.destroyDrawingCache();

        webView.pauseTimers();

        webView.destroy();

    }

    /** On android 5.0 ( Galaxy S4 on Lollipop ) WebView engine may stop working
     * If so the app needs to be restarted.
     * This function test if the WebView engine is still alive.
     */
    public static Promise<Boolean, ?, ?> isWebViewEngineDead() {

        final Deferred<Boolean, ?, ?> dOut = new AndroidDeferredObject<>();

        final Mutable<WebView> webViewMutable = new Mutable<>(
                new WebView(
                        appContextGetter.getContext()
                )
        );

        webViewMutable.value.resumeTimers();

        final Handler handler = new Handler();

        final Runnable runnableError= () -> dOut.resolve(true);

        handler.postDelayed(runnableError, 1000);

        final Runnable runnableSuccess= () -> {

            if( dOut.isResolved() ){
                return;
            }

            handler.removeCallbacks(runnableError);

            dOut.resolve(false);

        };

        webViewMutable.value.setWebViewClient(new WebViewClient(){

            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, String url) {
                runnableSuccess.run();
                return super.shouldInterceptRequest(view, url);
            }

            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                runnableSuccess.run();
                return super.shouldInterceptRequest(view, request);
            }


        });


        dOut.done((DoneCallback<Boolean>) aBoolean -> {

            destroyWebView(webViewMutable.value);

            webViewMutable.value= null;

        });

        webViewMutable.value.loadUrl("file:///android_asset/is_webview_engine_dead.html" );

        return dOut.promise();

    }

}


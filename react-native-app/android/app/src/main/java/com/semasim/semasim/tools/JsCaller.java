package com.semasim.semasim.tools;

import android.content.Context;
import org.liquidplayer.javascript.JSContext;
import org.liquidplayer.javascript.JSObject;
import org.liquidplayer.javascript.JSValue;

import java.io.IOException;
import java.io.InputStream;
import java.util.HashMap;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;
import java.util.Scanner;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class JsCaller {

    private interface JSScript {
        JSContext getJSContext();
        JSObject getJSLibNamespace();
    }

    private static Map<String, JSScript> jsScriptByPath = new HashMap<>();

    public interface AppContextGetter {
        Context getContext();
    }

    private static AppContextGetter appContextGetter;

    public static void setAppContextGetterAndPreloadScripts(AppContextGetter appContextGetter, String[] scriptsPath) {
        JsCaller.appContextGetter= appContextGetter;

        ExecutorService executor = Executors.newFixedThreadPool(scriptsPath.length);

        for(String scriptPath: scriptsPath){
            executor.execute(()-> getJSScript(scriptPath));
        }

        executor.shutdown();

    }


    private static synchronized JSScript getJSScript(String scriptPath){

        if( jsScriptByPath.containsKey(scriptPath) ) {

            return jsScriptByPath.get(scriptPath);

        }

        final JSContext jsContext = new JSContext();

        Context appContext = JsCaller.appContextGetter.getContext();

        InputStream inputStream;

        try {

            inputStream = appContext.getAssets().open(scriptPath);

        }catch(IOException e) {

            throw new RuntimeException(e.getMessage());

        }

        String script = (new Scanner(inputStream,"UTF-8"))
                .useDelimiter("\\A")
                .next();

        jsContext.evaluateScript(script);

        String moduleName = scriptPath.substring(
                scriptPath.lastIndexOf("/")+1,
                scriptPath.lastIndexOf(".js")
        );

        final JSObject jsLibNamespace = jsContext.evaluateScript("require('"+ moduleName +"')")
                .toObject();

        jsScriptByPath.put(
                scriptPath,
                new JSScript(){

                    @Override
                    public JSContext getJSContext() {
                        return jsContext;
                    }

                    @Override
                    public JSObject getJSLibNamespace() {
                        return jsLibNamespace;
                    }
                }
        );

        return getJSScript(scriptPath);

    }


    public interface ArgumentsBuilder {
        void buildArgs(List<JSValue> args, JSContext jsContext);
    }

    /**
     * scriptPath relative to asset folder ( /assert eg:jsScripts/semasim-mobile.js )
     * argumentsBuilder can be null, throws JSException
     * */
    public static JSValue callJsFunction(String scriptPath, String functionName, ArgumentsBuilder argumentsBuilder) {

        JSScript jsScript = getJSScript(scriptPath);

        List<JSValue> args= new LinkedList<>();

        if (argumentsBuilder != null) {

            argumentsBuilder.buildArgs(args, jsScript.getJSContext());

        }

        return jsScript
                .getJSLibNamespace()
                .property(functionName)
                .toFunction()
                .apply(null, args.toArray())
                ;

    }

}

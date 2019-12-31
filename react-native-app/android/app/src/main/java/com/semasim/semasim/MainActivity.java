package com.semasim.semasim;

import com.facebook.react.ReactActivity;

import org.jdeferred2.Deferred;
import org.jdeferred2.Promise;
import org.jdeferred2.android.AndroidDeferredObject;

import java.util.ArrayList;
import java.util.List;


public class MainActivity extends ReactActivity {

    /**
     * Returns the name of the main component registered from JavaScript.
     * This is used to schedule rendering of the component.
     */
    @Override
    protected String getMainComponentName() {
        return "Semasim";
    }

    private static final List<Runnable> onceOnResumeHandlers= new ArrayList<>();

    public static Promise<Void, ?, ?> waitForOnResume(){

        Deferred<Void, ?, ?> dOut= new AndroidDeferredObject<>();

        onceOnResumeHandlers.add(() -> dOut.resolve(null));

        return dOut;


    }



    @Override
    protected  void onResume(){
        super.onResume();

        isVisible= true;

        Runnable[] onceOnResumeHandlersArr= onceOnResumeHandlers.toArray(new Runnable[0]);

        onceOnResumeHandlers.clear();

        for( Runnable runnable: onceOnResumeHandlersArr){
            runnable.run();
        }

    }

    @Override
    protected void onPause() {
        super.onPause();

        isVisible= false;

    }

    private static boolean isVisible;

    public static boolean getIsVisible() {
        return isVisible;
    }




}

package com.semasim.semasim;

import android.app.AlarmManager;
import android.app.Application;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;

import com.facebook.react.PackageList;
import com.facebook.react.ReactApplication;
import com.facebook.react.ReactNativeHost;
import com.facebook.react.ReactPackage;
import com.facebook.soloader.SoLoader;
import com.semasim.semasim.tools.JsCaller;
import com.semasim.semasim.tools.Log;
import com.semasim.semasim.tools.WebViewManager;
import com.semasim.semasim.tools.webrtc.WebRTCApiExposedByHostImpl;


import java.util.List;

/*
import android.support.multidex.MultiDex;
import android.support.multidex.MultiDexApplication;
public class App extends MultiDexApplication {
  @Override
  protected void attachBaseContext(Context context) {
    super.attachBaseContext(context);
    MultiDex.install(this);
  }
 */

public class MainApplication extends Application implements ReactApplication {

  private final ReactNativeHost mReactNativeHost = new ReactNativeHost(this) {
    @Override
    public boolean getUseDeveloperSupport() {
      return BuildConfig.DEBUG;
    }

    @Override
    protected List<ReactPackage> getPackages() {

      List<ReactPackage> packages = new PackageList(this).getPackages();
      // Packages that cannot be autolinked yet can be added manually here
      packages.add(new HostCryptoLibPackage());
      packages.add(new HostWebRtcPackage());
      packages.add(new HostKfdPackage());
      packages.add(new HostKeepAlivePackage());
      packages.add(new HostAudioManagerPackage());

      return packages;
    }

    @Override
    protected String getJSMainModuleName() {
      return "index";
    }
  };

  @Override
  public ReactNativeHost getReactNativeHost() {
    return mReactNativeHost;
  }


  @Override
  public void onCreate() {
    super.onCreate();

    //NOTE: Logic outside of react native.
    this.onCreateCustom();

    SoLoader.init(this, /* native exopackage */ false);
  }

  private static Context mContext;

  private void onCreateCustom(){

    mContext = this;

    WebViewManager.setAppContextGetterAndWebviewEngineDeadHandler(
            MainApplication::getContext,
            () -> restartApp()
    );

    JsCaller.setAppContextGetterAndPreloadScripts(
            MainApplication::getContext,
            new String[]{ HostCryptoLib.scriptPath }
    );

    WebRTCApiExposedByHostImpl.setAppContextGetter(MainApplication::getContext);

  }

  public static Context getContext(){
    return mContext;
  }



  public static void restartApp(){

    Intent intent = new Intent(
            getContext(),
            MainActivity.class
    );


    Log.i("(not)ReactNativeJS Schedule restart in 500ms");

    ((AlarmManager) getContext().getSystemService(Context.ALARM_SERVICE))
            .set(
                    AlarmManager.RTC,
                    System.currentTimeMillis() + 500,
                    PendingIntent.getActivity(
                            MainApplication.getContext(),
                            (int) System.currentTimeMillis(),
                            intent,
                            PendingIntent.FLAG_CANCEL_CURRENT
                    )
            );

      /*
      foregroundActivity.finish();

      {
        Intent intent = new Intent(Intent.ACTION_MAIN);
        intent.addCategory(Intent.CATEGORY_HOME);
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        MainApplication.getContext().startActivity(intent);
      }

      */

    android.os.Process.killProcess(android.os.Process.myPid());

  }

}

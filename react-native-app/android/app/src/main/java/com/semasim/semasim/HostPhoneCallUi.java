package com.semasim.semasim;

import android.annotation.SuppressLint;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.graphics.drawable.Icon;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.telecom.PhoneAccount;
import android.telecom.PhoneAccountHandle;
import android.telecom.TelecomManager;
import android.util.SparseArray;

import androidx.annotation.NonNull;
import androidx.annotation.RequiresPermission;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;


import org.jdeferred2.Deferred;
import org.jdeferred2.DoneCallback;
import org.jdeferred2.Promise;
import org.jdeferred2.android.AndroidDeferredObject;
import org.json.JSONArray;
import org.json.JSONException;

import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import com.semasim.semasim.tools.Log;
import com.semasim.semasim.tools.MethodNameGetter;
import com.semasim.semasim.tools.Serializer;

public class HostPhoneCallUi extends ReactContextBaseJavaModule {


    @Override
    @NonNull
    public String getName() {
        return "HostPhoneCallUi";
    }


    private final Icon icon;
    private final TelecomManager telecomManager;
    private static HostPhoneCallUi instance;

    @Override
    public void onCatalystInstanceDestroy() {
        super.onCatalystInstanceDestroy();
        instance = null;
    }


    HostPhoneCallUi(ReactApplicationContext reactContext) {
        super(reactContext);


        //TODO: Check Instantiated only once


        Context appContext = reactContext.getApplicationContext();

        icon = Icon.createWithResource(
                appContext,
                SemasimApplication.getContext().getResources().getIdentifier(
                        "semasim_icon_grayscale",
                        "drawable",
                        appContext.getPackageName()
                )
        );

        telecomManager = (TelecomManager) appContext.getSystemService(Context.TELECOM_SERVICE);

        //sipRegisteredSims.clear();

        instance = this;

    }

    private static void notify(String functionName, Integer phoneCallRef, ApiExposedToHostCallerService.ParamsEditor paramsEditor) {


        ApiExposedToHostCallerService.invokeFunction(
                HostPhoneCallUi.instance != null ? instance.getReactApplicationContext() : null,
                functionName,
                params -> {

                    if (phoneCallRef != null) {

                        params.pushInt(phoneCallRef);

                    }

                    if (paramsEditor != null) {

                        paramsEditor.editParams(params);

                    }


                }
        );


    }


    static void notifyCallAnswered(int phoneCallRef) {
        notify(
                MethodNameGetter.get(),
                phoneCallRef,
                null
        );
    }

    static void notifyDtmf(int phoneCallRef, String dtmf) {
        notify(
                MethodNameGetter.get(),
                phoneCallRef,
                params -> params.pushString(dtmf)
        );
    }

    static void notifyEndCall(int phoneCallRef) {
        notify(
                MethodNameGetter.get(),
                phoneCallRef,
                null
        );
    }



    private static final SparseArray<Deferred<String, ?, ?>> dContactNameByPhoneCallRef = new SparseArray<>();

    static Promise<String,?,?> notifyUiOpenForOutgoingCallAndGetContactName(int phoneCallRef, String imsi, String phoneNumberRaw) {

        notify(
                MethodNameGetter.get(),
                phoneCallRef,
                params -> {
                    params.pushString(imsi);
                    params.pushString(phoneNumberRaw);
                }
        );

        Deferred<String, ?, ?> dContactName = new AndroidDeferredObject<>();

        dContactNameByPhoneCallRef.put( phoneCallRef, dContactName );

        return dContactName.promise();

    }

    @SuppressWarnings("unused")
    @ReactMethod
    public void onGetContactNameResponse(int phoneCallRef, String contactName) {

        Deferred<String, ?, ?> dContactName = dContactNameByPhoneCallRef.get(phoneCallRef);

        if( dContactName == null ){
            throw new RuntimeException("never");
        }

        dContactName.resolve(contactName);

        dContactNameByPhoneCallRef.delete(phoneCallRef);

    }


    @SuppressWarnings("unused")
    @ReactMethod
    public void openPhoneAccountSettings(int callRef) {

        String methodName = MethodNameGetter.get();

        openPhoneAccountSettings().done(
                (DoneCallback<Void>) result -> ApiExposedToHostCallerService.invokeOnResultFunction(
                        getReactApplicationContext(),
                        methodName,
                        callRef,
                        null
                )
        );


    }

    private Promise<Void, ?, ?> openPhoneAccountSettings() {

        Intent intent = Build.MANUFACTURER.equalsIgnoreCase("Samsung") ?
                new Intent()
                        .setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_MULTIPLE_TASK)
                        .setComponent(
                                new ComponentName(
                                        "com.android.server.telecom",
                                        "com.android.server.telecom.settings.EnableAccountPreferenceActivity"
                                )
                        )
                :
                new Intent(TelecomManager.ACTION_CHANGE_PHONE_ACCOUNTS)
                        .setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_MULTIPLE_TASK);

        SemasimApplication.getContext().startActivity(intent);

        return MainActivity.waitForOnResume();

    }


    /*
    private final static Set<String> sipRegisteredSims = new HashSet<>();

    static boolean isPhoneAccountSipRegistered(PhoneAccountHandle phoneAccountHandle) {
        return sipRegisteredSims.contains(
                phoneAccountHandle.getId()
        );
    }

     */


    @SuppressWarnings("unused")
    @ReactMethod
    public void setIsPhoneAccountSipRegistered(
            String imsi,
            boolean isPhoneAccountSipRegistered,
            int callRef
    ) {

        //setIsPhoneAccountSipRegistered(imsi, isPhoneAccountSipRegistered);

        ApiExposedToHostCallerService.invokeOnResultFunction(
                getReactApplicationContext(),
                MethodNameGetter.get(),
                callRef,
                null
        );


    }

    /*
    private static synchronized void setIsPhoneAccountSipRegistered(
            String imsi,
            boolean isPhoneAccountSipRegistered
    ) {

        if( isPhoneAccountSipRegistered ){
            sipRegisteredSims.add(imsi);
        }else{
            sipRegisteredSims.remove(imsi);
        }

    }
     */




    @SuppressWarnings("unused")
    @ReactMethod
    public void registerOrUpdatePhoneAccount(
            String imsi,
            String friendlyName,
            String serviceProvider,
            String phoneNumber,
            int callRef
    ) {

        registerOrUpdatePhoneAccount(
                imsi,
                friendlyName,
                serviceProvider,
                phoneNumber
        );

        ApiExposedToHostCallerService.invokeOnResultFunction(
                getReactApplicationContext(),
                MethodNameGetter.get(),
                callRef,
                null
        );


    }

    /** phoneNumber can be null */
    private void registerOrUpdatePhoneAccount(
            @NonNull String imsi,
            @NonNull String friendlyName,
            @NonNull String serviceProvider,
            String phoneNumber
    ) {

        //_listPhoneAccount();

        PhoneAccountHandle phoneAccountHandle = getPhoneAccountHandle(imsi);

        {

            PhoneAccount phoneAccount = telecomManager.getPhoneAccount(phoneAccountHandle);

            if (phoneAccount != null) {

                if (phoneAccount.getLabel().equals(friendlyName)) {
                    return;
                }

                telecomManager.unregisterPhoneAccount(phoneAccountHandle);

            }


        }

        PhoneAccount phoneAccount;
        {

            PhoneAccount.Builder builder = new PhoneAccount.Builder(
                    getPhoneAccountHandle(imsi),
                    friendlyName
            )
                    .setCapabilities(PhoneAccount.CAPABILITY_CALL_PROVIDER)
                    .setShortDescription(serviceProvider)
                    .setSupportedUriSchemes(Collections.singletonList(PhoneAccount.SCHEME_TEL))
                    .setIcon(icon);

            if (phoneNumber != null) {

                builder.setAddress(
                        Uri.fromParts(
                                PhoneAccount.SCHEME_TEL,
                                phoneNumber,
                                null
                        )
                );

            }

            phoneAccount = builder.build();

        }

        telecomManager.registerPhoneAccount(phoneAccount);

    }

    @SuppressWarnings("unused")
    @ReactMethod
    private void unregisterOtherPhoneAccounts(
            String imsisJson,
            int callRef
    ){

        List<String> imsis= new ArrayList<>();
        {

            JSONArray imsiJsonParsed;

            try {

                imsiJsonParsed = new JSONArray(imsisJson);

            }catch(JSONException e){

                throw new RuntimeException(e.getMessage());

            }

            for (int i = 0; i < imsiJsonParsed.length(); i++) {
                String imsi;
                try {
                    imsi = imsiJsonParsed.getString(i);
                } catch (JSONException e) {
                    throw new RuntimeException(e.getMessage());
                }

                imsis.add(imsi);

            }

        }

        unregisterOtherPhoneAccounts( imsis );

        ApiExposedToHostCallerService.invokeOnResultFunction(
                getReactApplicationContext(),
                MethodNameGetter.get(),
                callRef,
                null
        );

    }


    private void unregisterOtherPhoneAccounts(List<String> imsis){

        @SuppressLint("MissingPermission") List<PhoneAccountHandle> phoneAccountHandles = getPhoneAccountHandles();

        for( PhoneAccountHandle phoneAccountHandle: phoneAccountHandles){

            if( imsis.contains(phoneAccountHandle.getId()) ){
                continue;
            }

            telecomManager.unregisterPhoneAccount(phoneAccountHandle);

        }

    }

    private PhoneAccountHandle getPhoneAccountHandle(String imsi) {

        return new PhoneAccountHandle(
                new ComponentName(
                        getReactApplicationContext().getApplicationContext(),
                        SemasimConnectionService.class
                ),
                imsi
        );

    }


    @RequiresPermission(android.Manifest.permission.READ_PHONE_STATE)
    @SuppressWarnings("unchecked")
    private List<PhoneAccountHandle> getPhoneAccountHandles() {

        List<PhoneAccountHandle> phoneAccountHandles;
        try{

            Method method;

            try {

                method = telecomManager.getClass().getDeclaredMethod(
                        "getCallCapablePhoneAccounts",
                        boolean.class
                );


            } catch (NoSuchMethodException e) {
                throw new NoSuchMethodException(e.getMessage());

            }

            //NOTE: If we comment this the code still run fine. Idk why the method is not accesible from here.
            method.setAccessible(true);

            try {

                 phoneAccountHandles = (List<PhoneAccountHandle>) method.invoke(
                        telecomManager,
                        true
                );
            } catch (IllegalAccessException | InvocationTargetException e) {
                throw new NoSuchMethodException(e.getMessage());
            }

        }catch(NoSuchMethodException e){

            Log.i("WARNING: Can't pull all PhoneAccountHandle");

            //NOTE: Phone account handles that haven't been enabled by the user will not appear.
            phoneAccountHandles= telecomManager.getCallCapablePhoneAccounts();

        }

        List<PhoneAccountHandle> semasimPhoneAccountHandles= new ArrayList<>();

        {

            ComponentName componentName = new ComponentName(
                    getReactApplicationContext().getApplicationContext(),
                    SemasimConnectionService.class
            );

            for (PhoneAccountHandle phoneAccountHandle : phoneAccountHandles) {


                int compare = phoneAccountHandle.getComponentName().compareTo(componentName);

                if (compare != 0) {
                    continue;
                }

                semasimPhoneAccountHandles.add(phoneAccountHandle);


            }

        }

        return semasimPhoneAccountHandles;

    }

    @SuppressWarnings("unused")
    @ReactMethod
    public void getIsSimPhoneAccountEnabled(String imsi, int callRef) {

        boolean isSipPhoneAccountEnabled = getIsSimPhoneAccountEnabled(imsi);

        ApiExposedToHostCallerService.invokeOnResultFunction(
                getReactApplicationContext(),
                MethodNameGetter.get(),
                callRef,
                params -> params.pushBoolean(isSipPhoneAccountEnabled)
        );


    }

    private boolean getIsSimPhoneAccountEnabled(String imsi){


        PhoneAccount phoneAccount= telecomManager.getPhoneAccount(
                getPhoneAccountHandle(
                        imsi
                )
        );

        if( phoneAccount == null ) {

            throw new RuntimeException("PhoneAccount not registered");

        }

        return phoneAccount.isEnabled();

    }

    /** Assert contact name not null, if no contact name provide empty string */
    @SuppressWarnings("unused")
    @ReactMethod
    public void placeCall(
            int phoneCallRef,
            String imsi,
            String phoneNumber
    ){

        Bundle placeCallExtras;
        {

            placeCallExtras = new Bundle();

            placeCallExtras.putParcelable(
                    TelecomManager.EXTRA_PHONE_ACCOUNT_HANDLE,
                    getPhoneAccountHandle(imsi)
            );

            includeSemasimOutgoingCallExtrasInConnectionRequestExtras(
                    placeCallExtras,
                    phoneCallRef
            );

        }

        Uri uri= Uri.fromParts(
                PhoneAccount.SCHEME_TEL,
                phoneNumber,
                null
        );


        try {

            telecomManager.placeCall(
                    uri,
                    placeCallExtras
            );

        }catch(SecurityException e){
            //NOTE: Assert we have already all the permissions to make the call
            throw new RuntimeException(e.getMessage());
        }


    }


    @SuppressWarnings("unused")
    @ReactMethod
    public void setCallActive(int phoneCallRef) {
        SemasimConnectionService.setCallActive(phoneCallRef);
    }

    //TODO: Implement termination cause
    @SuppressWarnings("unused")
    @ReactMethod
    public void reportCallTerminated(int phoneCallRef) {
        SemasimConnectionService.reportCallTerminated(phoneCallRef);
    }


    interface SemasimOutgoingCallExtras {
        int getPhoneCallRef();
    }

    private static final String SEMASIM_OUTGOING_CALL_EXTRAS_SINGLE_KEY= "KEY";

    private static void includeSemasimOutgoingCallExtrasInConnectionRequestExtras(
            Bundle placeCallExtras,
            int phoneCallRef
    ){

        Bundle outgoingConnectionRequestExtras = new Bundle();

        outgoingConnectionRequestExtras.putString(
                HostPhoneCallUi.SEMASIM_OUTGOING_CALL_EXTRAS_SINGLE_KEY,
                Serializer.stringifyObject(
                        (SemasimOutgoingCallExtras) () -> phoneCallRef
                )
        );

        placeCallExtras.putParcelable(
                TelecomManager.EXTRA_OUTGOING_CALL_EXTRAS,
                outgoingConnectionRequestExtras
        );

    }

    static SemasimOutgoingCallExtras extractSemasimOutgoingCallExtrasFromConnectionRequestExtras(
            @NonNull Bundle outgoingConnectionRequestExtras
    ){

        String semasimOutgoingCallExtrasJson = outgoingConnectionRequestExtras.getString(
                HostPhoneCallUi.SEMASIM_OUTGOING_CALL_EXTRAS_SINGLE_KEY
        );

        if( semasimOutgoingCallExtrasJson == null ){
            return null;
        }

        return Serializer.parseObjectJson(
                SemasimOutgoingCallExtras.class,
                semasimOutgoingCallExtrasJson
        );


    }




















}

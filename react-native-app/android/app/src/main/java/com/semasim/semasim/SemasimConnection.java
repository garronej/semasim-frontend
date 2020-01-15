package com.semasim.semasim;


import android.annotation.TargetApi;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.telecom.Connection;
import android.telecom.DisconnectCause;
import android.telecom.PhoneAccount;
import android.telecom.StatusHints;
import android.telecom.TelecomManager;

import androidx.annotation.NonNull;

import com.semasim.semasim.tools.Log;

import org.jdeferred2.DoneCallback;
import org.jdeferred2.Promise;

@TargetApi(Build.VERSION_CODES.M)
public class SemasimConnection extends Connection {

    interface Listeners {
        void onAnswer();
        void onPlayDtmfTone(char dtmf);
        void onDisconnect();
        void onAbort();
        void onHold();
        void onUnhold();
        void onReject();
    }

    private final Listeners listeners;


    SemasimConnection(
            @NonNull String phoneNumber,
            @NonNull Promise<String, ?, ?> prContactName,
            @NonNull Listeners listeners
    ) {
        super();


        this.listeners= listeners;

        setConnectionCapabilities(Connection.CAPABILITY_MUTE);

        setInitializing();

        setAudioModeIsVoip(true);

        setDialing();

        setAddress(
                Uri.fromParts(
                        PhoneAccount.SCHEME_TEL,
                        phoneNumber,
                        null
                ),
                TelecomManager.PRESENTATION_ALLOWED
        );

        prContactName.done((DoneCallback<String>) contactName -> {

            Log.i("=====================> PromiseResolve: " + contactName);

            if (contactName == null ) {
                return;
            }

            /*
             * NOTE: Will take effect only if there isn't a contact with this phone number
             * in the contacts of the phone. Even tho the name will appear while in call
             * the call history will only show the phone number.
             */
            setCallerDisplayName(
                    contactName,
                    TelecomManager.PRESENTATION_ALLOWED
            );


        });

        /*
        setCallerDisplayName(
                "Loading........................",
                TelecomManager.PRESENTATION_ALLOWED
        );
         */


        // ‍Weirdly on some Samsung phones (A50, S9...) using `setInitialized` will not display the native UI ...
        // when making a call from the native Phone application. The call will still be displayed correctly without it.
        //TODO: See if should put after prContactNameResolve
        if (!Build.MANUFACTURER.equalsIgnoreCase("Samsung")) {
            setInitialized();
        }

    }


    @Override
    public void onAnswer() {
        super.onAnswer();

        setConnectionCapabilities(getConnectionCapabilities() | Connection.CAPABILITY_HOLD);
        setAudioModeIsVoip(true);

        listeners.onAnswer();

    }

    @Override
    public void onPlayDtmfTone(char dtmf) {
        //NOTE: We do not call super so android is not supposed to play dtmf sound.

        listeners.onPlayDtmfTone(dtmf);


    }



    @Override
    public void onDisconnect() {
        super.onDisconnect();

        //TODO: Implement ANSWERED SOMEWHERE ELSE
        setDisconnected(
                new DisconnectCause(
                        DisconnectCause.LOCAL
                )
        );

        listeners.onDisconnect();

        destroy();

    }

    @Override
    public void onAbort() {
        super.onAbort();

        setDisconnected(
                new DisconnectCause(
                        DisconnectCause.REJECTED
                )
        );

        listeners.onAbort();

        destroy();

    }

    @Override
    public void onHold() {

        super.onHold();

        setOnHold();

        listeners.onHold();

    }

    @Override
    public void onUnhold() {

        super.onUnhold();

        listeners.onUnhold();

        setActive();

    }


    @Override
    public void onReject() {

        super.onReject();

        setDisconnected(
                new DisconnectCause(
                        DisconnectCause.REJECTED
                )
        );

        listeners.onReject();

        destroy();

    }


    /*
    void updateCapabilitiesAndSetActive() {

        setConnectionCapabilities(
                getConnectionCapabilities() |
                        Connection.CAPABILITY_HOLD
        );

        setActive();

    }
     */

    void reportRemoteDisconnect(){

        setDisconnected(
                new DisconnectCause(
                        DisconnectCause.REMOTE
                )
        );

        destroy();

    }



}

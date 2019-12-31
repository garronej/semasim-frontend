package com.semasim.semasim;


import android.annotation.TargetApi;
import android.net.Uri;
import android.os.Build;
import android.telecom.Connection;
import android.telecom.DisconnectCause;
import android.telecom.TelecomManager;

import com.semasim.semasim.tools.Log;

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

    private void debug(String txt) {

        Log.i("=============================================> " + txt);

        if( this.getAddress() != null ) {

            Log.i("=======================> Connection this.getAddress()[uri].toString(): " + this.getAddress().toString());

        }

        Log.i("=======================> Connection callerDisplayName before it is set: " + this.getCallerDisplayName());

        for (String key: this.getExtras().keySet()) {
            Log.i("======================> Connection getExtra()[bundle]: " + key + " is a key in the bundle");
        }

        Log.i("=======================> Connection statusHists.toString(): " + this.getStatusHints().toString());

    }

    SemasimConnection(
            String phoneNumber,
            String contactName,
            Listeners listeners
    ) {
        super();

        //debug("just after super");

        this.listeners= listeners;

        setConnectionCapabilities(Connection.CAPABILITY_MUTE);

        setInitializing();

        setAudioModeIsVoip(true);

        setDialing();

        setAddress(
                Uri.parse(phoneNumber),
                TelecomManager.PRESENTATION_ALLOWED
        );

        //debug("just after setAddress");

        if (contactName != null ) {

            setCallerDisplayName(
                    contactName,
                    TelecomManager.PRESENTATION_ALLOWED
            );

            //debug("just after setCallerDisplayName: " + contactName);

        }

        // ‍️Weirdly on some Samsung phones (A50, S9...) using `setInitialized` will not display the native UI ...
        // when making a call from the native Phone application. The call will still be displayed correctly without it.
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

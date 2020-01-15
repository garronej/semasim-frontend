
package com.semasim.semasim;

import android.annotation.TargetApi;
import android.os.Build;
import android.os.Bundle;
import android.telecom.Connection;
import android.telecom.ConnectionRequest;
import android.telecom.ConnectionService;
import android.telecom.PhoneAccountHandle;

import com.semasim.semasim.tools.Log;

import org.jdeferred2.Promise;

import java.util.Map;
import java.util.WeakHashMap;
import java.util.concurrent.ThreadLocalRandom;


// @see https://github.com/kbagchiGWC/voice-quickstart-android/blob/9a2aff7fbe0d0a5ae9457b48e9ad408740dfb968/exampleConnectionService/src/main/java/com/twilio/voice/examples/connectionservice/VoiceConnectionService.java
@TargetApi(Build.VERSION_CODES.M)
public class SemasimConnectionService extends ConnectionService {


    private static final Map<SemasimConnection, Integer> phoneCallRefBySemasimConnection = new WeakHashMap<>();

    private static SemasimConnection getConnection(int phoneCallRef){

        SemasimConnection out = null;

        for (Map.Entry<SemasimConnection, Integer> entry : phoneCallRefBySemasimConnection.entrySet()) {

            if (phoneCallRef != entry.getValue()) {
                continue;
            }

            out = entry.getKey();

            break;

        }

        return out;

    }

    static void setCallActive(int phoneCallRef) {

        SemasimConnection semasimConnection= getConnection(phoneCallRef);

        if( semasimConnection == null ){
            return;
        }

        //semasimConnection.updateCapabilitiesAndSetActive();
        semasimConnection.setActive();

    }

    static void reportCallTerminated(int phoneCallRef){

        SemasimConnection semasimConnection= getConnection(phoneCallRef);

        if( semasimConnection == null ){
            return;
        }

        semasimConnection.reportRemoteDisconnect();

    }


    public SemasimConnectionService() {
        super();
    }

    @Override
    public Connection onCreateIncomingConnection(
            PhoneAccountHandle phoneAccountHandle,
            ConnectionRequest connectionRequest
    ) {


        throw new RuntimeException("TODO");


    }

    @Override
    public Connection onCreateOutgoingConnection(
            PhoneAccountHandle phoneAccountHandle,
            ConnectionRequest connectionRequest
    ) {


        int phoneCallRef;
        {

            Bundle connectionRequestExtras = connectionRequest.getExtras();

            //TODO: is null if call started from outside of the app.
            HostPhoneCallUi.SemasimOutgoingCallExtras semasimOutgoingCallExtras =
                    HostPhoneCallUi.extractSemasimOutgoingCallExtrasFromConnectionRequestExtras(
                            connectionRequestExtras
                    );


            phoneCallRef = semasimOutgoingCallExtras != null ?
                    semasimOutgoingCallExtras.getPhoneCallRef() :
                    -ThreadLocalRandom.current().nextInt(
                            1, Integer.MAX_VALUE
                    );

        }


        String phoneNumber = connectionRequest.getAddress().getSchemeSpecificPart();

        Promise<String, ?, ?> prContactName = HostPhoneCallUi.notifyUiOpenForOutgoingCallAndGetContactName(
                phoneCallRef,
                "" + phoneAccountHandle.getId(),
                phoneNumber
        );

        SemasimConnection semasimConnection = new SemasimConnection(
                phoneNumber,
                prContactName,
                new SemasimConnection.Listeners() {
                    @Override
                    public void onAnswer() {
                        HostPhoneCallUi.notifyCallAnswered(
                                phoneCallRef
                        );
                    }

                    @Override
                    public void onPlayDtmfTone(char dtmf) {
                        HostPhoneCallUi.notifyDtmf(
                                phoneCallRef,
                                Character.toString(dtmf)
                        );
                    }

                    @Override
                    public void onDisconnect() {
                        HostPhoneCallUi.notifyEndCall(
                                phoneCallRef
                        );
                    }

                    @Override
                    public void onAbort() {
                        HostPhoneCallUi.notifyEndCall(
                                phoneCallRef
                        );
                    }

                    @Override
                    public void onHold() {

                    }

                    @Override
                    public void onUnhold() {

                    }

                    @Override
                    public void onReject() {

                    }
                }
        );

        phoneCallRefBySemasimConnection.put(semasimConnection, phoneCallRef);

        return semasimConnection;


    }




}

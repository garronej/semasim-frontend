

import * as React from "react";
import * as rn from "react-native";
import { setWebDataEncryptorDecryptorAndGetCryptoRelatedParamsNeededToInstantiateUa } 
    from "frontend-shared/dist/lib/crypto/setWebDataEncryptorDecryptorAndGetCryptoRelatedParamsNeededToInstantiateUa";
import { dialogApi } from "frontend-shared/dist/tools/modal/dialog";
import * as remoteApiCaller from "frontend-shared/dist/lib/toBackend/remoteApiCaller";
import * as webApiCaller from "frontend-shared/dist/lib/webApiCaller";

import * as types from "frontend-shared/dist/lib/types/userSim";
import * as wd from "frontend-shared/dist/lib/types/webphoneData/logic";
import { UiVoiceCall } from "./lib/UiVoiceCall";
import { uaInstantiationHelper } from "frontend-shared/dist/lib/Ua";
import { phoneNumber } from "frontend-shared/node_modules/phone-number";
import RNRestart from "react-native-restart";
import * as declaredPushNotificationToken from "frontend-shared/dist/lib/localStorage/declaredPushNotificationToken";
import { env } from "frontend-shared/dist/lib/env";
import { UaSim } from "frontend-shared/dist/lib/Ua";
import * as backendConnection from "frontend-shared/dist/lib/toBackend/connection";


import { firebase } from '@react-native-firebase/messaging';

//import * as testCall from  "./lib/testCall";

const log: typeof console.log = true ? console.log.bind(console) : () => { };

log("[PhoneScreen] imported");
import { askUserForPermissions } from "./lib/askUserForPermissions";


let uaSim: UaSim;
let wdInstance: wd.Instance<"PLAIN">;
let userSim: types.UserSim.Usable;

//TODO: put in constructor
const prSetup= (async ()=>{

    log("[PhoneScreen] test call");


    //NOTE: Once we have a backend connection that mead we are authenticated.
    await backendConnection.get();


    const pushNotificationToken= await firebase.messaging().getToken();

    if ( pushNotificationToken !== await declaredPushNotificationToken.get()) {

        log("Declaring UA");

        await webApiCaller.declareUa({
            "platform": env.hostOs!,
            pushNotificationToken
        });

        await declaredPushNotificationToken.set(pushNotificationToken);

    }

    const ua= await uaInstantiationHelper({
        "cryptoRelatedParams": await setWebDataEncryptorDecryptorAndGetCryptoRelatedParamsNeededToInstantiateUa(),
        pushNotificationToken
    });

    dialogApi.loading("Fetching user sims", 0);

    const userSims = await remoteApiCaller.getUsableUserSims();

    if (userSims.length === 0) {

        dialogApi.create("alert", { "message": "No sim registered" });

        return;

    }

    dialogApi.loading("Fetching web data", 0);

    const wdInstances = await (async () => {

        const out = new Map<types.UserSim, wd.Instance<"PLAIN">>();

        await Promise.all(
            userSims.map(
                userSim => remoteApiCaller.getOrCreateWdInstance(userSim)
                    .then(wdInstance => out.set(userSim, wdInstance))
            )
        );

        return out;

    })();

    dialogApi.dismissLoading();

    userSim = userSims[0];

    wdInstance = wdInstances.get(userSim)!;

    log({ userSim });


    uaSim = ua.newUaSim( userSim);

    async function getOrCreateChatByPhoneNumber(number: phoneNumber): Promise<wd.Chat<"PLAIN">> {

        let wdChat = wdInstance.chats.find(
            ({ contactNumber }) => contactNumber === number
        );

        if (!wdChat) {

            wdChat = await remoteApiCaller.newWdChat(
                wdInstance, number, "", null
            );

        }

        return wdChat;

    }

    uaSim.evtIncomingMessage.attach(
        async ({ fromNumber, bundledData, onProcessed }) => {

            log("ua.evtIncomingMessage", JSON.stringify({ fromNumber, bundledData }, null, 2))

            const wdChat = await getOrCreateChatByPhoneNumber(fromNumber);

            const prWdMessage: Promise<Exclude<wd.Message<"PLAIN">, wd.Message.Outgoing.Pending<"PLAIN">> | undefined> = (() => {

                switch (bundledData.type) {
                    case "MESSAGE": {

                        const message: wd.NoId<wd.Message.Incoming.Text<"PLAIN">> = {
                            "direction": "INCOMING",
                            "isNotification": false,
                            "time": bundledData.pduDateTime,
                            "text": Buffer.from(bundledData.textB64, "base64").toString("utf8")
                        };

                        return remoteApiCaller.newWdMessage(wdChat, message);

                    }
                    case "SEND REPORT": {

                        return remoteApiCaller.notifySendReportReceived(wdChat, bundledData);

                    }
                    case "STATUS REPORT": {

                        if (bundledData.messageTowardGsm.uaSim.ua.instance === uaSim.uaDescriptor.instance) {

                            return remoteApiCaller.notifyStatusReportReceived(wdChat, bundledData);

                        } else {

                            const message: wd.NoId<wd.Message.Outgoing.StatusReportReceived<"PLAIN">> = {
                                "time": bundledData.messageTowardGsm.dateTime,
                                "direction": "OUTGOING",
                                "text": Buffer.from(bundledData.messageTowardGsm.textB64, "base64").toString("utf8"),
                                "sentBy": ((): wd.Message.Outgoing.StatusReportReceived<"PLAIN">["sentBy"] =>
                                    (bundledData.messageTowardGsm.uaSim.ua.userEmail === uaSim.uaDescriptor.userEmail) ?
                                        ({ "who": "USER" }) :
                                        ({ "who": "OTHER", "email": bundledData.messageTowardGsm.uaSim.ua.userEmail })
                                )(),
                                "status": "STATUS REPORT RECEIVED",
                                "deliveredTime": bundledData.statusReport.isDelivered ?
                                    bundledData.statusReport.dischargeDateTime : null
                            };

                            return remoteApiCaller.newWdMessage(wdChat, message);

                        }
                    }
                    case "MMS NOTIFICATION":
                        console.log(
                            `WPA PUSH: ${Buffer.from(bundledData.wapPushMessageB64, "base64").toString("utf8")}`
                        );
                    case "CALL ANSWERED BY":
                    case "FROM SIP CALL SUMMARY":
                    case "MISSED CALL": {

                        const message: wd.NoId<wd.Message.Incoming.Notification<"PLAIN">> = {
                            "direction": "INCOMING",
                            "isNotification": true,
                            "time": (() => {

                                switch (bundledData.type) {
                                    case "CALL ANSWERED BY":
                                    case "MISSED CALL":
                                        return bundledData.dateTime;
                                    case "MMS NOTIFICATION":
                                        return bundledData.pduDateTime;
                                    case "FROM SIP CALL SUMMARY":
                                        return bundledData.callPlacedAtDateTime;
                                }

                            })(),
                            "text": Buffer.from(bundledData.textB64, "base64").toString("utf8")
                        };

                        return remoteApiCaller.newWdMessage(wdChat, message);

                    }
                    case "CONVERSATION CHECKED OUT FROM OTHER UA": {

                        log("conversation checked out from other ua !");

                        return Promise.resolve(undefined);

                    }
                }

            })();

            const wdMessage = await prWdMessage;

            onProcessed();

            if (!wdMessage) {
                return;
            }


        }
    );

    uaSim.register();

})();


async function makeTestCall(){

    log("Making test call");

    await askUserForPermissions();

    await prSetup;

    const wdChat = wdInstance.chats.find(o => o.contactNumber === "+33636786385")!;

    log({ wdChat });

    if( !uaSim.isRegistered ){

        await uaSim.evtRegistrationStateChanged.waitFor();

    }

    log("UA registered! Proceeding with the call ");

    const uiVoiceCall = new UiVoiceCall(userSim);

    const { terminate, prTerminated, prNextState } =
        await uaSim.placeOutgoingCall(wdChat.contactNumber);

    const { onTerminated, onRingback, prUserInput } =
        uiVoiceCall.onOutgoing(wdChat);

    uaSim.evtRegistrationStateChanged.attachOnce(
        isRegistered => !isRegistered,
        () => onTerminated("UA unregistered")
    );

    uaSim.evtRegistrationStateChanged.waitFor(6000)
        .catch(() => onTerminated("UA failed to register"));


    prTerminated.then(() => onTerminated("Call terminated"));

    prUserInput.then(() => terminate());

    prNextState.then(({ prNextState }) => {

        let { onEstablished, prUserInput } = onRingback();

        prUserInput.then(() => terminate());

        prNextState.then(({ sendDtmf }) => {

            let { evtUserInput } = onEstablished();

            evtUserInput.attach(
                (eventData): eventData is UiVoiceCall.InCallUserAction.Dtmf =>
                    eventData.userAction === "DTMF",
                ({ signal, duration }) => sendDtmf(signal, duration)
            );

            evtUserInput.attachOnce(
                ({ userAction }) => userAction === "HANGUP",
                () => terminate()
            );

        });

    });

}



export class PhoneScreen extends React.Component<{}, {}> {

    public componentDidMount = () => {

        log("[PhoneScreen] componentDidMount");

    };

    public componentWillUnmount = () => {

        log("[PhoneScreen] componentWillUnmount");

    };

    constructor(props: any) {
        super(props);

        log("[PhoneScreen] constructor");


    }


    public render = () => (
        <rn.View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
            <rn.TouchableOpacity
                style={{ backgroundColor: "blue" }}
                onPress={() => {

                    makeTestCall();

                }}>
                <rn.Text>Start call</rn.Text>
            </rn.TouchableOpacity>
            <rn.TouchableOpacity
                style={{ backgroundColor: "grey", marginTop: 30 }}
                onPress={() => {

                    log("Restarting app now");

                    RNRestart.Restart();

                }}>
                <rn.Text>Restart app</rn.Text>
            </rn.TouchableOpacity>
        </rn.View>
    );





}


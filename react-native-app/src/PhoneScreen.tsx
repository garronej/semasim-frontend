

import * as React from "react";
import * as rn from "react-native";
import * as setupEncryptorDecryptors from "frontend-shared/dist/lib/crypto/setupEncryptorDecryptors";
import { dialogApi } from "frontend-shared/dist/tools/modal/dialog";
import * as remoteApiCaller from "frontend-shared/dist/lib/toBackend/remoteApiCaller";

import * as types from "frontend-shared/dist/lib/types/userSim";
import * as wd from "frontend-shared/dist/lib/types/webphoneData/logic";
import { UiVoiceCall } from "./lib/UiVoiceCall";
import { Ua } from "frontend-shared/dist/lib/Ua";
import { phoneNumber } from "frontend-shared/node_modules/phone-number";
import RNRestart from "react-native-restart";

//import * as testCall from  "./lib/testCall";

const log: typeof console.log = true ? console.log.bind(console) : () => { };

log("[PhoneScreen] imported");

//TODO: put in constructor
async function test() {

    log("[PhoneScreen] test call");

    //TODO: This should be callable multiple time (without forking over and over)
    await setupEncryptorDecryptors.globalSetup();

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

    const userSim = userSims[0];

    const wdInstance = wdInstances.get(userSim)!;

    log({ userSim });

    const uiVoiceCall = new UiVoiceCall(userSim);

    const ua = new Ua(
        userSim.sim.imsi,
        userSim.password,
        setupEncryptorDecryptors.getTowardSimEncryptor(
            userSim
        )
    );


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

    ua.evtIncomingMessage.attach(
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

                        if (bundledData.messageTowardGsm.uaSim.ua.instance === Ua.session.instanceId) {

                            return remoteApiCaller.notifyStatusReportReceived(wdChat, bundledData);

                        } else {

                            const message: wd.NoId<wd.Message.Outgoing.StatusReportReceived<"PLAIN">> = {
                                "time": bundledData.messageTowardGsm.dateTime,
                                "direction": "OUTGOING",
                                "text": Buffer.from(bundledData.messageTowardGsm.textB64, "base64").toString("utf8"),
                                "sentBy": ((): wd.Message.Outgoing.StatusReportReceived<"PLAIN">["sentBy"] =>
                                    (bundledData.messageTowardGsm.uaSim.ua.userEmail === Ua.session.email) ?
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

    ua.register();



    const wdChat = wdInstance.chats.find(o => o.contactNumber === "+33636786385")!;

    log({ wdChat });

    await ua.evtRegistrationStateChanged.waitFor();

    log("UA registered! waiting...");

    await new Promise(resolve => setTimeout(resolve, 5000));


    log("Proceeding with the call...");

    const { terminate, prTerminated, prNextState } =
        await ua.placeOutgoingCall(wdChat.contactNumber);

    const { onTerminated, onRingback, prUserInput } =
        uiVoiceCall.onOutgoing(wdChat);

    ua.evtRegistrationStateChanged.attachOnce(
        isRegistered => !isRegistered,
        () => onTerminated("UA unregistered")
    );

    ua.evtRegistrationStateChanged.waitFor(6000)
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

                    test();


                }}>
                <rn.Text>Start call</rn.Text>
            </rn.TouchableOpacity>
            <rn.TouchableOpacity
                style={{ backgroundColor: "grey", marginTop: 30 }}
                onPress={() => {

                    log("Restarting app now");

                    RNRestart.Restart()

                    log("Is this shown ?");

                }}>
                <rn.Text>Restart app</rn.Text>
            </rn.TouchableOpacity>
        </rn.View>
    );





}


/*
async function makeTestCall() {

    const { PERMISSIONS } = rn.PermissionsAndroid;

    for (const permission of [
        PERMISSIONS.RECORD_AUDIO,
        PERMISSIONS.READ_CONTACTS,
        PERMISSIONS.READ_PHONE_STATE
    ]) {

        log("================>", { permission });

        if (!permission) {

            log("=============> continue");

            continue;

        }

        let permissionStatus: rn.PermissionStatus;

        try {

            permissionStatus = await rn.PermissionsAndroid.request(
                permission,
                {
                    "title": `Semasim ${permission}`,
                    "message": `Grant ${permission} ?`,
                    "buttonPositive": 'OK'
                },
            );

        } catch (error) {

            log("Throw error");

            throw error;

        }

        if (permissionStatus !== rn.PermissionsAndroid.RESULTS.GRANTED) {
            throw new Error(`Need permission ${permission}`);
        }

        log(`${permission} granted`);

    }

    log("=============> making test call");

    const testCall = await import("./lib/testCall");

    const testCallApi = testCall.getApi({
        "onCallTerminated": errorMessage => {
            log("onCallTerminated", { errorMessage });
        },
        "onRingback": () => {
            log("onRingback");
        },
        "onEstablished": () => {
            log("onEstablished");
        }
    });


    testCallApi.start(
        testCall.START_ACTION.PLACE_OUTGOING_CALL,
        "208150121504485",
        "+33636786385"
    );

}
*/
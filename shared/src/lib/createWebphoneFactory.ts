
import { types as gwTypes } from "../gateway/types";
import * as types from "./types";
import { phoneNumber } from "phone-number/dist/lib";
import { env } from "./env";
import { id } from "../tools/typeSafety/id";
import { NonPostableEvts } from "../tools/NonPostableEvts";


type WdApi = import("./toBackend/remoteApiCaller").WdApi;

type CoreApi = Pick<
    import("./toBackend/remoteApiCaller").CoreApi,
    "updateContactName" |
    "createContact" |
    "deleteContact" |
    "shouldAppendPromotionalMessage"
>;

type UserSimEvts = Pick<
    NonPostableEvts<types.UserSim.Usable.Evts>,
    "evtFriendlyNameChange" |
    "evtReachabilityStatusChange" |
    "evtCellularConnectivityChange" |
    "evtCellularSignalStrengthChange" |
    "evtOngoingCall" |
    "evtNewUpdatedOrDeletedContact"
>;

export function createWebphoneFactory(
    params: {
        createSipUserAgent: ReturnType<typeof import("./createSipUserAgentFactory").createSipUserAgentFactory>;
        getWdApi: ReturnType<ReturnType<typeof import("./toBackend/remoteApiCaller").factory>["getWdApiFactory"]>;
        phoneCallUiCreate: types.PhoneCallUi.Create;
        userSimEvts: UserSimEvts;
        coreApi: CoreApi;
    }
) {

    const { createSipUserAgent, getWdApi, phoneCallUiCreate, userSimEvts, coreApi } = params;

    return async function createWebphone(userSim: types.UserSim.Usable): Promise<types.Webphone> {


        const wdApi = getWdApi({ "imsi": userSim.sim.imsi });

        const { wdChats, wdEvts } = await wdApi.getUserSimChats({ "maxMessageCountByChat": 20 });

        await synchronizeUserSimAndWdInstance(
            userSim,
            wdChats,
            wdApi
        );

        //NOTE: Will register immediately if sim registrable so event handler
        //have to be attached on this tick.
        const sipUserAgent = createSipUserAgent(userSim);

        //NOTE: phoneCallUi listeners must be set in current tick so it must be placed after the async statements.
        const phoneCallUi = phoneCallUiCreate(
            ((): types.PhoneCallUi.Create.Params => {

                const _common = (() => {

                    const buildPhoneNumber = (phoneNumberRaw: string) => phoneNumber.build(
                        phoneNumberRaw,
                        userSim.sim.country?.iso
                    );

                    return id<types.PhoneCallUi.Create.Params._Common>({
                        "imsi": userSim.sim.imsi,
                        "getContactName": phoneNumberRaw => userSim.phonebook.find(
                            (() => {

                                const validPhoneNumber = buildPhoneNumber(phoneNumberRaw);

                                return ({ number_raw }) => phoneNumber.areSame(
                                    validPhoneNumber,
                                    number_raw
                                );

                            })()
                        )?.name,
                        "getPhoneNumberPrettyPrint": phoneNumberRaw =>
                            phoneNumber.prettyPrint(
                                buildPhoneNumber(phoneNumberRaw),
                                userSim.sim.country?.iso
                            )
                    });


                })();


                switch (env.jsRuntimeEnv) {
                    case "browser": {
                        return id<types.PhoneCallUi.Create.Params.Browser>({
                            "assertJsRuntimeEnv": "browser",
                            ..._common
                        });
                    }
                    case "react-native": {
                        return id<types.PhoneCallUi.Create.Params.ReactNative>({
                            "assertJsRuntimeEnv": "react-native",
                            "obsIsSipRegistered": sipUserAgent.obsIsRegistered,
                            ..._common
                        });
                    }
                }
            })()
        );

        const webphone: types.Webphone = {
            userSim,
            "userSimEvts": types.UserSim.Usable.Evts.ForSpecificSim.build(
                userSimEvts,
                userSim,
                [
                    "evtFriendlyNameChange",
                    "evtReachabilityStatusChange",
                    "evtCellularConnectivityChange",
                    "evtCellularSignalStrengthChange",
                    "evtOngoingCall",
                    "evtNewUpdatedOrDeletedContact"
                ]
            ),
            wdChats,
            wdEvts,
            "obsIsSipRegistered": sipUserAgent.obsIsRegistered,
            "sendMessage": async ({ wdChat, text }) => {

                const bundledData: gwTypes.BundledData.ClientToServer.Message = {
                    "type": "MESSAGE",
                    "text": text,
                    "exactSendDateTime": Date.now(),
                    "appendPromotionalMessage": await coreApi.shouldAppendPromotionalMessage()
                };

                const { onUaFailedToSendMessage } = await wdApi.newMessage({
                    wdChat,
                    "type": "CLIENT TO SERVER",
                    bundledData
                });

                try {

                    await sipUserAgent.sendMessage(
                        wdChat.contactNumber,
                        bundledData
                    );

                } catch (error) {

                    console.log("ua send message error", error);

                    await onUaFailedToSendMessage();

                }

            },
            "placeOutgoingCall": wdChat => phoneCallUi.openUiForOutgoingCall(wdChat.contactNumber),
            "fetchOlderWdMessages": wdApi.fetchOlderMessages,
            "updateWdChatLastMessageSeen": wdApi.updateChatLastMessageSeen,
            "getOrCreateWdChat": async ({ number_raw }) => {

                {

                    const wdChat = wdChats.find(
                        ({ contactNumber }) => phoneNumber.areSame(contactNumber, number_raw)
                    );

                    if (wdChat !== undefined) {
                        return wdChat;
                    }

                }

                const contactNumber = phoneNumber.build(
                    number_raw,
                    userSim.sim.country ? userSim.sim.country.iso : undefined
                );

                const contact = userSim.phonebook.find(({ number_raw }) =>
                    phoneNumber.areSame(contactNumber, number_raw)
                );

                wdApi.newChat({
                    wdChats,
                    contactNumber,
                    "contactName": contact?.name ?? "",
                    "contactIndexInSim": contact?.mem_index ?? null
                });

                const { wdChat } = await wdEvts.evtWdChat.waitFor(
                    ({ wdChat, eventType }) => (
                        eventType === "NEW" &&
                        wdChat.contactNumber === contactNumber
                    )
                );

                return wdChat;

            },
            "updateWdChatContactName": async ({ wdChat, contactName }) => {

                if (wdChat.contactName === contactName) {
                    return;
                }

                const contact = userSim.phonebook.find(({ mem_index, number_raw }) =>
                    wdChat.contactIndexInSim !== null ?
                        mem_index === wdChat.contactIndexInSim
                        :
                        phoneNumber.areSame(wdChat.contactNumber, number_raw)
                );

                if (contact !== undefined) {
                    coreApi.updateContactName({ userSim, contact, "newName": contactName });
                } else {
                    coreApi.createContact({
                        userSim,
                        "name": contactName,
                        "number_raw": wdChat.contactNumber
                    });
                }

                await wdEvts.evtWdChat.waitFor(
                    data => (
                        data.eventType === "UPDATED" &&
                        data.changes.contactInfos &&
                        data.wdChat === wdChat
                    )
                );

            },
            "deleteWdChat": async wdChat => {

                await wdApi.destroyWdChat({
                    wdChats,
                    "refOfTheChatToDelete": wdChat.ref
                });

                const contact = userSim.phonebook.find(({ number_raw }) =>
                    phoneNumber.areSame(wdChat.contactNumber, number_raw)
                );

                if (contact === undefined) {
                    return;
                }

                await webphone.getOrCreateWdChat({ "number_raw": contact.number_raw });

            }
        };


        sipUserAgent.evtIncomingMessage.attach(
            async ({ fromNumber, bundledData, handlerCb }) => {

                const wdChat = await webphone.getOrCreateWdChat({ "number_raw": fromNumber });

                await (() => {
                    switch (bundledData.type) {
                        case "MESSAGE":
                        case "CALL ANSWERED BY":
                        case "FROM SIP CALL SUMMARY":
                        case "MISSED CALL":
                        case "MMS NOTIFICATION":
                            return wdApi.newMessage({
                                wdChat,
                                "type": "SERVER TO CLIENT",
                                bundledData
                            });
                        case "SEND REPORT":
                            return wdApi.notifySendReportReceived({
                                wdChat,
                                bundledData
                            });
                        case "STATUS REPORT":
                            return wdApi.notifyStatusReportReceived({
                                wdChat,
                                bundledData
                            });
                    }
                })();

                handlerCb();

            }
        );

        sipUserAgent.evtIncomingCall.attach(async evtData => {

            const {
                fromNumber,
                terminate: logic_terminate,
                prTerminated: logic_prTerminated,
                onAccepted: logic_onAccepted
            } = evtData;

            const {
                onTerminated: ui_onTerminated,
                prUserInput: ui_prUserInput
            } = phoneCallUi.openUiForIncomingCall(fromNumber);

            logic_prTerminated.then(() => ui_onTerminated("Call ended"));

            ui_prUserInput.then(ui_userInput => {

                if (ui_userInput.userAction === "REJECT") {
                    logic_terminate();
                    return;
                }

                const { onEstablished: ui_onEstablished } = ui_userInput;

                logic_onAccepted().then(({ sendDtmf: logic_sendDtmf }) => {

                    const { evtUserInput: ui_evtUserInput } = ui_onEstablished();

                    ui_evtUserInput.attach(
                        (eventData): eventData is types.PhoneCallUi.InCallUserAction.Dtmf =>
                            eventData.userAction === "DTMF",
                        ({ signal, duration }) => logic_sendDtmf(signal, duration)
                    );

                    ui_evtUserInput.attachOnce(
                        ({ userAction }) => userAction === "HANGUP",
                        () => logic_terminate()
                    );

                });


            });

        });

        phoneCallUi.evtUiOpenedForOutgoingCall.attach(async eventData => {

            const {
                phoneNumberRaw,
                onTerminated: ui_onTerminated,
                prUserInput: ui_prUserInput,
                onRingback: ui_onRingback
            } = eventData;

            const {
                prNextState: logic_prNextState,
                prTerminated: logic_prTerminated,
                terminate: logic_terminate
            } = await sipUserAgent.placeOutgoingCall(
                phoneNumber.build(
                    phoneNumberRaw,
                    userSim.sim.country?.iso
                )
            );


            logic_prTerminated.then(() => ui_onTerminated("Call terminated"));

            ui_prUserInput.then(() => logic_terminate());

            logic_prNextState.then(({ prNextState: logic_prNextState }) => {

                const {
                    onEstablished: ui_onEstablished,
                    prUserInput: ui_prUserInput
                } = ui_onRingback();

                ui_prUserInput.then(() => logic_terminate());

                logic_prNextState.then(({ sendDtmf: logic_sendDtmf }) => {

                    const { evtUserInput: ui_evtUserInput } = ui_onEstablished();

                    ui_evtUserInput.attach(
                        (eventData): eventData is types.PhoneCallUi.InCallUserAction.Dtmf =>
                            eventData.userAction === "DTMF",
                        ({ signal, duration }) => logic_sendDtmf(signal, duration)
                    );

                    ui_evtUserInput.attachOnce(
                        ({ userAction }) => userAction === "HANGUP",
                        () => logic_terminate()
                    );

                });

            });

        });

        webphone.userSimEvts.evtNewUpdatedOrDeletedContact.attach(
            async ({ eventType, contact }) => {

                const wdChat = await webphone.getOrCreateWdChat({ "number_raw": contact.number_raw });

                if (eventType === "NEW") {
                    return;
                }

                wdApi.updateChatContactInfos({
                    wdChat,
                    ...((() => {
                        switch (eventType) {
                            case "UPDATED":
                                return {
                                    "contactName": contact.name,
                                    "contactIndexInSim": contact.mem_index ?? null
                                };
                            case "DELETED":
                                return {
                                    "contactName": "",
                                    "contactIndexInSim": null
                                };
                        }
                    })())
                });

            }
        );

        return webphone;

    }

}

function synchronizeUserSimAndWdInstance(
    userSim: types.UserSim.Usable,
    wdChats: types.wd.Chat[],
    wdApi: Pick<WdApi, "updateChatContactInfos" | "newChat">
): Promise<void> {

    const tasks: Promise<void>[] = [];

    const wdChatWhoseContactNoLongerInPhonebook = new Set(wdChats);

    for (const contact of userSim.phonebook) {

        const wdChat = wdChats.find(
            ({ contactNumber }) => phoneNumber.areSame(
                contactNumber, contact.number_raw
            )
        );

        if (!!wdChat) {

            wdChatWhoseContactNoLongerInPhonebook.delete(wdChat);

            tasks[tasks.length] = wdApi.updateChatContactInfos({
                wdChat,
                "contactName": contact.name,
                "contactIndexInSim": contact.mem_index ?? null
            });

        } else {

            tasks[tasks.length] = wdApi.newChat({
                wdChats,
                "contactNumber": phoneNumber.build(
                    contact.number_raw,
                    userSim.sim.country?.iso
                ),
                "contactName": contact.name,
                "contactIndexInSim": contact.mem_index ?? null
            });

        }

    }

    for (const wdChat of wdChatWhoseContactNoLongerInPhonebook) {

        tasks[tasks.length] = wdApi.updateChatContactInfos({
            wdChat,
            "contactName": "",
            "contactIndexInSim": null
        });

    }

    return Promise.all(tasks).then(() => { });

}










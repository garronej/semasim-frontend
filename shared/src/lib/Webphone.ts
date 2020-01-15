
import { types as gwTypes } from "../gateway/types";
import { SyncEvent, Observable, ObservableImpl } from "ts-events-extended";

import * as types from "./types/userSimAndPhoneCallUi";
import * as wd from "./types/webphoneData/logic";
import { phoneNumber } from "phone-number/dist/lib";
import { env } from "./env";
import { id } from "../tools/id";

type SipUserAgentCreate = ReturnType<(typeof import("./sipUserAgent"))["sipUserAgentCreateFactory"]>;
type WdEvts= import("./toBackend/remoteApiCaller/webphoneData").WdEvts;
export type GetWdApiCallerForSpecificSim = ReturnType<(typeof import("./toBackend/remoteApiCaller"))["getWdApiCallerForSpecificSimFactory"]>;
export type WdApiCallerForSpecificSim = ReturnType<GetWdApiCallerForSpecificSim>;
export type AppEvts = import("./toBackend/appEvts").SubsetOfAppEvts<
    "evtContactCreatedOrUpdated" |
    "evtContactDeleted" |
    "evtSimReachabilityStatusChange" |
    "evtSimGsmConnectivityChange" |
    "evtSimCellSignalStrengthChange" |
    "evtOngoingCall"
>;

export type CoreApiCaller = CoreApiCaller.HelperType<
    "shouldAppendPromotionalMessage" |
    "updateContactName" |
    "deleteContact" |
    "createContact"
>;

export namespace CoreApiCaller {

    type TypeofImport = (typeof import("./toBackend/remoteApiCaller"))["core"];

    export type HelperType<K extends keyof TypeofImport> = { [key in K]: TypeofImport[key]; };

}

export type Webphone = {
    userSim: types.UserSim.Usable;
    evtUserSimUpdated: SyncEvent<
        "reachabilityStatusChange" |
        "gsmConnectivityChange" |
        "cellSignalStrengthChange" |
        "ongoingCall"
    >;
    wdChats: wd.Chat<"PLAIN">[];
    wdEvts: WdEvts;
    obsIsSipRegistered: Observable<boolean>;
    sendMessage: (wdChat: wd.Chat<"PLAIN">, text: phoneNumber) => void;
    placeOutgoingCall: (wdChat: wd.Chat<"PLAIN">) => void;
    fetchOlderWdMessages: WdApiCallerForSpecificSim["fetchOlderMessages"];
    updateWdChatLastMessageSeen: (wdChat: wd.Chat<"PLAIN">)=>void;
    /** NOTE: the number does not need to be a valid phoneNumber */
    getAndOrCreateAndOrUpdateWdChat: (number: string, contactName?: string, contactIndexInSim?: number | null) => Promise<wd.Chat<"PLAIN">>;
    /** NOTE: Return promise instead of void just for discarding loading dialog ( also true for deleteWdChatAndCorrespondingContactInSim ) */
    updateNameOfWdChatAndCreateOrUpdateCorespondingContactInSim: (wdChat: wd.Chat<"PLAIN">, name: string) => Promise<void>;
    deleteWdChatAndCorrespondingContactInSim(wdChat: wd.Chat<"PLAIN">): Promise<void>;
};

export namespace Webphone {

    export async function createFactory(
        params: {
            sipUserAgentCreate: SipUserAgentCreate;
            appEvts: AppEvts;
            getWdApiCallerForSpecificSim: GetWdApiCallerForSpecificSim;
            coreApiCaller: CoreApiCaller;
            phoneCallUiCreate: types.PhoneCallUi.Create;
        }
    ) {

        const {
            sipUserAgentCreate,
            appEvts,
            getWdApiCallerForSpecificSim,
            coreApiCaller,
            phoneCallUiCreate
        } = params;

        return async function create(userSim: types.UserSim.Usable): Promise<Webphone> {

            const obsIsSipRegistered = new ObservableImpl(false);

            const sipUserAgent = sipUserAgentCreate(userSim);

            const wdApiCallerForSpecificSim = getWdApiCallerForSpecificSim(userSim.sim.imsi);

            const { wdChats, wdEvts } = await wdApiCallerForSpecificSim.getUserSimChats(20);


            await synchronizeUserSimAndWdInstance(
                userSim,
                wdChats,
                wdApiCallerForSpecificSim
            );

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
                                obsIsSipRegistered,
                                ..._common
                            });
                        }
                    }
                })()
            );

            const webphone: Webphone = {
                userSim,
                "evtUserSimUpdated": new SyncEvent(),
                wdChats,
                wdEvts,
                obsIsSipRegistered,
                "sendMessage": async (wdChat, text) => {

                    const bundledData: gwTypes.BundledData.ClientToServer.Message = {
                        "type": "MESSAGE",
                        "text": text,
                        "exactSendDateTime": Date.now(),
                        "appendPromotionalMessage": await coreApiCaller.shouldAppendPromotionalMessage()
                    };

                    const { onUaFailedToSendMessage } = await wdApiCallerForSpecificSim.newMessage(
                        wdChat,
                        {
                            "type": "CLIENT TO SERVER",
                            bundledData
                        }
                    );

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
                "fetchOlderWdMessages": wdApiCallerForSpecificSim.fetchOlderMessages,
                "updateWdChatLastMessageSeen": wdApiCallerForSpecificSim.updateChatLastMessageSeen,
                "getAndOrCreateAndOrUpdateWdChat": async (number, contactName, contactIndexInSim) => {

                    let wdChat = wdChats.find(
                        ({ contactNumber }) => phoneNumber.areSame(contactNumber, number)
                    );

                    if (!wdChat) {

                        const contactNumber = phoneNumber.build(
                            number,
                            userSim.sim.country ? userSim.sim.country.iso : undefined
                        );

                        wdApiCallerForSpecificSim.newChat(
                            wdChats,
                            contactNumber,
                            contactName === undefined ? "" : contactName,
                            contactIndexInSim === undefined ? null : contactIndexInSim
                        );

                        wdChat = (await wdEvts.evtNewUpdatedOrDeletedWdChat.waitFor(
                            ({ wdChat, eventType }) => (
                                eventType === "NEW" &&
                                wdChat.contactNumber === contactNumber
                            )
                        )).wdChat;

                    } else {

                        await wdApiCallerForSpecificSim.updateChatContactInfos(
                            wdChat,
                            contactName !== undefined ? contactName : wdChat.contactName,
                            contactIndexInSim !== undefined ? contactIndexInSim : wdChat.contactIndexInSim
                        );

                    }

                    return wdChat;

                },
                "updateNameOfWdChatAndCreateOrUpdateCorespondingContactInSim": async (wdChat, name) => {

                    let contact = findCorrespondingContactInUserSim(userSim, wdChat);

                    if (!!contact) {

                        await coreApiCaller.updateContactName(
                            userSim, contact, name
                        );

                    } else {

                        contact = await coreApiCaller.createContact(
                            userSim, name, wdChat.contactNumber
                        );

                    }

                    await webphone.getAndOrCreateAndOrUpdateWdChat(
                        wdChat.contactNumber,
                        name,
                        contact.mem_index !== undefined ? contact.mem_index : null
                    );

                },
                "deleteWdChatAndCorrespondingContactInSim": async wdChat => {

                    const contact = findCorrespondingContactInUserSim(userSim, wdChat);

                    if (!!contact) {

                        await coreApiCaller.deleteContact(
                            userSim, contact
                        );

                    }

                    await wdApiCallerForSpecificSim.destroyWdChat(wdChats, wdChat.ref);

                }
            };




            sipUserAgent.evtIncomingMessage.attach(
                async ({ fromNumber, bundledData, handlerCb }) => {

                    const wdChat = await webphone.getAndOrCreateAndOrUpdateWdChat(fromNumber);

                    await (() => {
                        switch (bundledData.type) {
                            case "MESSAGE":
                            case "CALL ANSWERED BY":
                            case "FROM SIP CALL SUMMARY":
                            case "MISSED CALL":
                            case "MMS NOTIFICATION":
                                return wdApiCallerForSpecificSim.newMessage(
                                    wdChat,
                                    { "type": "SERVER TO CLIENT", bundledData }
                                );
                            case "SEND REPORT":
                                return wdApiCallerForSpecificSim.notifySendReportReceived(
                                    wdChat,
                                    bundledData
                                );
                            case "STATUS REPORT":
                                return wdApiCallerForSpecificSim.notifyStatusReportReceived(
                                    wdChat,
                                    bundledData
                                );
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

            phoneCallUi.evtUiOpenedForOutgoingCall.attach(async evtData => {

                const {
                    phoneNumberRaw,
                    onTerminated: ui_onTerminated,
                    prUserInput: ui_prUserInput,
                    onRingback: ui_onRingback
                } = evtData;

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

            sipUserAgent.evtRegistrationStateChange.attach(
                () => obsIsSipRegistered.onPotentialChange(sipUserAgent.isRegistered)
            );

            appEvts.evtContactCreatedOrUpdated.attach(
                ({ userSim }) => userSim === webphone.userSim,
                ({ contact }) => webphone.getAndOrCreateAndOrUpdateWdChat(
                    contact.number_raw,
                    contact.name,
                    contact.mem_index !== undefined ? contact.mem_index : null
                )
            );

            appEvts.evtContactDeleted.attach(
                ({ userSim }) => userSim === webphone.userSim,
                ({ contact }) => webphone.getAndOrCreateAndOrUpdateWdChat(
                    contact.number_raw,
                    "",
                    null
                )
            );

            appEvts.evtSimReachabilityStatusChange.attach(
                userSim => userSim === webphone.userSim,
                () => {

                    if (!!userSim.reachableSimState) {

                        sipUserAgent.register();

                    }

                    webphone.evtUserSimUpdated.post("reachabilityStatusChange");

                }
            );

            appEvts.evtSimGsmConnectivityChange.attach(
                userSim => userSim === webphone.userSim,
                () => webphone.evtUserSimUpdated.post("gsmConnectivityChange")
            );

            appEvts.evtSimCellSignalStrengthChange.attach(
                userSim => userSim === webphone.userSim,
                () => webphone.evtUserSimUpdated.post("cellSignalStrengthChange")
            );

            appEvts.evtOngoingCall.attach(
                userSim => userSim === webphone.userSim,
                () => webphone.evtUserSimUpdated.post("ongoingCall")
            );

            if (!!userSim.reachableSimState) {

                sipUserAgent.register();

            }

            return webphone;

        }

    }


    export function sortPutingFirstTheOnesWithMoreRecentActivity(webphone1: Webphone, webphone2: Webphone): -1 | 0 | 1 {

        if (!!webphone1.userSim.reachableSimState !== !!webphone2.userSim.reachableSimState) {
            return !!webphone1.userSim.reachableSimState ? -1 : 1;
        }

        const [wdChat1, wdChat2] = [webphone1, webphone2].map(({ wdChats }) =>
            wd.getChatWithLatestActivity(wdChats)
        );

        if (!wdChat1 !== !wdChat2) {
            return !!wdChat1 ? -1 : 1;
        }

        if (!wdChat1) {
            return 0;
        }

        switch (wd.compareChat(wdChat1, wdChat2!)) {
            case -1: return 1;
            case 0: return 0;
            case 1: return -1;
        }

    };


}


function findCorrespondingContactInUserSim(
    userSim: types.UserSim.Usable,
    wdChat: wd.Chat<"PLAIN">
): types.UserSim.Contact | undefined {

    return userSim.phonebook.find(({ mem_index, number_raw }) => {

        if (wdChat.contactIndexInSim !== null) {
            return mem_index === wdChat.contactIndexInSim;
        }

        return phoneNumber.areSame(wdChat.contactNumber, number_raw);

    });

}



async function synchronizeUserSimAndWdInstance(
    userSim: types.UserSim.Usable,
    wdChats: wd.Chat<"PLAIN">[],
    wdApiCallerForSpecificSim: {
        updateChatContactInfos: WdApiCallerForSpecificSim["updateChatContactInfos"],
        newChat: WdApiCallerForSpecificSim["newChat"]
    }
): Promise<void> {

    const wdChatWhoseContactNoLongerInPhonebook = new Set(wdChats);

    for (const contact of userSim.phonebook) {

        const wdChat = wdChats.find(
            ({ contactNumber }) => phoneNumber.areSame(
                contactNumber, contact.number_raw
            )
        );

        if (!!wdChat) {

            wdChatWhoseContactNoLongerInPhonebook.delete(wdChat);

            await wdApiCallerForSpecificSim.updateChatContactInfos(
                wdChat,
                contact.name,
                contact.mem_index !== undefined ? contact.mem_index : null
            );

        } else {

            await wdApiCallerForSpecificSim.newChat(
                wdChats,
                phoneNumber.build(
                    contact.number_raw,
                    userSim.sim.country ? userSim.sim.country.iso : undefined
                ),
                contact.name,
                contact.mem_index !== undefined ? contact.mem_index : null
            );

        }

    }

    for (const wdChat of wdChatWhoseContactNoLongerInPhonebook) {

        await wdApiCallerForSpecificSim.updateChatContactInfos(
            wdChat,
            "",
            null
        );

    }

}








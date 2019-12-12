
import { types as gwTypes } from "../gateway/types";
import { SyncEvent, VoidSyncEvent } from "ts-events-extended";
import * as types from "./types/userSim";
import * as wd from "./types/webphoneData/logic";
import { phoneNumber } from "phone-number/dist/lib";

type Ua = import("./Ua").Ua;
type UaSimPrototype = (typeof import("./Ua")["UaSim"])["prototype"];
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

    evtIsSipRegisteredValueChanged: VoidSyncEvent;
    getIsSipRegistered: () => boolean;

    evtIncomingCall: SyncEvent<Omit<SyncEvent.Type<UaSimPrototype["evtIncomingCall"]>, "fromNumber"> & { wdChat: wd.Chat<"PLAIN">; }>;

    sendMessage: (wdChat: wd.Chat<"PLAIN">, text: phoneNumber) => void;
    placeOutgoingCall: UaSimPrototype["placeOutgoingCall"];
    fetchOlderWdMessages: WdApiCallerForSpecificSim["fetchOlderMessages"];
    updateWdChatLastMessageSeen: (wdChat: wd.Chat<"PLAIN">)=>void;
    /** NOTE: the number does not need to be a valid phoneNumber */
    getAndOrCreateAndOrUpdateWdChat: (number: string, contactName?: string, contactIndexInSim?: number | null) => Promise<wd.Chat<"PLAIN">>;
    /** NOTE: Return promise instead of void just for discarding loading dialog ( also true for deleteWdChatAndCorrespondingContactInSim ) */
    updateNameOfWdChatAndCreateOrUpdateCorespondingContactInSim: (wdChat: wd.Chat<"PLAIN">, name: string) => Promise<void>;
    deleteWdChatAndCorrespondingContactInSim(wdChat: wd.Chat<"PLAIN">): Promise<void>;
};

export namespace Webphone {


    export function createFactory(
        ua: Ua,
        appEvts: AppEvts,
        getWdApiCallerForSpecificSim: GetWdApiCallerForSpecificSim,
        coreApiCaller: CoreApiCaller
    ) {

        return async function create(userSim: types.UserSim.Usable): Promise<Webphone> {

            const uaSim = ua.newUaSim(userSim);

            const wdApiCallerForSpecificSim= getWdApiCallerForSpecificSim(userSim.sim.imsi);

            const { wdChats, wdEvts } = await wdApiCallerForSpecificSim.getUserSimChats(20);

            await synchronizeUserSimAndWdInstance(
                userSim, 
                wdChats, 
                wdApiCallerForSpecificSim
            );


            const webphone: Webphone = {
                userSim,
                "evtUserSimUpdated": new SyncEvent(),
                wdChats,
                wdEvts,
                "evtIsSipRegisteredValueChanged": new VoidSyncEvent(),
                "getIsSipRegistered": () => uaSim.isRegistered,
                "evtIncomingCall": new SyncEvent(),
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

                        await uaSim.sendMessage(
                            wdChat.contactNumber,
                            bundledData
                        );

                    } catch (error) {

                        console.log("ua send message error", error);

                        await onUaFailedToSendMessage();

                    }

                },
                "placeOutgoingCall": number => uaSim.placeOutgoingCall(number),
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

                        wdChat= (await wdEvts.evtNewUpdatedOrDeletedWdChat.waitFor(
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



            uaSim.evtIncomingMessage.attach(
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

            uaSim.evtIncomingCall.attach(
                async ({ fromNumber, terminate, prTerminated, onAccepted }) => {

                    const wdChat = await webphone.getAndOrCreateAndOrUpdateWdChat(fromNumber);

                    webphone.evtIncomingCall.post(
                        { wdChat, terminate, prTerminated, onAccepted }
                    );

                }
            );


            uaSim.evtRegistrationStateChanged.attach(
                () => webphone.evtIsSipRegisteredValueChanged.post()
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

                        uaSim.register();

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

                uaSim.register();

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



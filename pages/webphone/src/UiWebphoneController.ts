import { UiQuickAction } from "./UiQuickAction";
import { UiHeader } from "./UiHeader";
import { UiPhonebook } from "./UiPhonebook";
import { UiConversation } from "./UiConversation";
import { UiVoiceCall } from "./UiVoiceCall";
import { Ua, UaSim } from "frontend-shared/dist/lib/Ua";
import * as types from "frontend-shared/dist/lib/types/userSim";
import * as wd from "frontend-shared/dist/lib/types/webphoneData/types";
import { types as gwTypes } from "frontend-shared/dist/gateway/types";
import { loadUiClassHtml } from "frontend-shared/dist/lib/loadUiClassHtml";
//import * as remoteApiCaller from "frontend-shared/dist/lib/toBackend/remoteApiCaller";

import { phoneNumber } from "../../../local_modules/phone-number/dist/lib";
import { dialogApi } from "frontend-shared/dist/tools/modal/dialog";
import { SyncEvent, VoidSyncEvent } from "frontend-shared/node_modules/ts-events-extended";

declare const require: any;
declare const Buffer: any;

const html = loadUiClassHtml(
    require("../templates/UiWebphoneController.html"),
    "UiWebphoneController"
);

export class UiWebphoneController {

    public readonly structure = html.structure.clone();

    private readonly uiVoiceCall: UiVoiceCall;
    private readonly uiHeader: UiHeader;
    private readonly uiQuickAction: UiQuickAction;
    private readonly uiPhonebook: UiPhonebook;

    private readonly uaSim: UaSim;

    public constructor(
        ua: Ua,
        public readonly userSim: types.UserSim.Usable,
        public readonly wdInstance: wd.Instance<"PLAIN">,
        private events: UiWebphoneController.BackendEvents,
        private remoteApiCaller: UiWebphoneController.RemoteApiCaller
    ) {


        this.uaSim = ua.newUaSim(userSim);

        this.uiVoiceCall = new UiVoiceCall(userSim);

        this.uiHeader = new UiHeader(userSim, () => this.uaSim.isRegistered);

        this.uiQuickAction = new UiQuickAction(userSim, () => this.uaSim.isRegistered);

        this.uiPhonebook = new UiPhonebook(userSim, wdInstance);

        this.attachEventHandlers();

        this.initUa();

        this.initUiHeader();

        this.initUiQuickAction();

        this.initUiPhonebook();

        $("body").data("dynamic").panels();

        setTimeout(() => this.uiPhonebook.triggerClickOnLastSeenChat(), 0);

    }

    private attachEventHandlers() {


        this.events.evtContactCreatedOrUpdated.attach(
            async ({ contact }) => {

                let wdChat = this.wdInstance.chats.find(
                    ({ contactNumber }) => phoneNumber.areSame(contactNumber, contact.number_raw)
                );

                if (!wdChat) {

                    wdChat = await this.remoteApiCaller.newWdChat(
                        this.wdInstance,
                        phoneNumber.build(
                            contact.number_raw,
                            this.userSim.sim.country ? this.userSim.sim.country.iso : undefined
                        ),
                        contact.name,
                        contact.mem_index !== undefined ? contact.mem_index : null
                    );

                    this.getOrCreateUiConversation(wdChat);

                } else {

                    const isUpdated = await this.remoteApiCaller.updateWdChatContactInfos(
                        wdChat, contact.name,
                        contact.mem_index !== undefined ? contact.mem_index : null
                    );

                    if (!isUpdated) {
                        return;
                    }


                    this.uiPhonebook.notifyContactChanged(wdChat);

                    this.getOrCreateUiConversation(wdChat)
                        .notify()
                        ;

                }

            }
        );

        this.events.evtContactDeleted.attach(
            async ({ contact }) => {

                const wdChat = this.wdInstance.chats.find(
                    ({ contactNumber }) => phoneNumber.areSame(contactNumber, contact.number_raw)
                )!;

                const isUpdated = await this.remoteApiCaller.updateWdChatContactInfos(
                    wdChat,
                    "",
                    null
                );

                if (!isUpdated) {
                    return;
                }


                this.uiPhonebook.notifyContactChanged(wdChat);

                this.getOrCreateUiConversation(wdChat)
                    .notify()
                    ;

            }
        );

        this.events.evtSimReachabilityStatusChange.attach(
            async () => {

                if (!!this.userSim.reachableSimState) {

                    this.uaSim.register();

                }

                this.uiHeader.notify();

                this.uiQuickAction.notify();

                for (const uiConversation of this._uiConversations.values()) {

                    uiConversation.notify()

                }

            }
        );

        this.events.evtSimGsmConnectivityChange.attach(
            () => {

                this.uiHeader.notify();

                this.uiQuickAction.notify();

                for (const uiConversation of this._uiConversations.values()) {

                    uiConversation.notify()

                }

            }
        );

        this.events.evtSimCellSignalStrengthChange.attach(
            () => this.uiHeader.notify()
        );

        this.events.evtOngoingCall.attach(
            () => {

                this.uiHeader.notify();

                this.uiQuickAction.notify();

                for (const uiConversation of this._uiConversations.values()) {

                    uiConversation.notify()

                }

            }
        );

    }

    private initUa() {

        this.uaSim.evtRegistrationStateChanged.attach(() => {

            this.uiHeader.notify();

            this.uiQuickAction.notify();

            for (const uiConversation of this._uiConversations.values()) {


                uiConversation.notify();

            }

        });

        this.uaSim.evtIncomingMessage.attach(
            async ({ fromNumber, bundledData, onProcessed }) => {

                console.log(JSON.stringify({ fromNumber, bundledData }, null, 2))

                const wdChat = await this.getOrCreateChatByPhoneNumber(fromNumber);

                const prWdMessage: Promise<Exclude<wd.Message<"PLAIN">, wd.Message.Outgoing.Pending<"PLAIN">> | undefined> = (() => {

                    switch (bundledData.type) {
                        case "MESSAGE": {

                            const message: wd.NoId<wd.Message.Incoming.Text<"PLAIN">> = {
                                "direction": "INCOMING",
                                "isNotification": false,
                                "time": bundledData.pduDateTime,
                                "text": Buffer.from(bundledData.textB64, "base64").toString("utf8")
                            };

                            return this.remoteApiCaller.newWdMessage(wdChat, message);

                        }
                        case "SEND REPORT": {

                            return this.remoteApiCaller.notifySendReportReceived(wdChat, bundledData);

                        }
                        case "STATUS REPORT": {

                            if (bundledData.messageTowardGsm.uaSim.ua.instance === this.uaSim.uaDescriptor.instance) {

                                return this.remoteApiCaller.notifyStatusReportReceived(wdChat, bundledData);

                            } else {

                                const message: wd.NoId<wd.Message.Outgoing.StatusReportReceived<"PLAIN">> = {
                                    "time": bundledData.messageTowardGsm.dateTime,
                                    "direction": "OUTGOING",
                                    "text": Buffer.from(bundledData.messageTowardGsm.textB64, "base64").toString("utf8"),
                                    "sentBy": ((): wd.Message.Outgoing.StatusReportReceived<"PLAIN">["sentBy"] =>
                                        (bundledData.messageTowardGsm.uaSim.ua.userEmail === this.uaSim.uaDescriptor.userEmail) ?
                                            ({ "who": "USER" }) :
                                            ({ "who": "OTHER", "email": bundledData.messageTowardGsm.uaSim.ua.userEmail })
                                    )(),
                                    "status": "STATUS REPORT RECEIVED",
                                    "deliveredTime": bundledData.statusReport.isDelivered ?
                                        bundledData.statusReport.dischargeDateTime : null
                                };

                                return this.remoteApiCaller.newWdMessage(wdChat, message);

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

                            return this.remoteApiCaller.newWdMessage(wdChat, message);

                        }
                        case "CONVERSATION CHECKED OUT FROM OTHER UA": {

                            console.log("conversation checked out from other ua !");

                            const uiConversation = this._uiConversations.get(wdChat);

                            let pr: Promise<undefined>;

                            if (uiConversation !== undefined) {

                                let resolvePr!: () => void;

                                pr = new Promise<undefined>(resolve => resolvePr = () => resolve(undefined));

                                uiConversation.evtChecked.post({
                                    "from": "OTHER UA",
                                    "onProcessed": () => resolvePr()
                                });

                            } else {

                                pr = Promise.resolve(undefined);

                            }

                            return pr;

                        }
                    }

                })();

                const wdMessage = await prWdMessage;

                onProcessed();

                if (!wdMessage) {
                    return;
                }

                this.getOrCreateUiConversation(wdChat).newMessage(wdMessage);

                this.uiPhonebook.notifyContactChanged(wdChat);


            }
        );

        this.uaSim.evtIncomingCall.attach(
            async ({ fromNumber, terminate, prTerminated, onAccepted }) => {

                const wdChat = await this.getOrCreateChatByPhoneNumber(fromNumber);

                this.uiPhonebook.triggerContactClick(wdChat);

                const { onTerminated, prUserInput } = this.uiVoiceCall.onIncoming(wdChat);

                prTerminated.then(() => onTerminated("Call ended"));

                prUserInput.then(ua => {

                    if (ua.userAction === "REJECT") {

                        terminate();

                    }

                });

                prUserInput.then(ua => {

                    if (ua.userAction === "ANSWER") {

                        const { onEstablished } = ua;

                        onAccepted().then(({ sendDtmf }) => {

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

                    }

                });


            }
        );

        if (!!this.userSim.reachableSimState) {

            this.uaSim.register();

        }

    }

    private initUiHeader() {

        this.structure
            .find("div.id_header")
            .append(this.uiHeader.structure)
            ;

        this.uiHeader.evtJoinCall.attach(number =>
            this.uiQuickAction.evtVoiceCall.post(number)
        );

    }

    private initUiQuickAction() {

        this.structure
            .find("div.id_colLeft")
            .append(this.uiQuickAction.structure);

        const onEvt = async (action: "SMS" | "CALL" | "CONTACT", number: phoneNumber) => {

            const wdChat = await this.getOrCreateChatByPhoneNumber(number);

            this.uiPhonebook.triggerContactClick(wdChat);

            if (action === "SMS") {
                return;
            }

            const uiConversation = this.getOrCreateUiConversation(wdChat);

            switch (action) {
                case "CALL": uiConversation.evtVoiceCall.post(); break;
                case "CONTACT": uiConversation.evtUpdateContact.post(); break;
            }

        };

        this.uiQuickAction.evtSms.attach(number => onEvt("SMS", number));

        this.uiQuickAction.evtVoiceCall.attach(number => onEvt("CALL", number));

        this.uiQuickAction.evtNewContact.attach(number => onEvt("CONTACT", number));

    }

    private initUiPhonebook() {

        this.structure
            .find("div.id_colLeft")
            .append(this.uiPhonebook.structure);

        this.uiPhonebook.evtContactSelected.attach(
            ({ wdChatPrev, wdChat }) => {

                if (wdChatPrev) {

                    this.getOrCreateUiConversation(wdChatPrev).unselect();

                }

                this.getOrCreateUiConversation(wdChat).setSelected();

            }
        );

    }

    private readonly _uiConversations = new Map<wd.Chat<"PLAIN">, UiConversation>();

    private getOrCreateUiConversation(wdChat: wd.Chat<"PLAIN">): UiConversation {

        if (this._uiConversations.has(wdChat)) {
            return this._uiConversations.get(wdChat)!;
        }

        const uiConversation = new UiConversation(
            this.userSim,
            () => this.uaSim.isRegistered,
            wdChat
        );


        this._uiConversations.set(wdChat, uiConversation);

        this.structure.find("div.id_colRight").append(uiConversation.structure);

        uiConversation.evtChecked.attach(async data => {

            const isUpdated = await this.remoteApiCaller.updateWdChatIdOfLastMessageSeen(wdChat);

            if (data.from === "OTHER UA") {
                data.onProcessed();
            }

            if (!isUpdated) {
                return;
            }

            if (data.from === "THIS UA") {

                //TODO: Notify that the conversation have been checked.

                console.log("Here we should notify that the converstation have been checked");

                /*
                this.ua.sendMessage(
                    wdChat.contactNumber,
                    (() => {

                        const out: gwTypes.BundledData.ClientToServer.ConversationCheckedOut = {
                            "type": "CONVERSATION CHECKED OUT",
                            "textB64": Buffer.from("checked out from web", "utf8").toString("base64"),
                            "checkedOutAtTime": Date.now()
                        }

                        return out;


                    })()
                ).catch(() => console.log("Failed to send conversation checked out"));
                */

            }

            this.uiPhonebook.notifyContactChanged(wdChat);

        });

        uiConversation.evtSendText.attach(
            async text => {

                const exactSendDate = new Date();

                const wdMessage = await this.remoteApiCaller.newWdMessage(
                    uiConversation.wdChat,
                    (() => {

                        const message: wd.NoId<wd.Message.Outgoing.Pending<"PLAIN">> = {
                            "time": exactSendDate.getTime(),
                            "direction": "OUTGOING",
                            "status": "PENDING",
                            text,
                        };

                        return message;

                    })()
                );

                uiConversation.newMessage(wdMessage);

                try {

                    await this.uaSim.sendMessage(
                        uiConversation.wdChat.contactNumber,
                        await (async () => {

                            const out: gwTypes.BundledData.ClientToServer.Message = {
                                "type": "MESSAGE",
                                "textB64": Buffer.from(text, "utf8").toString("base64"),
                                "exactSendDateTime": exactSendDate.getTime(),
                                "appendPromotionalMessage": await this.remoteApiCaller.shouldAppendPromotionalMessage()
                            };

                            return out;

                        })()
                    );

                } catch (error) {

                    console.log("ua send message error", error);

                    const wdMessageUpdated = await this.remoteApiCaller.notifyUaFailedToSendMessage(
                        uiConversation.wdChat, wdMessage
                    );

                    uiConversation.newMessage(wdMessageUpdated);

                }

            }
        );

        uiConversation.evtVoiceCall.attach(
            async () => {

                /*
                if (!DetectRTC.isRtpDataChannelsSupported) {

                    let message = "Call not supported by this browser.";

                    if (/Android|webOS|Opera Mini/i.test(navigator.userAgent)) {

                        message += " Android app available";

                    } else if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {

                        message += " iOS app coming soon.";

                    }

                    bootbox_custom.alert(message);
                    return;

                }
                */

                const { terminate, prTerminated, prNextState } =
                    await this.uaSim.placeOutgoingCall(wdChat.contactNumber);

                const { onTerminated, onRingback, prUserInput } =
                    this.uiVoiceCall.onOutgoing(wdChat);

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
        );

        uiConversation.evtUpdateContact.attach(async () => {

            const name = await new Promise<string | null>(
                resolve => dialogApi.create("prompt", {
                    "title": `Contact name for ${wdChat.contactNumber}`,
                    "value": wdChat.contactName || "",
                    "callback": result => resolve(result),
                })
            );

            if (!name) {
                return undefined;
            }

            dialogApi.loading("Create or update contact");

            let contact: types.UserSim.Contact | undefined = this.userSim.phonebook.find(({ mem_index, number_raw }) => {

                if (wdChat.contactIndexInSim !== null) {
                    return mem_index === wdChat.contactIndexInSim;
                }

                return phoneNumber.areSame(wdChat.contactNumber, number_raw);

            });

            if (!!contact) {

                await this.remoteApiCaller.updateContactName(
                    this.userSim, contact, name
                );

            } else {

                contact = await this.remoteApiCaller.createContact(
                    this.userSim, name, wdChat.contactNumber
                );

            }

            const isUpdated = await this.remoteApiCaller.updateWdChatContactInfos(
                wdChat, name, contact.mem_index !== undefined ? contact.mem_index : null
            );

            dialogApi.dismissLoading();

            if (!isUpdated) {
                return;
            }


            this.uiPhonebook.notifyContactChanged(wdChat);

            uiConversation.notify();

        });

        uiConversation.evtDelete.attach(async () => {

            const shouldProceed = await new Promise<boolean>(
                resolve => dialogApi.create("confirm", {
                    "title": "Delete chat",
                    "message": "Delete contact and conversation ?",
                    callback: result => resolve(result)
                })
            );

            if (!shouldProceed) {
                return;
            }

            dialogApi.loading("Deleting contact and conversation");

            let contact: types.UserSim.Contact | undefined = this.userSim.phonebook.find(({ mem_index, number_raw }) => {

                if (wdChat.contactIndexInSim !== null) {
                    return mem_index === wdChat.contactIndexInSim;
                }

                return phoneNumber.areSame(wdChat.contactNumber, number_raw);

            });

            if (!!contact) {

                await this.remoteApiCaller.deleteContact(
                    this.userSim, contact
                );

            }

            await this.remoteApiCaller.destroyWdChat(this.wdInstance, wdChat);

            dialogApi.dismissLoading();

            this.uiPhonebook.notifyContactChanged(wdChat);

            uiConversation.structure.detach();

            this._uiConversations.delete(wdChat);

            this.uiPhonebook.triggerClickOnLastSeenChat();

        });

        uiConversation.evtLoadMore.attach(({ onLoaded }) =>
            this.remoteApiCaller.fetchOlderWdMessages(wdChat)
                .then(wdMessages => onLoaded(wdMessages))
        );

        return uiConversation;

    }

    private async getOrCreateChatByPhoneNumber(number: phoneNumber): Promise<wd.Chat<"PLAIN">> {

        let wdChat = this.wdInstance.chats.find(
            ({ contactNumber }) => contactNumber === number
        );

        if (!wdChat) {

            wdChat = await this.remoteApiCaller.newWdChat(
                this.wdInstance, number, "", null
            );

            this.uiPhonebook.insertContact(wdChat);

            $('body').data('dynamic').panels();

        }

        return wdChat;

    }

}

export namespace UiWebphoneController {


    export type BackendEvents = BackendEvents.HelperType<
        "evtContactCreatedOrUpdated" |
        "evtContactDeleted" |
        "evtSimReachabilityStatusChange" |
        "evtSimGsmConnectivityChange" |
        "evtSimCellSignalStrengthChange" |
        "evtOngoingCall"
    >;

    export namespace BackendEvents {

        type HelperType1<T> = T extends SyncEvent<infer U> ?
            (
                U extends types.UserSim.Usable ?
                VoidSyncEvent
                :
                (
                    U extends { userSim: types.UserSim.Usable } ?
                    SyncEvent<Omit<U, "userSim">>
                    :
                    T
                )
            )
            :
            T
            ;

        type HelperType2<T> = { [key in keyof T]: HelperType1<T[key]>; };

        type TypeofImport = typeof import("frontend-shared/dist/lib/toBackend/events");

        export type HelperType<K extends keyof TypeofImport> = HelperType2<Pick<TypeofImport, K>>;

    }

    export type RemoteApiCaller = RemoteApiCaller.HelperType<
        "newWdChat" |
        "updateWdChatContactInfos" |
        "newWdMessage" |
        "notifySendReportReceived" |
        "notifyStatusReportReceived" |
        "updateWdChatIdOfLastMessageSeen" |
        "shouldAppendPromotionalMessage" |
        "notifyUaFailedToSendMessage" | 
        "updateContactName" |
        "createContact" |
        "deleteContact" |
        "destroyWdChat" | 
        "fetchOlderWdMessages"
    >;

    export namespace RemoteApiCaller {

        type TypeofImport = typeof import("frontend-shared/dist/lib/toBackend/remoteApiCaller");

        export type HelperType<K extends keyof TypeofImport> = { [key in K]: TypeofImport[key]; };

    }

}
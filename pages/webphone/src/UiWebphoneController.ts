import { UiQuickAction } from "./UiQuickAction";
import { UiHeader } from "./UiHeader";
import { UiPhonebook } from "./UiPhonebook";
import { UiConversation } from "./UiConversation";
import { UiVoiceCall } from "./UiVoiceCall";
import { Ua } from "./Ua";
import * as types from "../../../shared/dist/lib/types";
import wd = types.webphoneData;
import { loadUiClassHtml } from "../../../shared/dist/lib/tools/loadUiClassHtml";
import * as remoteApiCaller from "../../../shared/dist/lib/toBackend/remoteApiCaller";
import * as localApiHandlers from "../../../shared/dist/lib/toBackend/localApiHandlers";
import { phoneNumber } from "phone-number";
import * as bootbox_custom from "../../../shared/dist/lib/tools/bootbox_custom";

declare const require: any;

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
    private readonly uiConversations = new Map<wd.Chat, UiConversation>();

    private readonly ua: Ua;

    public static async create(userSim: types.UserSim.Usable): Promise<UiWebphoneController> {

        localApiHandlers.evtSimPermissionLost.attachOnce(
            userSim_ => userSim_ === userSim,
            () => {

                //TODO: Implement behavior on permission lost.

                location.reload();

            }
        );

        return new this(
            userSim,
            await remoteApiCaller.getOrCreateWdInstance(userSim)
        );

    }

    private constructor(
        public readonly userSim: types.UserSim.Usable,
        public readonly wdInstance: wd.Instance
    ) {

        this.ua = new Ua(userSim);

        this.uiVoiceCall = new UiVoiceCall(userSim);

        this.uiHeader = new UiHeader(userSim);

        this.uiQuickAction = new UiQuickAction(userSim);

        this.uiPhonebook = new UiPhonebook(userSim, wdInstance);

        this.registerRemoteNotifyHandlers();

        this.initUa();

        this.initUiHeader();

        this.initUiQuickAction();

        this.initUiPhonebook();

        for (const wdChat of this.wdInstance.chats) {

            this.initUiConversation(wdChat);

        }

        $("body").data("dynamic").panels();

        setTimeout(() => this.uiPhonebook.triggerClickOnLastSeenChat(), 0);

    }

    private registerRemoteNotifyHandlers() {

        localApiHandlers.evtSharedSimUnregistered.attachOnce(
            ({ userSim }) => userSim === this.userSim,
            () => {

                //TODO: Terminate UA.
                this.structure.remove();


            }
        );

        localApiHandlers.evtContactCreatedOrUpdated.attach(
            ({ userSim }) => userSim === this.userSim,
            async ({ contact }) => {

                let wdChat = this.wdInstance.chats.find(
                    ({ contactNumber }) => phoneNumber.areSame(contactNumber, contact.number_raw)
                );

                if (!wdChat) {

                    wdChat = await remoteApiCaller.newWdChat(
                        this.wdInstance,
                        phoneNumber.build(
                            contact.number_raw,
                            this.userSim.sim.country ? this.userSim.sim.country.iso : undefined
                        ),
                        contact.name,
                        contact.mem_index !== undefined ? contact.mem_index : null
                    );

                    this.initUiConversation(wdChat);

                } else {

                    const isUpdated = await remoteApiCaller.updateWdChatContactInfos(
                        wdChat, contact.name,
                        contact.mem_index !== undefined ? contact.mem_index : null
                    );

                    if (!isUpdated) {
                        return;
                    }

                    const uiConversation = this.uiConversations.get(wdChat)!;

                    this.uiPhonebook.notifyContactChanged(wdChat);

                    uiConversation.notifyContactNameUpdated();

                }

            }
        );

        localApiHandlers.evtContactDeleted.attach(
            ({ userSim }) => userSim === this.userSim,
            async ({ contact }) => {

                const wdChat = this.wdInstance.chats.find(
                    ({ contactNumber }) => phoneNumber.areSame(contactNumber, contact.number_raw)
                )!;

                const isUpdated = await remoteApiCaller.updateWdChatContactInfos(
                    wdChat,
                    "",
                    null
                );

                if (!isUpdated) {
                    return;
                }

                const uiConversation = this.uiConversations.get(wdChat)!;

                this.uiPhonebook.notifyContactChanged(wdChat);

                uiConversation.notifyContactNameUpdated();

            }
        );

        localApiHandlers.evtSimIsOnlineStatusChange.attach(
            userSim => userSim === this.userSim,
            async () => {

                if (!this.userSim.isOnline) {

                    if (this.ua.isRegistered) {

                        this.ua.unregister();

                    }

                } else {

                    //TODO: reload ui header.
                    this.ua.register();

                }

            }
        );

    }

    private initUa() {

        this.ua.evtRegistrationStateChanged.attach(isRegistered => {

            this.uiHeader.setIsOnline(isRegistered);

            for (const uiConversation of this.uiConversations.values()) {

                uiConversation.setReadonly(!isRegistered);

            }

        });

        this.ua.evtIncomingMessage.attach(
            async ({ fromNumber, bundledData, text, onProcessed }) => {

                const wdChat = await this.getOrCreateChatByPhoneNumber(fromNumber);

                const prWdMessage: Promise<Exclude<wd.Message, wd.Message.Outgoing.Pending> | undefined> = (() => {

                    switch (bundledData.type) {
                        case "MESSAGE": {

                            const message: wd.NoId<wd.Message.Incoming.Text> = {
                                "direction": "INCOMING",
                                "isNotification": false,
                                "time": bundledData.pduDate.getTime(),
                                text
                            };

                            return remoteApiCaller.newWdMessage(wdChat, message);

                        }
                        case "SEND REPORT": {

                            return remoteApiCaller.notifySendReportReceived(wdChat, bundledData);

                        }
                        case "STATUS REPORT": {

                            if (bundledData.messageTowardGsm.uaSim.ua.instance === Ua.instanceId ) {

                                return remoteApiCaller.notifyStatusReportReceived(wdChat, bundledData);

                            } else {

                                const message: wd.NoId<wd.Message.Outgoing.StatusReportReceived> = {
                                    "time": bundledData.messageTowardGsm.date.getTime(),
                                    "direction": "OUTGOING",
                                    "text": bundledData.messageTowardGsm.text,
                                    "sentBy": ((): wd.Message.Outgoing.StatusReportReceived["sentBy"] => {
                                        if (bundledData.messageTowardGsm.uaSim.ua.userEmail === Ua.email) {
                                            return { "who": "USER" };
                                        } else {
                                            return { "who": "OTHER", "email": bundledData.messageTowardGsm.uaSim.ua.userEmail };
                                        }
                                    })(),
                                    "status": "STATUS REPORT RECEIVED",
                                    "deliveredTime": bundledData.statusReport.isDelivered ?
                                        bundledData.statusReport.dischargeDate.getTime() : null
                                };

                                return remoteApiCaller.newWdMessage(wdChat, message);

                            }
                        }
                        case "CALL ANSWERED BY":
                        case "MISSED CALL": {

                            const message: wd.NoId<wd.Message.Incoming.Notification> = {
                                "direction": "INCOMING",
                                "isNotification": true,
                                "time": bundledData.date.getTime(),
                                text
                            };

                            return remoteApiCaller.newWdMessage(wdChat, message);

                        }
                    }

                })();

                const wdMessage = await prWdMessage;

                onProcessed();

                if (!!wdMessage) {

                    this.uiConversations.get(wdChat)!.newMessage(wdMessage);

                    this.uiPhonebook.notifyContactChanged(wdChat);

                }

            }
        );

        this.ua.evtIncomingCall.attach(
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

        if (this.userSim.isOnline) {

            this.ua.register();

        }

    }

    private initUiHeader() {

        this.structure
            .find("div.id_header")
            .append(this.uiHeader.structure)
            ;

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

            const uiConversation = this.uiConversations.get(wdChat)!;

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

                    this.uiConversations.get(wdChatPrev)!.unselect();

                }

                this.uiConversations.get(wdChat)!.setSelected();

            }
        );

    }

    private initUiConversation(wdChat: wd.Chat) {

        const uiConversation = new UiConversation(this.userSim, wdChat);

        if (this.ua.isRegistered) {
            uiConversation.setReadonly(false);
        }

        this.uiConversations.set(wdChat, uiConversation);

        this.structure.find("div.id_colRight").append(uiConversation.structure);

        uiConversation.evtChecked.attach(async () => {

            const isUpdated = await remoteApiCaller.updateWdChatIdOfLastMessageSeen(wdChat);

            if (!isUpdated) {
                return;
            }

            this.uiPhonebook.notifyContactChanged(wdChat);

        });

        uiConversation.evtSendText.attach(
            async text => {

                const exactSendDate = new Date();

                const wdMessage = await remoteApiCaller.newWdMessage(
                    uiConversation.wdChat,
                    (() => {

                        const message: wd.NoId<wd.Message.Outgoing.Pending> = {
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

                    await this.ua.sendMessage(
                        uiConversation.wdChat.contactNumber, text, exactSendDate
                    );

                } catch (error) {

                    console.log("ua send message error", error);

                    const wdMessageUpdated = await remoteApiCaller.notifyUaFailedToSendMessage(
                        uiConversation.wdChat, wdMessage
                    );

                    uiConversation.newMessage(wdMessageUpdated);

                }

            }
        );

        uiConversation.evtVoiceCall.attach(
            () => {

                const { terminate, prTerminated, prNextState } =
                    this.ua.placeOutgoingCall(wdChat.contactNumber);

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
                resolve => bootbox_custom.prompt({
                    "title": `Contact name for ${wdChat.contactNumber}`,
                    "value": wdChat.contactName || "",
                    "callback": result => resolve(result),
                })
            );

            if (!name) {
                return undefined;
            }

            bootbox_custom.loading("Create or update contact");

            let contact: types.UserSim.Contact | undefined = this.userSim.phonebook.find(({ mem_index, number_raw }) => {

                if (wdChat.contactIndexInSim !== null) {
                    return mem_index === wdChat.contactIndexInSim;
                }

                return phoneNumber.areSame(wdChat.contactNumber, number_raw);

            });

            if (!!contact) {

                await remoteApiCaller.updateContactName(
                    this.userSim, contact, name
                );

            } else {

                contact = await remoteApiCaller.createContact(
                    this.userSim, name, wdChat.contactNumber
                );

            }

            const isUpdated = await remoteApiCaller.updateWdChatContactInfos(
                wdChat, name, contact.mem_index !== undefined ? contact.mem_index : null
            );

            bootbox_custom.dismissLoading();

            if (!isUpdated) {
                return;
            }


            this.uiPhonebook.notifyContactChanged(wdChat);

            uiConversation.notifyContactNameUpdated();

        });

        uiConversation.evtDelete.attach(async () => {

            const shouldProceed = await new Promise<boolean>(
                resolve => bootbox_custom.confirm({
                    "title": "Delete chat",
                    "message": "Delete contact and conversation ?",
                    callback: result => resolve(result)
                })
            );

            if (!shouldProceed) {
                return;
            }

            bootbox_custom.loading("Deleting contact and conversation");

            let contact: types.UserSim.Contact | undefined = this.userSim.phonebook.find(({ mem_index, number_raw }) => {

                if (wdChat.contactIndexInSim !== null) {
                    return mem_index === wdChat.contactIndexInSim;
                }

                return phoneNumber.areSame(wdChat.contactNumber, number_raw);

            });

            if (!!contact) {

                await remoteApiCaller.deleteContact(
                    this.userSim, contact
                );

            }

            await remoteApiCaller.destroyWdChat(this.wdInstance, wdChat);

            bootbox_custom.dismissLoading();

            this.uiPhonebook.notifyContactChanged(wdChat);

            uiConversation.structure.detach();

            this.uiConversations.delete(wdChat);

            this.uiPhonebook.triggerClickOnLastSeenChat();

        });

        uiConversation.evtLoadMore.attach(({ onLoaded }) =>
            remoteApiCaller.fetchOlderWdMessages(wdChat)
                .then(wdMessages => onLoaded(wdMessages))
        );

    }

    private async getOrCreateChatByPhoneNumber(number: phoneNumber): Promise<wd.Chat> {

        let wdChat = this.wdInstance.chats.find(
            ({ contactNumber }) => contactNumber === number
        );

        if (!wdChat) {

            wdChat = await remoteApiCaller.newWdChat(
                this.wdInstance, number, "", null
            );

            this.uiPhonebook.insertContact(wdChat);

            this.initUiConversation(wdChat);

            $('body').data('dynamic').panels();

        }

        return wdChat;

    }


}

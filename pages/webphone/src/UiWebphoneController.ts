import { VoidSyncEvent } from "ts-events-extended";

import * as tools from "../../../tools";
import * as wd from "./data";
import Wd = types.WebphoneData;

import {
    types as gwTypes,
} from "./semasim-gateway";

import { UiQuickAction } from "./UiQuickAction";
import { UiHeader } from "./UiHeader";
import { UiPhonebook } from "./UiPhonebook";
import { UiConversation } from "./UiConversation";
import { UiVoiceCall } from "./UiVoiceCall";

import { phoneNumber } from "../../../shared";

import { Ua } from "./Ua";

import { types, apiClient as api } from "../../../api";

declare const require: any;

const html = tools.loadUiClassHtml(
    require("../templates/UiWebphoneController.html"),
    "UiWebphoneController"
);


export class UiWebphoneController {

    public readonly structure = html.structure.clone();

    public readonly evtUp = new VoidSyncEvent();

    private readonly ua: Ua;

    private readonly uiVoiceCall: UiVoiceCall;
    private readonly uiHeader: UiHeader;
    private readonly uiQuickAction: UiQuickAction;
    private readonly uiPhonebook: UiPhonebook;
    private readonly uiConversations = new Map<Wd.Chat, UiConversation>();


    constructor(
        public readonly userSim: types.UserSim.Usable,
        public readonly wdInstance: types.WebphoneData.Instance
    ) {


        this.uiVoiceCall = new UiVoiceCall(userSim);

        this.ua = new Ua(userSim);

        this.uiHeader = new UiHeader(userSim);

        this.uiQuickAction = new UiQuickAction(userSim);

        this.uiPhonebook = new UiPhonebook(userSim, wdInstance);

        this.initUa();

        this.initUiHeader();

        this.initUiQuickAction();

        this.initUiPhonebook();

        for (const wdChat of this.wdInstance.chats) {

            this.initUiConversation(wdChat);

        }

        setTimeout(() => this.uiPhonebook.triggerClickOnLastSeenChat(), 0);

        $('body').data('dynamic').panels();


    }

    private initUa() {

        this.ua.evtRegistrationStateChanged.attach(isRegistered => {

            for (let uiConversation of this.uiConversations.values()) {

                uiConversation.setReadonly(!isRegistered);

            }

        });

        this.ua.evtIncomingMessage.attach(
            async ({ fromNumber, bundledData, text, onProcessed }) => {

                const wdChat = await this.getOrCreateChatByPhoneNumber(fromNumber);

                const wdMessage: Exclude<Wd.Message, Wd.Message.Outgoing.TransmittedToGateway> | "SKIPPED" = await (() => {

                    switch (bundledData.type) {
                        case "MESSAGE": return this.onIncomingMessage_Message(wdChat, bundledData, text);
                        case "SEND REPORT": return this.onIncomingMessage_SendReport(wdChat, bundledData);
                        case "STATUS REPORT": return this.onIncomingMessage_StatusReport(wdChat, bundledData);
                        default: return this.onIncomingMessage_Notification(wdChat, bundledData, text);
                    }

                })();

                onProcessed();

                if (wdMessage !== "SKIPPED") {

                    this.uiConversations.get(wdChat)!.newMessage(wdMessage);

                    this.uiPhonebook.notifyContactChanged(wdChat);

                }


            }
        );

        this.handleIncomingCalls();

    }

    private initUiHeader() {

        this.structure
            .find("div.id_header")
            .append(this.uiHeader.structure)
            ;

        this.uiHeader.evtUp.attach(
            () => this.evtUp.post()
        );

    }

    private initUiQuickAction() {

        this.structure
            .find("div.id_colLeft")
            .append(this.uiQuickAction.structure);

        const onEvt = async (action: "SMS" | "CALL" | "CONTACT", number: phoneNumber) => {

            const wdChat = await this.getOrCreateChatByPhoneNumber(number);

            this.uiPhonebook.triggerContactClick(wdChat);

            switch (action) {
                case "CALL": this.placeOutgoingCall(wdChat); break;
                case "CONTACT": this.uiConversations.get(wdChat)!.evtUpdateContact.post(); break;
                default:
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

    private initUiConversation(wdChat: Wd.Chat) {

        const uiConversation = new UiConversation(this.userSim, wdChat);

        if (this.ua.isRegistered) {
            uiConversation.setReadonly(false);
        }

        this.uiConversations.set(wdChat, uiConversation);

        this.structure.find("div.id_colRight").append(uiConversation.structure);

        uiConversation.evtChecked.attach(async () => {

            if (
                wd.read.notificationCount(wdChat) ||
                wd.read.lastSeenChat(this.wdInstance) !== wdChat
            ) {

                await wd.io.updateChat(wdChat, { "lastSeenTime": Date.now() });

                this.uiPhonebook.notifyContactChanged(wdChat);

            }

        });

        uiConversation.evtSendText.attach(
            text => this.sendText(uiConversation, text)
        );

        uiConversation.evtVoiceCall.attach(
            () => this.placeOutgoingCall(wdChat)
        );

        uiConversation.evtUpdateContact.attach(async () => {

            const name = await new Promise<string | null>(
                resolve => tools.bootbox_custom.prompt({
                    "title": `Contact name for ${wdChat.contactNumber}`,
                    "value": wdChat.contactName || "",
                    "callback": result => resolve(result),
                })
            );

            if (!name) {
                return undefined;
            }

            tools.bootbox_custom.loading("Create or update contact");

            if (
                wdChat.contactIndexInSim === null &&
                wdChat.contactName === ""
            ) {

                const { mem_index } = await api.createContact(
                    this.userSim.sim.imsi,
                    name,
                    wdChat.contactNumber
                );

                await wd.io.updateChat(wdChat,
                    { "contactIndexInSim": mem_index, "contactName": name }
                );

            } else {

                await api.updateContactName(
                    this.userSim.sim.imsi,
                    (wdChat.contactIndexInSim !== null) ?
                        ({ "mem_index": wdChat.contactIndexInSim }) :
                        ({ "number": wdChat.contactNumber }),
                    name
                );

                await wd.io.updateChat(wdChat, { "contactName": name });

            }

            tools.bootbox_custom.dismissLoading();

            this.uiPhonebook.notifyContactChanged(wdChat);
            uiConversation.notifyContactNameUpdated();

        });

        uiConversation.evtDelete.attach(async () => {

            const shouldProceed = await new Promise<boolean>(
                resolve => tools.bootbox_custom.confirm({
                    "title": "Delete chat",
                    "message": "Delete contact and conversation ?",
                    callback: result => resolve(result)
                })
            );

            if (!shouldProceed) {
                return;
            }

            tools.bootbox_custom.loading("Deleting contact and conversation");

            if (
                wdChat.contactIndexInSim !== null ||
                wdChat.contactName !== ""
            ) {

                await api.deleteContact(
                    this.userSim.sim.imsi,
                    (wdChat.contactIndexInSim !== null) ?
                        ({ "mem_index": wdChat.contactIndexInSim }) :
                        ({ "number": wdChat.contactNumber })
                );

            }

            await wd.io.deleteChat(this.wdInstance, wdChat);

            tools.bootbox_custom.dismissLoading();

            this.uiPhonebook.notifyContactChanged(wdChat);

            uiConversation.structure.detach();

            this.uiConversations.delete(wdChat);

            this.uiPhonebook.triggerClickOnLastSeenChat();

            //window.location.reload();

        });

    }

    private async getOrCreateChatByPhoneNumber(number: phoneNumber): Promise<Wd.Chat> {

        let wdChat = this.wdInstance.chats.find(
            ({ contactNumber }) => contactNumber === number
        );

        if (!wdChat) {

            //TODO: this.uiNewContact.evt.post(...

            wdChat = await wd.io.newChat(
                this.wdInstance, number, "", null
            );

            this.uiPhonebook.insertContact(wdChat);

            this.initUiConversation(wdChat);

            $('body').data('dynamic').panels();

        }

        return wdChat;

    }

    private async sendText(uiConversation: UiConversation, text: string) {

        const exactSendDate= new Date();

        //TODO: Change transmitted to gateway as it's not semantically correct
        const wdMessageOutgoing: Wd.Message.Outgoing.TransmittedToGateway = {
            "id_": NaN,
            "time": exactSendDate.getTime(),
            "direction": "OUTGOING",
            text,
            "sentBy": { "who": "MYSELF" },
            "status": "TRANSMITTED TO GATEWAY"
        };

        await wd.io.newMessage(
            uiConversation.wdChat,
            wdMessageOutgoing
        );

        uiConversation.newMessage(wdMessageOutgoing);

        try {

            await this.ua.sendMessage(uiConversation.wdChat.contactNumber, text, exactSendDate);

        }catch(error){

            console.log("Maybe the message was not successfully transmitted to the gateway", error);

        }


    }

    private async onIncomingMessage_Notification(
        wdChat: Wd.Chat,
        bundledData: gwTypes.BundledData.ServerToClient.CallAnsweredBy |
            gwTypes.BundledData.ServerToClient.MissedCall,
        text: string
    ): Promise<Wd.Message.Incoming.Notification | "SKIPPED"> {

        const wdMessage: Wd.Message.Incoming.Notification = {
            "id_": NaN,
            "direction": "INCOMING",
            "isNotification": true,
            text,
            "time": bundledData.date.getTime()
        };

        const isSkipped = await wd.io.newMessage(wdChat, wdMessage);

        if (!!isSkipped) {
            return "SKIPPED";
        }

        return wdMessage;

    }

    private async onIncomingMessage_Message(
        wdChat: Wd.Chat,
        bundledData: gwTypes.BundledData.ServerToClient.Message,
        text: string
    ): Promise<Wd.Message.Incoming.Text | "SKIPPED"> {

        const wdMessage: Wd.Message.Incoming.Text = {
            "id_": NaN,
            "direction": "INCOMING",
            "isNotification": false,
            text,
            "time": bundledData.pduDate.getTime()
        };

        const isSkipped = await wd.io.newMessage(wdChat, wdMessage);

        if (!!isSkipped) {
            return "SKIPPED";
        }

        return wdMessage;

    }

    private async onIncomingMessage_SendReport(
        wdChat: Wd.Chat,
        bundledData: gwTypes.BundledData.ServerToClient.SendReport,
    ): Promise<Wd.Message.Outgoing.SendReportReceived | "SKIPPED"> {

        const wdMessage: Wd.Message.Outgoing.TransmittedToGateway = wdChat.messages.find(
            ({ time }) => time === bundledData.messageTowardGsm.date.getTime()
        ) as any;

        if (!wdMessage) {

            console.log("Received a Send report for a MESSAGE that we do not have in record, ok only if chat deleted");

            return "SKIPPED";

        }

        const isSkipped = await wd.io.updateOutgoingMessageStatusToSendReportReceived(
            wdMessage,
            bundledData.sendDate ? bundledData.sendDate.getTime() : null
        );

        if (!!isSkipped) {
            return "SKIPPED";
        }

        return wdMessage as Wd.Message.Outgoing.SendReportReceived;

    }

    private async onIncomingMessage_StatusReport(
        wdChat: Wd.Chat,
        bundledData: gwTypes.BundledData.ServerToClient.StatusReport
    ): Promise<Wd.Message.Outgoing.StatusReportReceived | "SKIPPED"> {

        if (bundledData.messageTowardGsm.uaSim.ua.instance === `"<urn:${Ua.instanceId}>"`) {

            const wdMessage: Wd.Message.Outgoing.SendReportReceived = wdChat.messages.find(
                ({ time }) => time === bundledData.messageTowardGsm.date.getTime()
            ) as any;

            if (!wdMessage || wdMessage.dongleSendTime === undefined ) {

                console.log([
                    "Received a Status report for a MESSAGE that we do not have in",
                    "record or we do not have received send report, ok only if chat deleted"
                ].join(" "));

                return "SKIPPED";

            }

            const isSkipped = await wd.io.updateOutgoingMessageStatusToStatusReportReceived(
                wdMessage,
                bundledData.statusReport.isDelivered ?
                    bundledData.statusReport.dischargeDate.getTime() : null
            );

            if (!!isSkipped) {
                return "SKIPPED";
            }

            return wdMessage as any as Wd.Message.Outgoing.StatusReportReceived;

        } else {

            const wdMessage: Wd.Message.Outgoing.StatusReportReceived = {
                "id_": NaN,
                "time": bundledData.messageTowardGsm.date.getTime(),
                "direction": "OUTGOING",
                "text": bundledData.messageTowardGsm.text,
                "sentBy": ((): Wd.Message.Outgoing["sentBy"] => {
                    if (bundledData.messageTowardGsm.uaSim.ua.userEmail === Ua.email) {
                        return { "who": "MYSELF" };
                    } else {
                        return { "who": "OTHER", "email": bundledData.messageTowardGsm.uaSim.ua.userEmail };
                    }
                })(),
                "status": "STATUS REPORT RECEIVED",
                "dongleSendTime": bundledData.messageTowardGsm.date.getTime(), //FAKE
                "deliveredTime": bundledData.statusReport.isDelivered ?
                    bundledData.statusReport.dischargeDate.getTime() : null
            };

            const isSkipped = await wd.io.newMessage(
                wdChat,
                wdMessage
            );

            if (!!isSkipped) {
                return "SKIPPED";
            }

            return wdMessage;

        }

    }

    private placeOutgoingCall(wdChat: Wd.Chat): void {

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

    private handleIncomingCalls(): void {

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
    }

}

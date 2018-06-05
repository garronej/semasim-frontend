import { VoidSyncEvent } from "ts-events-extended";

import { loadHtml } from "./loadHtml";
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

import * as tools from "../../../tools";
import { types, apiClient as api } from "../../../api";

declare const require: any;

const html = loadHtml(
    require("../templates/UiWebphoneController.html"),
    "UiWebphoneController"
);


export class UiWebphoneController {

    public readonly structure = html.structure.clone();

    public readonly evtUp = new VoidSyncEvent();

    private readonly uiHeader!: UiHeader;
    private readonly uiQuickAction!: UiQuickAction;
    private readonly uiPhonebook!: UiPhonebook;
    private readonly uiConversations = new Map<Wd.Chat, UiConversation>();
    private readonly uiVoiceCall: UiVoiceCall;

    private readonly ua!: Ua;


    constructor(
        public readonly userSim: types.UserSim.Usable,
        public readonly wdInstance: types.WebphoneData.Instance
    ) {

        this.uiVoiceCall = new UiVoiceCall(userSim);

        this.initUa();

        this.initUiHeader();
        this.initUiQuickAction();
        this.initUiPhonebook();

        for (let wdChat of this.wdInstance.chats) {

            this.initUiConversation(wdChat);

        }

        setTimeout(()=> this.uiPhonebook.triggerClickOnLastSeenChat(), 0);

        $('body').data('dynamic').panels();

    }

    private initUa() {

        this.ua! = new Ua(this.userSim);

        this.ua.evtRegistrationStateChanged.attach(isRegistered => {

            for (let uiConversation of this.uiConversations.values()) {

                uiConversation.setReadonly(!isRegistered);

            }

        });

        this.ua.evtIncomingMessage.attach(
            async ({ fromNumber, bundledData, text }) => {

                let wdChat = await this.getOrCreateChatByPhoneNumber(fromNumber);

                let wdMessage: Wd.Message = await (() => {

                    switch (bundledData.type) {
                        case "MESSAGE": return this.onIncomingMessage_Message(wdChat, bundledData, text);
                        case "SEND REPORT": return this.onIncomingMessage_SendReport(wdChat, bundledData);
                        case "STATUS REPORT": return this.onIncomingMessage_StatusReport(wdChat, bundledData);
                        default: return null as any;
                    }

                })();

                if (!wdMessage) {
                    console.log("TODO implement bundle data type", JSON.stringify({ bundledData }, null, 2));
                    return;
                }

                this.uiConversations.get(wdChat)!.newMessage(wdMessage);

                this.uiPhonebook.notifyContactChanged(wdChat);

            }
        );

        this.handleIncomingCalls();

    }

    private initUiConversation(wdChat: Wd.Chat) {

        let uiConversation = new UiConversation(this.userSim, wdChat);

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

            tools.bootbox_custom.loading("Creating contact");

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

            if( !shouldProceed ){
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

            //TODO do without reloading.
            window.location.reload();

        });

    }

    private initUiHeader() {

        this.uiHeader! = new UiHeader(this.userSim);

        this.structure
            .find("div.id_header")
            .append(this.uiHeader.structure)
            ;

        this.uiHeader.evtUp.attach(
            () => this.evtUp.post()
        );

    }

    private initUiQuickAction() {

        this.uiQuickAction! = new UiQuickAction(this.userSim);

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

        this.uiPhonebook! = new UiPhonebook(this.userSim, this.wdInstance);

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

        let exactSendDate: Date;

        try {

            exactSendDate = await this.ua.sendMessage(
                uiConversation.wdChat.contactNumber, text
            );

        } catch (error) {

            alert(error.message);

            return;

        }

        let wdMessageOutgoing = await wd.io.newMessage<Wd.Message.Outgoing.TransmittedToGateway>(
            uiConversation.wdChat,
            {
                "id_": NaN,
                "time": exactSendDate.getTime(),
                "direction": "OUTGOING",
                text,
                "sentBy": { "who": "MYSELF" },
                "status": "TRANSMITTED TO GATEWAY"
            }
        );

        uiConversation.newMessage(wdMessageOutgoing);

    }

    private onIncomingMessage_Message(
        wdChat: Wd.Chat,
        bundledData: gwTypes.BundledData.ServerToClient.Message,
        text: string
    ): Promise<Wd.Message.Incoming.Text> {

        return wd.io.newMessage<Wd.Message.Incoming.Text>(wdChat, {
            "id_": NaN,
            "direction": "INCOMING",
            "isNotification": false,
            text,
            "time": bundledData.pduDate.getTime()
        });

    }

    private async onIncomingMessage_SendReport(
        wdChat: Wd.Chat,
        bundledData: gwTypes.BundledData.ServerToClient.SendReport,
    ): Promise<Wd.Message.Outgoing.SendReportReceived> {

        let wdMessage: Wd.Message.Outgoing.TransmittedToGateway = await (async () => {
            let out;
            while (true) {
                //TODO: optimise find
                out = wdChat.messages.find(({ time }) => time === bundledData.messageTowardGsm.date.getTime());
                if (!out) {
                    alert("aie aie aie!");
                    await new Promise(resolve => setTimeout(resolve, 500));
                    continue;
                }
                break;
            }
            return out;
        })();

        await wd.io.updateOutgoingMessageStatusToSendReportReceived(
            wdMessage,
            bundledData.sendDate ? bundledData.sendDate.getTime() : null
        );

        return wdMessage as Wd.Message.Outgoing.SendReportReceived;

    }

    private async onIncomingMessage_StatusReport(
        wdChat: Wd.Chat,
        bundledData: gwTypes.BundledData.ServerToClient.StatusReport
    ): Promise<Wd.Message.Outgoing.StatusReportReceived> {

        if (bundledData.messageTowardGsm.uaSim.ua.instance === `"<urn:${Ua.instanceId}>"`) {

            let wdMessage: Wd.Message.Outgoing.SendReportReceived = await (async () => {
                let out;
                while (true) {
                    //TODO: optimise find
                    out = wdChat.messages.find(
                        ({ time }) => time === bundledData.messageTowardGsm.date.getTime()
                    );
                    if (!out) {
                        alert("aie aie aie 2!");
                        await new Promise(resolve => setTimeout(resolve, 500));
                        continue;
                    }
                    break;
                }
                return out;
            })();

            await wd.io.updateOutgoingMessageStatusToStatusReportReceived(
                wdMessage,
                bundledData.statusReport.isDelivered ?
                    bundledData.statusReport.dischargeDate.getTime() : null
            );

            return wdMessage as any as Wd.Message.Outgoing.StatusReportReceived;


        } else {

            return wd.io.newMessage<Wd.Message.Outgoing.StatusReportReceived>(
                wdChat,
                {
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
                }
            );

        }

    }

    private placeOutgoingCall(wdChat: Wd.Chat): void {

        let { terminate, prTerminated, prNextState } =
            this.ua.placeOutgoingCall(wdChat.contactNumber);

        let { onTerminated, onRingback, prUserInput } =
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

                let wdChat = await this.getOrCreateChatByPhoneNumber(fromNumber);

                this.uiPhonebook.triggerContactClick(wdChat);

                let { onTerminated, prUserInput } = this.uiVoiceCall.onIncoming(wdChat);

                prTerminated.then(() => onTerminated("Call ended"));

                prUserInput.then(ua => {

                    if (ua.userAction === "REJECT") {

                        terminate();

                    }

                });

                prUserInput.then(ua => {

                    if (ua.userAction === "ANSWER") {

                        let { onEstablished } = ua;

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

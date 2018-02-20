import { VoidSyncEvent } from "ts-events-extended";

import { types } from "../../../api";

import { loadHtml } from "./loadHtml";
import * as wd from "./data";
import Wd = types.WebphoneData;

import { UiQuickAction } from "./UiQuickAction";
import { UiHeader } from "./UiHeader";
import { UiPhonebook } from "./UiPhonebook";
import { UiConversation } from "./UiConversation";

import { phoneNumber } from "../../../shared";

import { Ua } from "./Ua";

declare const require: any;


const html = loadHtml(
    require("../templates/UiWebphone.html"),
    "UiWebphone"
);

export class UiWebphone {

    public readonly structure = html.structure.clone();

    public readonly evtUp = new VoidSyncEvent();

    private readonly uiHeader!: UiHeader;
    private readonly uiQuickAction!: UiQuickAction;
    private readonly uiPhonebook!: UiPhonebook;
    private readonly uiConversations = new Map<Wd.Chat, UiConversation>();

    private readonly ua: Ua;

    constructor(
        public readonly userSim: types.UserSim.Usable,
        public readonly wdInstance: types.WebphoneData.Instance
    ) {

        this.ua = new Ua(this.userSim);

        this.ua.evtIncomingMessage.attach(
            async ({ fromNumber, bundledData, text }) => {

                let wdChat = await this.getOrCreateChatByPhoneNumber(fromNumber);

                let wdMessage: Wd.Message;

                if (bundledData.type === "MESSAGE") {


                    let wdMessageIncoming = await wd.io.newMessage<Wd.Message.Incoming>(wdChat, {
                        "id_": NaN,
                        "direction": "INCOMING",
                        "isNotification": false,
                        text,
                        "time": bundledData.pduDate.getTime()
                    });

                    wdMessage = wdMessageIncoming;

                } else if (bundledData.type === "SEND REPORT") {

                    //TODO: optimise find
                    let wdMessageOutgoing = wdChat
                        .messages
                        .find(
                            ({ time }) => time === bundledData.messageTowardGsm.date.getTime()
                        )! as Wd.Message.Outgoing.TransmittedToGateway
                        ;


                    await wd.io.updateOutgoingMessageStatusToSendReportReceived(
                        wdMessageOutgoing,
                        bundledData.sendDate ? bundledData.sendDate.getTime() : null
                    );

                    wdMessage = wdMessageOutgoing;


                } else if (bundledData.type === "STATUS REPORT") {

                    if (bundledData.messageTowardGsm.uaSim.ua.instance === `"<urn:${Ua.instanceId}>"`) {

                        //TODO: optimise find
                        let wdMessageOutgoing = wdChat
                            .messages
                            .find(
                                ({ time }) => time === bundledData.messageTowardGsm.date.getTime()
                            )! as Wd.Message.Outgoing.SendReportReceived
                            ;

                        await wd.io.updateOutgoingMessageStatusToStatusReportReceived(
                            wdMessageOutgoing,
                            bundledData.statusReport.isDelivered ? bundledData.statusReport.dischargeDate.getTime() : null
                        );

                        wdMessage = wdMessageOutgoing;


                    } else {

                        let wdMessageOutgoing = await wd.io.newMessage<Wd.Message.Outgoing.StatusReportReceived>(
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
                                "deliveredTime": bundledData.statusReport.isDelivered ? bundledData.statusReport.dischargeDate.getTime() : null
                            }
                        );

                        wdMessage = wdMessageOutgoing;

                    }


                } else {

                    console.log("TODO", { bundledData });

                    return;

                }

                this.uiConversations.get(wdChat)!.newMessage(wdMessage);

                this.uiPhonebook.notifyContactChanged(wdChat);

            }
        );

        this.initUiHeader();
        this.initUiQuickAction();
        this.initUiPhonebook();

        for (let wdChat of this.wdInstance.chats) {

            this.initUiConversation(wdChat);

        }

        $('body').data('dynamic').panels();

    }

    private initUiConversation(wdChat: Wd.Chat) {

        let uiConversation = new UiConversation(this.userSim, wdChat);

        this.uiConversations.set(wdChat, uiConversation);

        this.structure.find("div.id_colRight").append(uiConversation.structure);

        uiConversation.evtVoiceCall.attach(
            () => this.uiQuickAction.evtVoiceCall.post(wdChat.contactNumber)
        );

        uiConversation.evtUpdateContact.attach(
            () => this.uiQuickAction.evtNewContact.post(wdChat.contactNumber)
        );

        uiConversation.evtChecked.attach(
            async () => {

                if (wd.read.notificationCount(wdChat) || wd.read.lastSeenChat(this.wdInstance) !== wdChat) {

                    await wd.io.updateChat(wdChat, { "lastSeenTime": Date.now() });

                    this.uiPhonebook.notifyContactChanged(wdChat);

                }

            }
        );

        uiConversation.evtSendText.attach(
            async text => {

                let exactSendDate: Date;

                try {

                    exactSendDate = await this.ua.sendMessage(wdChat.contactNumber, text);

                } catch (error) {

                    alert(error.message);

                    return;

                }

                let wdMessageOutgoing = await wd.io.newMessage<Wd.Message.Outgoing>(
                    wdChat,
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
        );

    }

    private initUiHeader() {

        this.uiHeader! = new UiHeader(this.userSim);

        this.structure
            .find("div.id_header")
            .append(this.uiHeader.structure);


        this.uiHeader.evtUp.attach(
            () => this.evtUp.post()
        );


    }

    private initUiQuickAction() {

        this.uiQuickAction! = new UiQuickAction(this.userSim);

        this.structure
            .find("div.id_colLeft")
            .append(this.uiQuickAction.structure);

        this.uiQuickAction.evtSms.attach(
            async number => {

                let wdChat = await this.getOrCreateChatByPhoneNumber(number);

                this.uiPhonebook.triggerContactClick(wdChat);

            }
        );

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
                this.wdInstance,
                number,
                "",
                false
            );

            this.uiPhonebook.insertContact(wdChat);

            this.initUiConversation(wdChat);

            $('body').data('dynamic').panels();

        }

        return wdChat;

    }

}

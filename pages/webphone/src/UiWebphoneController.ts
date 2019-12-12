import { UiQuickAction } from "./UiQuickAction";
import { UiHeader } from "./UiHeader";
import { UiPhonebook } from "./UiPhonebook";
import { UiConversation } from "./UiConversation";
import { UiVoiceCall } from "./UiVoiceCall";
import { loadUiClassHtml } from "frontend-shared/dist/lib/loadUiClassHtml";
import * as wd from "frontend-shared/dist/lib/types/webphoneData/types";
import { phoneNumber } from "../../../local_modules/phone-number/dist/lib";
import { dialogApi } from "frontend-shared/dist/tools/modal/dialog";
import { Webphone } from "frontend-shared/dist/lib/Webphone";

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


    public constructor(private readonly webphone: Webphone) {

        const { userSim, wdChats, getIsSipRegistered } = webphone;

        this.uiVoiceCall = new UiVoiceCall(userSim);

        this.uiHeader = new UiHeader(userSim, getIsSipRegistered);

        this.uiQuickAction = new UiQuickAction(userSim, getIsSipRegistered);

        this.uiPhonebook = new UiPhonebook(userSim, wdChats);

        this.attachWebphoneEventHandlers();

        this.initUiHeader();

        this.initUiQuickAction();

        this.initUiPhonebook();

        $("body").data("dynamic").panels();

        setTimeout(() => this.uiPhonebook.triggerClickOnLastSeenChat(), 0);

    }


    private attachWebphoneEventHandlers() {

        this.webphone.wdEvts.evtNewUpdatedOrDeletedWdChat.attach(
            ({ eventType, wdChat }) => {

                switch (eventType) {
                    case "NEW":

                        this.uiPhonebook.insertContact(wdChat);

                        $('body').data('dynamic').panels();

                        this.getOrCreateUiConversation(wdChat);

                        break;
                    case "UPDATED":

                        this.uiPhonebook.notifyContactChanged(wdChat);

                        this.getOrCreateUiConversation(wdChat)
                            .notify()
                            ;

                        break;
                    case "DELETED":

                        this.uiPhonebook.notifyContactChanged(wdChat);

                        this.getOrCreateUiConversation(wdChat).structure.detach();

                        this._uiConversations.delete(wdChat);

                        this.uiPhonebook.triggerClickOnLastSeenChat();

                        break;
                }

            }
        );

        this.webphone.wdEvts.evtNewOrUpdatedWdMessage.attach(
            ({ wdChat, wdMessage }) => this.getOrCreateUiConversation(wdChat).newOrUpdatedMessage(wdMessage)
        );

        {

            const notify = (onlyHeader?: "ONLY HEADER") => {

                this.uiHeader.notify();

                if (!!onlyHeader) {
                    return;
                }

                this.uiQuickAction.notify();

                for (const uiConversation of this._uiConversations.values()) {

                    uiConversation.notify();

                }

            };

            this.webphone.evtUserSimUpdated.attach(
                event => notify(event === "cellSignalStrengthChange" ? "ONLY HEADER" : undefined)
            );

            this.webphone.evtIsSipRegisteredValueChanged.attach(() => notify());

        }




        this.webphone.evtIncomingCall.attach(
            async ({ wdChat, terminate, prTerminated, onAccepted }) => {

                this.uiPhonebook.triggerContactClick(wdChat);

                const { onTerminated, prUserInput } = this.uiVoiceCall.onIncoming(wdChat);

                prTerminated.then(() => onTerminated("Call ended"));


                prUserInput.then(ua => {

                    if (ua.userAction === "REJECT") {
                        terminate();
                        return;
                    }

                    const { onEstablished } = ua;

                    onAccepted().then(({ sendDtmf }) => {

                        const { evtUserInput } = onEstablished();

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

            const wdChat = await this.webphone.getAndOrCreateAndOrUpdateWdChat(number);

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
            this.webphone.userSim,
            this.webphone.getIsSipRegistered,
            wdChat,
            () => this.webphone.fetchOlderWdMessages(wdChat, 100)
        );


        this._uiConversations.set(wdChat, uiConversation);

        this.structure.find("div.id_colRight").append(uiConversation.structure);

        uiConversation.evtChecked.attach(
            () => this.webphone.updateWdChatLastMessageSeen(wdChat)
        );

        uiConversation.evtSendText.attach(
            text => this.webphone.sendMessage(wdChat, text)
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
                    await this.webphone.placeOutgoingCall(wdChat.contactNumber);

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

            await this.webphone.updateNameOfWdChatAndCreateOrUpdateCorespondingContactInSim(
                wdChat, name
            );

            dialogApi.dismissLoading();

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

            await this.webphone.deleteWdChatAndCorrespondingContactInSim(wdChat);

            dialogApi.dismissLoading();

        });

        return uiConversation;

    }



}

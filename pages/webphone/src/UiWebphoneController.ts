import { uiQuickActionDependencyInjection } from "./UiQuickAction";
import { UiHeader } from "./UiHeader";
import { UiPhonebook } from "./UiPhonebook";
import { UiConversation } from "./UiConversation";
import { loadUiClassHtml } from "frontend-shared/dist/lib/loadUiClassHtml";
import * as types from "frontend-shared/dist/lib/types";
import { phoneNumber } from "../../../local_modules/phone-number/dist/lib";
import { Webphone } from "frontend-shared/dist/lib/types/Webphone";
import { Evt } from "frontend-shared/node_modules/evt";

declare const require: any;

export function uiWebphoneControllerDependencyInjection(
    params: {
        dialogApi: typeof import("frontend-shared/dist/tools/modal/dialog").dialogApi;
    }
) {

    const { dialogApi } = params;

    const { UiQuickAction } = uiQuickActionDependencyInjection({ dialogApi });

    const html = loadUiClassHtml(
        require("../templates/UiWebphoneController.html"),
        "UiWebphoneController"
    );

    class UiWebphoneController {

        public readonly structure = html.structure.clone();

        private readonly uiHeader: UiHeader;
        private readonly uiQuickAction: import("./UiQuickAction").UiQuickAction
        private readonly uiPhonebook: UiPhonebook;

        public constructor(private readonly webphone: Webphone) {

            const {
                userSim,
                wdChats,
                wdEvts: { evtWdChat },
                userSimEvts,
                evtIsSipRegistered
            } = webphone;

            this.uiHeader = new UiHeader({ userSim, userSimEvts, evtIsSipRegistered });

            this.uiQuickAction = new UiQuickAction({ userSim, userSimEvts, evtIsSipRegistered });

            this.uiPhonebook = new UiPhonebook({ userSim, wdChats, evtWdChat });

            this.initUiHeader();

            this.initUiQuickAction();

            this.initUiPhonebook();

            $("body").data("dynamic").panels();

            setTimeout(() => this.uiPhonebook.triggerClickOnLastSeenChat(), 0);

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

                const wdChat = await this.webphone.getOrCreateWdChat({ "number_raw": number});

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

        private readonly getOrCreateUiConversation = (() => {

            const map = new WeakMap<types.wd.Chat, UiConversation>();

            return (wdChat: types.wd.Chat): UiConversation => {

                let uiConversation: UiConversation | undefined;

                {

                    uiConversation = map.get(wdChat);

                    if (uiConversation !== undefined) {
                        return uiConversation;
                    }

                }

                uiConversation = new UiConversation({
                    "userSim": this.webphone.userSim,
                    "userSimEvts": this.webphone.userSimEvts,
                    "evtIsSipRegistered": this.webphone.evtIsSipRegistered,
                    wdChat,
                    "evtUpdatedOrDeletedWdChat": this.webphone.wdEvts.evtWdChat.pipe(
                        Evt.getCtx(wdChat),
                        data =>
                            data.wdChat !== wdChat ?
                                null : data.eventType === "NEW" ?
                                    null : [
                                        data.eventType,
                                        data.eventType === "DELETED" ?
                                            { "DETACH": Evt.getCtx(wdChat) } :
                                            null
                                    ]
                    ),
                    "evtNewOrUpdatedMessage":
                        this.webphone.wdEvts.evtWdMessage.pipe(
                            Evt.getCtx(wdChat),
                            data => data.wdChat !== wdChat ?
                                null : [data.wdMessage]
                        ),
                    "fetchOlderWdMessages": () => this.webphone.fetchOlderWdMessages({ wdChat, "maxMessageCount": 30 })
                });


                map.set(wdChat, uiConversation);

                this.structure.find("div.id_colRight").append(uiConversation.structure);

                uiConversation.evtChecked.attach(
                    () => this.webphone.updateWdChatLastMessageSeen(wdChat)
                );

                uiConversation.evtSendText.attach(
                    text => this.webphone.sendMessage({ wdChat, text })
                );

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

                uiConversation.evtVoiceCall.attach(
                    () => this.webphone.placeOutgoingCall(wdChat)
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
                        return;
                    }

                    dialogApi.loading("Create or update contact");

                    await this.webphone.updateWdChatContactName({ wdChat, "contactName": name });

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

                    await this.webphone.deleteWdChat(wdChat);

                    dialogApi.dismissLoading();

                });

                return uiConversation;

            };

        })();


    }

    return { UiWebphoneController };





}




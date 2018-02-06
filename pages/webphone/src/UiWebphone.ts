import { VoidSyncEvent } from "ts-events-extended";

import { types } from "../../../api";

import { loadHtml } from "./loadHtml";
import * as wd from "./data";
import Wd = types.WebphoneData;

import { UiQuickAction } from "./UiQuickAction";
import { UiHeader } from "./UiHeader";
import { UiPhonebook } from "./UiPhonebook";
import { UiConversation } from "./UiConversation";

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


    constructor(
        public readonly userSim: types.UserSim.Usable,
        public readonly wdInstance: types.WebphoneData.Instance
    ) {

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

                //TODO: actualy send the text!
                await new Promise<void>(resolve => setTimeout(() => resolve(), 500));

                let wdMessageOutgoing = await wd.io.newMessage<Wd.Message.Outgoing>(
                    wdChat,
                    {
                        "id_": NaN,
                        "time": Date.now(),
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

                let wdChat = this.wdInstance.chats.find(
                    ({ contactNumber }) => contactNumber === number
                );

                if (wdChat) {

                    this.uiPhonebook.triggerContactClick(wdChat);

                } else {

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

}

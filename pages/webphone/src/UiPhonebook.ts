//NOTE: Slimscroll must be loaded on the page.

import { Evt } from "frontend-shared/node_modules/evt";
import { loadUiClassHtml } from "frontend-shared/dist/lib/loadUiClassHtml";
import * as types from "frontend-shared/dist/lib/types";
import { phoneNumber } from "frontend-shared/node_modules/phone-number";

declare const require: any;

const html = loadUiClassHtml(
    require("../templates/UiPhonebook.html"),
    "UiPhonebook"
);

export class UiPhonebook {

    public readonly structure = html.structure.clone();

    public readonly evtContactSelected = new Evt<{
        wdChatPrev: types.wd.Chat | undefined;
        wdChat: types.wd.Chat;
    }>();

    constructor(
        private readonly params: {
            userSim: types.UserSim.Usable;
            wdChats: types.wd.Chat[];
            evtWdChat: types.wd.Evts["evtWdChat"];
        }
    ) {

        this.structure.find("ul").slimScroll({
            "position": "right",
            "distance": '0px',
            "railVisible": true,
            "height": '290px',
            "size": "5px"
        });

        for (const wdChat of params.wdChats) {

            this.createUiContact(wdChat);

        }

        this.updateSearch();

        params.evtWdChat.attach(
            ({ eventType, wdChat }) => {

                switch (eventType) {
                    case "NEW":

                        this.insertContact(wdChat);

                        //$("body").data("dynamic").panels();


                        break;
                    case "UPDATED":

                        this.notifyContactChanged(wdChat);



                        break;
                    case "DELETED":

                        this.notifyContactChanged(wdChat);

                        this.triggerClickOnLastSeenChat();

                        break;
                }

            }
        );



    }

    public triggerClickOnLastSeenChat() {

        const wdChat = types.wd.Chat.findLastOpened(this.params.wdChats);

        if (!wdChat) {
            return;
        }

        this.uiContacts.get(wdChat.ref)!.evtClick.post();

    }


    /** mapped by wdChat.ref */
    private readonly uiContacts = new Map<string, UiContact>();

    private createUiContact(wdChat: types.wd.Chat) {

        let uiContact = new UiContact(this.params.userSim, wdChat);

        uiContact.evtClick.attach(() => {

            let uiContactPrev = Array.from(this.uiContacts.values())
                .find(({ isSelected }) => isSelected);

            let wdChatPrev: types.wd.Chat | undefined;

            if (uiContactPrev) {
                uiContactPrev.unselect();
                wdChatPrev = uiContactPrev.wdChat;
            } else {
                wdChatPrev = undefined;
            }

            uiContact.setSelected();
            //this.uiContacts.get(wdChat.id_)!.setSelected();

            this.evtContactSelected.post({ wdChatPrev, wdChat });

        });

        this.uiContacts.set(wdChat.ref, uiContact);

        this.placeUiContact(uiContact);

    }

    private updateSearch() {

        (this.structure.find("input") as any)
            .quicksearch(this.structure.find("ul li"));

        this.structure.find("ul").slimScroll({ "scrollTo": "0" });

    }

    private placeUiContact(uiContact: UiContact) {

        const getUiContactFromStructure = (li_elem: HTMLElement): UiContact => {

            for (const uiContact of this.uiContacts.values()) {

                if (uiContact.structure.get(0) === li_elem) {

                    return uiContact;

                }

            }

            throw new Error("UiContact not found");


        };

        const lis = this.structure.find("ul li");

        for (let i = 0; i < lis.length; i++) {

            const uiContact_i = getUiContactFromStructure(lis.get(i));

            if (types.wd.Chat.compare(uiContact.wdChat, uiContact_i.wdChat) >= 0) {


                uiContact.structure.insertBefore(uiContact_i.structure);

                return;

            }

        }

        this.structure.find("ul").append(uiContact.structure);

    }


    /** To create ui contact after init */
    private insertContact(
        wdChat: types.wd.Chat
    ): void {

        this.structure.find("input").val("");

        this.createUiContact(wdChat);

        this.updateSearch();

    }

    /** 
     * triggered by: evt on text input => update last seen => call 
     * OR
     * new message arrive => update wdMessage => call
     * OR
     * contact name changed
     * OR
     * contact deleted
     * */
    private notifyContactChanged(wdChat: types.wd.Chat) {

        const uiContact = this.uiContacts.get(wdChat.ref)!;

        if (this.params.wdChats.indexOf(wdChat) < 0) {

            uiContact.structure.detach();
            this.uiContacts.delete(wdChat.ref);

        } else {

            uiContact.refreshNotificationLabel();
            uiContact.updateContactName();

            this.placeUiContact(uiContact);

        }

        this.updateSearch();

    }

    public triggerContactClick(wdChat: types.wd.Chat) {
        this.uiContacts.get(wdChat.ref)!.evtClick.post();
    }

}

class UiContact {

    public readonly structure = html.templates.find("li").clone();

    /** only forward click event, need to be selected manually from outside */
    public readonly evtClick = Evt.create(); 

    constructor(
        public readonly userSim: types.UserSim.Usable,
        public readonly wdChat: types.wd.Chat
    ) {

        this.structure
            .on("click", () => {

                var selection = window.getSelection();

                //Do not trigger click if text selected.
                if (selection !== null && selection.toString().length !== 0) {
                    return;
                }

                this.evtClick.post();

            })
            .find(".id_number")
            .on("dblclick", e => {
                e.preventDefault();  //cancel system double-click event

                const selection = window.getSelection();
                const range = document.createRange();
                range.selectNodeContents(e.currentTarget);

                if (selection !== null) {

                    selection.removeAllRanges();
                    selection.addRange(range);

                }

            });


        this.updateContactName();

        this.structure.find("span.id_notifications").hide();

        this.refreshNotificationLabel();

    }

    //TODO: optimization
    public refreshNotificationLabel() {

        if (this.wdChat.messages.length) {
            this.structure.addClass("has-messages");
        } else {
            this.structure.removeClass("has-messages");
        }

        const count = types.wd.Chat.getUnreadMessagesCount(this.wdChat);

        const span = this.structure.find("span.id_notifications");

        span.html(`${count}`);

        if (count !== 0) {

            span.stop().fadeIn(0);

        } else {

            span.fadeOut(2000);

        }

    }

    //TODO: optimization
    /** updateName if different */
    public updateContactName() {

        this.structure.find("span.id_name").html(this.wdChat.contactName);

        let spanNumber = this.structure.find("span.id_number");

        let prettyNumber = phoneNumber.prettyPrint(
            this.wdChat.contactNumber,
            this.userSim.sim.country ?
                this.userSim.sim.country.iso : undefined
        );

        if (this.wdChat.contactName) {

            spanNumber
                .addClass("visible-lg-inline")
                .html(prettyNumber)
                ;

        } else {

            spanNumber
                .removeClass("visible-lg-inline")
                .html(prettyNumber)
                ;

        }

    }

    /** update wsChat */
    public setSelected() {
        this.structure.addClass("selected");
    }

    /** default state */
    public unselect() {
        this.structure.removeClass("selected");
    }

    public get isSelected(): boolean {
        return this.structure.hasClass("selected");
    }


}

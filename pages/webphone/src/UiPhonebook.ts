import { SyncEvent } from "ts-events-extended";
import { loadHtml } from "./loadHtml";
import { VoidSyncEvent } from "ts-events-extended";
import { types } from "../../../api";
import { read as wdr } from "./data";
import { phoneNumber } from "../../../shared";
import Wd = types.WebphoneData;

declare const require: any;

const html = loadHtml(
    require("../templates/UiPhonebook.html"),
    "UiPhonebook"
);

export class UiPhonebook {

    public readonly structure = html.structure.clone();

    public readonly evtContactSelected = new SyncEvent<{
        wdChatPrev: Wd.Chat | undefined;
        wdChat: Wd.Chat;
    }>();

    constructor(
        public readonly userSim: types.UserSim.Usable,
        public readonly wdInstance: Wd.Instance
    ) {

        this.structure.find("ul").slimScroll({
            "position": "right",
            "distance": '0px',
            "railVisible": true,
            "height": '290px',
            "size": "5px"
        });

        for (let wdChat of this.wdInstance.chats) {

            this.createUiContact(wdChat);

        }

        this.updateSearch();

        setTimeout(() => {

            let wdChat = wdr.lastSeenChat(this.wdInstance);

            if (!wdChat) return;

            this.uiContacts.get(wdChat)!.evtClick.post();

        }, 0);

    }


    private readonly uiContacts = new Map<Wd.Chat, UiContact>();

    private createUiContact(wdChat: Wd.Chat) {

        let uiContact = new UiContact(this.userSim, wdChat);

        uiContact.evtClick.attach(() => {

            let uiContactPrev = Array.from(this.uiContacts.values())
                .find(({ isSelected }) => isSelected);

            let wdChatPrev: Wd.Chat | undefined;

            if (uiContactPrev) {
                uiContactPrev.unselect();
                wdChatPrev = uiContactPrev.wdChat;
            } else {
                wdChatPrev = undefined;
            }

            this.uiContacts.get(wdChat)!.setSelected();

            this.evtContactSelected.post({ wdChatPrev, wdChat });

        });

        this.uiContacts.set(wdChat, uiContact);

        this.placeUiContact(uiContact);

    }

    private updateSearch() {

        (this.structure.find("input") as any)
            .quicksearch(this.structure.find("ul li"));

        this.structure.find("ul").slimScroll({ "scrollTo": "0" });

    }

    private placeUiContact(
        uiContact: UiContact
    ) {

        let lis = this.structure.find("ul li");

        let uiContactsArr = Array.from(this.uiContacts.values());

        let getUiContact_i = i => uiContactsArr.find(
            ({ structure }) => structure.get(0) === lis.get(i)
        )!;

        let newerMessageTime = wdr.newerMessageTime(uiContact.wdChat);

        for (let i = 0; i < lis.length; i++) {

            let uiContact_i = getUiContact_i(i);

            if (uiContact_i === uiContact) {
                continue;
            }

            let newerMessageTime_i = wdr.newerMessageTime(uiContact_i.wdChat);

            if (newerMessageTime > newerMessageTime_i) {

                uiContact.structure.insertBefore(uiContact_i.structure);

                return;

            } else if (newerMessageTime === newerMessageTime_i) {

                let contactName = uiContact.wdChat.contactName;

                let contactName_i = uiContact_i.wdChat.contactName;

                let doInsert: boolean;

                if (contactName === "" && contactName_i === "") {

                    doInsert = true;

                } else if (contactName === "") {

                    doInsert = false;

                } else if (contactName_i === "") {

                    doInsert = true;

                } else {

                    doInsert = isAscendingAlphabeticalOrder(
                        contactName,
                        contactName_i
                    );

                }

                if (doInsert) {

                    uiContact.structure.insertBefore(uiContact_i.structure);

                    return;

                }

            }

        }

        this.structure.find("ul").append(uiContact.structure);

    }

    /** To create ui contact after init */
    public insertContact(
        wdChat: Wd.Chat
    ): void {

        this.structure.find("input").val("");

        this.createUiContact(wdChat);

        this.updateSearch();

        //this.uiContacts.get(wdChat)!.evtClick.post();

    }

    /** 
     * triggered by: evt on text input => update last seen => call 
     * OR
     * new message arrive => update wdMessage => call
     * 
     * */
    public notifyContactChanged(wdChat: Wd.Chat) {

        let uiContact = this.uiContacts.get(wdChat)!;

        uiContact.refreshNotificationLabel();
        uiContact.updateContactName();

        this.placeUiContact(uiContact);

    }

    public triggerContactClick(wdChat: Wd.Chat){
        this.uiContacts.get(wdChat)!.evtClick.post();
    }


}

class UiContact {

    public readonly structure = html.templates.find("li").clone();

    /** only forward click event, need to be selected manually from outside */
    public evtClick = new VoidSyncEvent();

    constructor(
        public readonly userSim: types.UserSim.Usable,
        public readonly wdChat: Wd.Chat
    ) {

        this.structure.on("click", () => this.evtClick.post());

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

        let count = wdr.notificationCount(this.wdChat);

        let span = this.structure.find("span.id_notifications");

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
                .html(` ( ${prettyNumber} ) `)
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



function isAscendingAlphabeticalOrder(
    a: string,
    b: string
): boolean {

    if (!a || !b) {
        return a.length < b.length;
    }

    let getWeight = (str: string): number => {

        let val = str.charAt(0).toLowerCase().charCodeAt(0);

        if (!(96 < val && val < 123)) {
            return 123;
        }

        return val;

    }

    let vA = getWeight(a);
    let vB = getWeight(b);

    if (vA === vB) {
        return isAscendingAlphabeticalOrder(a.substr(1), b.substr(1));
    }

    return vA < vB;

}

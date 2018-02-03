import { SyncEvent } from "ts-events-extended";
import { loadHtml } from "./loadHtml";
import { VoidSyncEvent } from "ts-events-extended";
import { update } from "autosize";
import { types } from "../../../api";
import * as wds from "./webphoneDataSync";

declare const require: any;

const html = loadHtml(
    require("../templates/UiPhonebook.html"),
    "UiPhonebook"
);

import wd= types.WebphoneData;
import { phoneNumber } from "../../../shared/dist/phoneNumber";

export class UiPhonebook {

    public readonly structure= html.structure.clone();
    private readonly templates= html.templates.clone();

    public readonly evtContactSelected = new SyncEvent<wd.Chat>();

    constructor(
        public readonly userSim: types.UserSim.Usable,
        public readonly wdInstance: wd.Instance
    ) {

        this.structure.find("ul").slimScroll({
            "position": "right",
            "distance": '0px',
            "railVisible": true,
            "height": '400px',
            "size": "5px"
        });

        for( let wdChat of this.wdInstance.chats ){

            this.insertUiContact(wdChat);

        }

        this.updateSearch();

        setTimeout(()=>{

            let wdChat= wds.getLastSeenChat(this.wdInstance);
            
            if( !wdChat ) return;

            this.uiContacts.get(wdChat)!.evtClick.post();

        }, 0);

    }


    private readonly uiContacts= new Map<wd.Chat, UiPhonebook.UiContact>();

    private insertUiContact(wdChat: wd.Chat){

        let uiContact = new UiPhonebook.UiContact(this.userSim, wdChat);


        uiContact.evtClick.attach(async () => {

            let uiContactPrev= Array.from(this.uiContacts.values()).find(
                uiContact=> uiContact.isSelected
            );

            if( uiContactPrev ){
                uiContactPrev.unselect();
            }
            
            this.uiContacts.get(wdChat)!.setSelected();

            this.evtContactSelected.post(wdChat);

        });

        this.uiContacts.set(wdChat, uiContact);

        this.placeUiContact(uiContact);

    }

    private updateSearch() {

        (this.structure.find("input") as any)
            .quicksearch(this.structure.find("il li"));

        this.structure.find("ul").slimScroll({ "scrollTo": "0" });

    }


    private placeUiContact(
        uiContact: UiPhonebook.UiContact
    ) {

        let newerMessageTime= wds.getNewerMessageTime(uiContact.wdChat);

        let lis = this.structure.find("ul li");

        for (let i = 0, len = lis.length; i < len; i++) {

            let uiContact_i = Array.from(this.uiContacts.values()).find(
                ({ structure }) => structure.get(0) === lis.get(i)
            )!;

            if (uiContact_i === uiContact) {
                continue;
            }

            let newerMessageTime_i= wds.getNewerMessageTime(uiContact_i.wdChat);


            if (newerMessageTime > newerMessageTime_i) {

                uiContact.structure.insertBefore(uiContact_i.structure);

                return;

            } else if (newerMessageTime === newerMessageTime_i) {

                let contactName= uiContact.wdChat.contactName;

                let contactName_i= uiContact.wdChat.contactName;

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

    public async newContact(
        contactNumber: phoneNumber,
        contactName: string,
        shouldStoreInSim: boolean
    ): Promise<wd.Chat>{


        let wdChat= await wds.newChat(
            this.wdInstance, 
            contactNumber, 
            contactName, 
            shouldStoreInSim
        );

        this.insertUiContact(wdChat);

        this.updateSearch();

        return wdChat;

    }

    /** 
     * triggered by: evt on text input => update last seen => call 
     * OR
     * new message arrive => update wdMessage => call
     * 
     * */
    public refreshNotificationCount(wdChat: wd.Chat){

        this.uiContacts.get(wdChat)!.refreshNotificationLabel();

        this.placeUiContact( this.uiContacts.get(wdChat)!);

    }

    /** Will update wdChat */
    public async updateContactName(wdChat: wd.Chat, contactName: string){

        await this.uiContacts.get(wdChat)!.updateContactName(contactName);

        this.placeUiContact( this.uiContacts.get(wdChat)! );
    }

}

export namespace UiPhonebook {

    export class UiContact {

        public readonly structure: JQuery;

        /** only forward click event, need to be selected manually from outside */
        public evtClick = new VoidSyncEvent();

        constructor(
            public readonly userSim: types.UserSim.Usable,
            public readonly wdChat: wd.Chat,
        ) {

            this.structure = html.templates.find("li").clone();

            this.structure.on("click", ()=> this.evtClick.post());

            this.updateContactName(this.wdChat.contactName);

            this.structure.find("span.id_notifications").fadeOut(0);

            this.refreshNotificationLabel();

        }

        public refreshNotificationLabel() {

            if( this.wdChat.messages.length ){
                this.structure.addClass("has-messages");
            }else{
                this.structure.removeClass("has-messages");
            }

            let count= wds.getNotificationCount(this.wdChat);

            let span = this.structure.find("span.id_notifications");
            
            span.html(`${count}`);
            
            if( count !== 0 ){

                span.stop().fadeIn(0);

            }else{

                span.fadeOut(2000);

            }

        }

        /** updateName if different */
        public async updateContactName(contactName: string) {

            if (this.wdChat.contactName !== contactName) {

                await wds.updateChat(
                    this.wdChat,
                    { "contactName": contactName }
                );

            }

            this.structure.find("span.id_name").html(contactName);

            let spanNumber = this.structure.find("span.id_number");

            let prettyNumber = phoneNumber.prettyPrint(
                this.wdChat.contactNumber,
                this.userSim.sim.country ?
                    this.userSim.sim.country.iso : undefined
            )

            if (contactName) {

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

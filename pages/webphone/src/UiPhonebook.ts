import { SyncEvent } from "ts-events-extended";
import { loadHtml } from "./loadHtml";
import { VoidSyncEvent } from "ts-events-extended";
import { update } from "autosize";
declare const require: any;

const html = loadHtml(
    require("../templates/UiPhonebook.html"),
    "UiPhonebook"
);


export class UiContacts {

    public readonly structure= html.structure.clone();
    private readonly templates= html.templates.clone();

    public readonly evtContactSelected = new SyncEvent<Contact>();

    constructor(
        public readonly data: UiPhonebook.Data
    ) {

        this.structure.find("ul").slimScroll({
            "position": "right",
            "distance": '0px',
            "railVisible": true,
            "height": '400px',
            "size": "5px"
        });

        for (let contact of this.data.contacts ) {
            this.insertUiContact(contact);
        }

        this.updateSearch();

    }


    private readonly uiContacts= new Map<Contact, UiPhonebook.UiContact>();

    private insertUiContact(contact: Contact){

        let uiContact = new UiPhonebook.UiContact(
            { contact, "simCountry": this.data.simCountry }
        );

        uiContact.evtClick.attach(() => {


            let currentlySelectedUiContact= this.uiContacts.find(
                ({ isSelected }) => isSelected
            );

            if (currentlySelectedUiContact) {
                currentlySelectedUiContact.updateIsSelected(false);
            }

            uiContact.updateIsSelected(true);

            this.evtContactSelected.post(uiContact.data.contact);

        });

        this.uiContacts.push(uiContact);

        this.updateUiContactPosition(uiContact);

    }

    private updateSearch() {

        (this.structure.find("input") as any).quicksearch(this.structure.find("il li"));

        this.structure.find("ul").slimScroll({ "scrollTo": "0" });

    }


    private updateUiContactPosition(uiContact: UiPhonebook.UiContact) {

        let lis = this.structure.find("ul li");

        let { timestamp } = uiContact.data.contact;
        let name = uiContact.data.contact.name;

        for (let i = 0, len = lis.length; i < len; i++) {

            let uiContact_i = this.uiContacts.find(
                ({ structure }) => structure.get(0) === lis.get(i)
            )!;

            if (uiContact_i === uiContact) {
                continue;
            }

            let timestamp_i = uiContact_i.data.contact.timestamp;

            if (timestamp > timestamp_i) {

                uiContact.structure.insertBefore(uiContact_i.structure);

                return;

            } else if (timestamp === timestamp_i) {

                let name_i = uiContact_i.data.contact.name;

                let doInsert: boolean;

                if (name === undefined && name_i === undefined) {

                    doInsert = true;

                } else if (name === undefined) {

                    doInsert = false;

                } else if (name_i === undefined) {

                    doInsert = true;

                } else {

                    doInsert = isAscendingAlphabeticalOrder(name, name_i);

                }

                if (doInsert) {

                    uiContact.structure.insertBefore(uiContact_i.structure);

                    return;

                }

            }

        }

        this.structure.find("ul").append(uiContact.structure);

    }

    public newContact(
        contactNumber: string,
        contactName: string | undefined,
        isStoredInSim: boolean
    ) {

        let contact: Contact = {
            "number": contactNumber,
            "name": contactName,
            "timestamp": 0,
            "missedCallCount": 0,
            "unreadMessageCount": 0,
            isStoredInSim
        };

        //TODO: update remote
        this.data.contacts.push(contact);

        this.insertUiContact(contact);

        this.updateSearch();

    }

    //TODO: updateSearch?
    public deleteContact(contact: Contact) {

        let uiContact = this.getUiContactByNumber(contactNumber);

        uiContact.structure.remove();

        this.uiContacts.splice(
            this.uiContacts.indexOf(uiContact), 1
        );

        //TODO: sync remote
        this.data.contacts.splice(
            this.data.contacts.indexOf(uiContact.data.contact), 1
        );

        this.updateSearch();

    }



}

export namespace UiPhonebook {

    export type Data = {
        readonly contacts: Contact[];
        readonly simCountry: string;
    };

    export class UiContact {

        public readonly structure: JQuery;

        public readonly formatedNumber: string;

        public evtClick = new VoidSyncEvent();

        private evtUpdated = new VoidSyncEvent();

        constructor(
            public readonly data: UiContact.Data
        ) {

            this.structure = html.templates.find("li").clone();

            this.formatedNumber = (intlTelInputUtils as any).formatNumber(
                this.data.contact.number,
                null,
                isNumberFromCountry(this.data.contact.number, this.data.simCountry) ?
                    intlTelInputUtils.numberFormat.NATIONAL :
                    intlTelInputUtils.numberFormat.INTERNATIONAL
            );

            this.updateName(this.data.contact.name);


        }

        public updateLastActivity(time: number) {

            if (time) {

                //TODO: class should be lowercase
                this.structure.addClass("chatData");

            }

            this.data.contact.timestamp = time;

            this.evtUpdated.post();

        }


        public updateUnreadMessageCount(count: number) {

            console.assert(count >= 0);

            if (count > 0) {

                this.structure
                    .find("span.id_unreadMessages")
                    .html(`${count}`)
                    .stop()
                    .fadeIn(0)
                    ;

            } else {

                this.structure
                    .find("span.id_unreadMessages")
                    .fadeOut(2000)
                    ;

            }

            var previousCount = this.data.contact.unreadMessageCount;

            this.data.contact.unreadMessageCount = count;

            if (count > previousCount) {

                this.updateLastActivity(Date.now());

            }

        }


        public updateName(name: string | undefined) {

            this.structure.find("span.id_name").html(name || "");

            let spanNumber = this.structure.find("span.id_number");

            if (name) {

                spanNumber
                    .addClass("visible-lg-inline")
                    .html(` ( ${this.formatedNumber} ) `)
                    ;

            } else {

                spanNumber
                    .removeClass("visible-lg-inline")
                    .html(this.formatedNumber)
                    ;

            }

            this.data.contact.name = name;

        }

        public updateIsSelected(isSelected: boolean) {

            if (isSelected) {
                this.structure.addClass("selected");
            } else {
                this.structure.removeClass("selected");
            }

            this.__isSelected__ = isSelected;

        }

        public get isSelected() {
            return this.__isSelected__;
        }

    }

    export namespace UiContact {
        export type Data = {
            readonly contact: Contact;
            readonly simCountry: string;
        };
    }

}

export type Contact = {
    number: { e164: string; prettyPrint: string; };
    name: string | undefined;
    unreadMessageCount: number;
    missedCallCount: number;
    isStoredInSim: boolean;
    timestamp: number;
    isSelected: false;
    messages: any;
};

function isNumberFromCountry(
    numberE164: string,
    countryIso2: string
): boolean {

    try {

        for (let countryData of $.fn.intlTelInput.getCountryData()) {

            if (countryData.iso2 === countryIso2.toLowerCase()) {

                return (numberE164.substring(1, countryData.dialCode.length + 1) === countryData.dialCode);

            }

        }

    } catch (error) {
        console.log("isNumberFromCountry error", error);
    }

    return false;

}

function isAscendingAlphabeticalOrder(a: string, b: string): boolean {

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
        return this.compareString(a.substr(1), b.substr(1));
    }

    return vA < vB;

}

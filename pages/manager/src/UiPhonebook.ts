//NOTE: Slimscroll must be loaded on the page.

import * as types from "../../../shared/dist/lib/types";
import { baseDomain } from "../../../shared/dist/lib/toBackend/connection";
import { SyncEvent, VoidSyncEvent } from "ts-events-extended";
import * as bootbox_custom from "../../../shared/dist/lib/tools/bootbox_custom";
import * as modal_stack from "../../../shared/dist/lib/tools/modal_stack";
import { isAscendingAlphabeticalOrder } from "../../../shared/dist/lib/tools/isAscendingAlphabeticalOrder";
import { loadUiClassHtml } from "../../../shared/dist/lib/loadUiClassHtml";
import { phoneNumber } from "phone-number";

declare const require: any;

const html = loadUiClassHtml(
    require("../templates/UiPhonebook.html"),
    "UiPhonebook"
);

export class UiPhonebook {

    public readonly structure = html.structure.clone();

    private readonly buttonClose = this.structure.find(".id_close");
    private readonly buttonEdit = this.structure.find(".id_edit");
    private readonly buttonDelete = this.structure.find(".id_delete");
    private readonly buttonCreateContact = this.structure.find(".id_createContact");
    //private readonly divsToHideIfNoContacts = this.structure.find("._toHideIfNoContacts");


    public evtClickCreateContact = new SyncEvent<{
        name: string;
        number: phoneNumber;
        onSubmitted: (contact: types.UserSim.Contact) => void;
    }>();

    public evtClickDeleteContacts = new SyncEvent<{
        contacts: types.UserSim.Contact[];
        onSubmitted: () => void;
    }>();

    public evtClickUpdateContactName = new SyncEvent<{
        contact: types.UserSim.Contact;
        newName: string;
        onSubmitted: () => void;
    }>();

    public readonly hideModal: () => Promise<void>;
    public readonly showModal: () => Promise<void>;

    public static isPhoneNumberUtilityScriptLoaded = false;

    /** Fetch phone number utils, need to be called before instantiating objects */
    public static async fetchPhoneNumberUtilityScript() {

        console.assert(!this.isPhoneNumberUtilityScriptLoaded);

        await phoneNumber.remoteLoadUtil(
            `//web.${baseDomain}/plugins/ui/intl-tel-input/js/utils.js`
        );

        this.isPhoneNumberUtilityScriptLoaded = true;

    }


    constructor(public readonly userSim: types.UserSim.Usable) {

        {

            const { hide, show } = modal_stack.add(
                this.structure,
                {
                    "keyboard": false,
                    "backdrop": true
                }
            );

            this.hideModal = hide;
            this.showModal = show;

        }

        for (const contact of userSim.phonebook) {

            this.createUiContact(contact);

        }

        this.structure.find("ul").slimScroll({
            "position": "right",
            "distance": '0px',
            "railVisible": true,
            "alwaysVisible": true,
            "height": '290px',
            "size": "5px"
        });

        this.updateSearch();
        this.updateButtons();

        this.buttonClose.on("click", () => this.hideModal());

        this.buttonDelete.on("click", () => this.interact_deleteContacts());

        this.buttonEdit.on("click", ()=> this.interact_updateContact());

        this.buttonCreateContact.on("click", () => this.interact_createContact());

    }


    //TODO: Make sure contact ref is kept.
    /** mapped by types.UserSim.Contact */
    private readonly uiContacts = new Map<types.UserSim.Contact, UiContact>();

    /** to call (outside of the class) when sim online status change */
    public updateButtons() {

        [
            this.buttonClose,
            this.buttonCreateContact,
            this.buttonDelete,
            this.buttonEdit
        ].forEach(button => button.prop("disabled", !this.userSim.isOnline));

        const selectedCount = Array.from(this.uiContacts.values())
            .filter(uiContact => uiContact.isSelected).length;

        if (selectedCount === 0) {

            this.buttonCreateContact.show();
            this.buttonDelete.hide();
            this.buttonEdit.hide();

        } else {

            this.buttonCreateContact.hide();

            if (selectedCount === 1) {

                this.buttonEdit.show();

            } else {

                this.buttonEdit.hide();

            }

            this.buttonDelete.show();

            this.buttonDelete.find("span").html(`(${selectedCount})`);

        }


    }

    private createUiContact(contact: types.UserSim.Contact) {

        const uiContact = new UiContact(this.userSim, contact);

        uiContact.evtClick.attach(() => {

            if (uiContact.isSelected) {
                uiContact.unselect();
            } else {
                uiContact.setSelected();
            }

            this.updateButtons();

        });

        this.uiContacts.set(contact, uiContact);

        this.placeUiContact(uiContact);

    }

    private placeUiContact(uiContact: UiContact) {

        const getUiContactFromStructure = (li_elem: HTMLElement): UiContact => {

            //for (const uiContact of this.uiContacts.values()) { with downlevel iteration...
            for (const uiContact of Array.from(this.uiContacts).map(([_, v]) => v)) {

                if (uiContact.structure.get(0) === li_elem) {

                    return uiContact;

                }

            }

            throw new Error("UiContact not found");


        };

        const lis = this.structure.find("ul li");

        for (let i = 0; i < lis.length; i++) {

            const uiContact_i = getUiContactFromStructure(lis.get(i));

            if (this.compareContact(uiContact.contact, uiContact_i.contact) >= 0) {

                uiContact.structure.insertBefore(uiContact_i.structure);

                return;

            }

        }

        this.structure.find("ul").append(uiContact.structure);

    }

    private compareContact(
        contact1: types.UserSim.Contact,
        contact2: types.UserSim.Contact
    ): -1 | 0 | 1 {

        const hasContactName = (contact: types.UserSim.Contact) => contact.name !== "";

        if (hasContactName(contact1) || hasContactName(contact1)) {

            if (!hasContactName(contact1)) {
                return -1;
            }

            if (!hasContactName(contact2)) {
                return 1;
            }

            return isAscendingAlphabeticalOrder(
                contact1.name, contact2.name
            ) ? 1 : -1;

        } else {

            return contact1.number_raw < contact2.number_raw ? -1 : 1;

        }

    }

    private updateSearch() {

        (this.structure.find("input") as any)
            .quicksearch(this.structure.find("ul li"));

        this.structure.find("ul").slimScroll({ "scrollTo": "0" });

    }

    /** To create ui contact after init */
    public insertContact(contact: types.UserSim.Contact): void {

        this.structure.find("input").val("");

        this.createUiContact(contact);

        this.updateSearch();

    }

    /** 
     * 
     * Only call outside of the class when other user updated the contact.
     * 
     * contact name changed
     * OR
     * contact deleted
     * */
    public notifyContactChanged(contact: types.UserSim.Contact) {

        const uiContact = this.uiContacts.get(contact)!;

        if (this.userSim.phonebook.indexOf(contact) < 0) {

            uiContact.structure.detach();
            this.uiContacts.delete(contact);

        } else {

            uiContact.updateContactName();

            this.placeUiContact(uiContact);

        }

    }


    /** 
     * Trigger ui process to create a contact.
     * External call when create contact from 
     * android app, provide number.
     * Internally when button is clicked no number provided.
     */
    public async interact_createContact(provided_number?: phoneNumber) {

        const userSim = this.userSim;

        const number = provided_number || await new Promise<phoneNumber | undefined>(
            function callee(resolve) {

                const modal = bootbox_custom.prompt({
                    "title": `Phone number`,
                    "size": "small",
                    "callback": async result => {

                        if (result === null) {
                            resolve(undefined);
                            return;
                        }

                        const number = phoneNumber.build(
                            input.val(),
                            input.intlTelInput("getSelectedCountryData").iso2
                        );

                        if (!phoneNumber.isDialable(number)) {

                            await new Promise(
                                resolve_ => bootbox_custom.alert(
                                    `${number} is not a valid phone number`,
                                    () => resolve_()
                                )
                            );

                            callee(resolve);

                            return;

                        }

                        resolve(number);

                    },
                });

                modal.find(".bootbox-body").css("text-align", "center");

                const input = modal.find("input");

                input.intlTelInput((() => {

                    const simIso = userSim.sim.country ? userSim.sim.country.iso : undefined;
                    const gwIso = userSim.gatewayLocation.countryIso;

                    const intlTelInputOptions: IntlTelInput.Options = {
                        "dropdownContainer": "body"
                    };

                    const preferredCountries: string[] = [];

                    if (simIso) {
                        preferredCountries.push(simIso);
                    }

                    if (gwIso && simIso !== gwIso) {
                        preferredCountries.push(gwIso);
                    }

                    if (preferredCountries.length) {
                        intlTelInputOptions.preferredCountries = preferredCountries;
                    }

                    if (simIso || gwIso) {
                        intlTelInputOptions.initialCountry = simIso || gwIso;
                    }

                    return intlTelInputOptions;

                })());

            }
        );

        if (!number) {
            return;
        }

        const contact = userSim.phonebook.find(
            ({ number_raw }) => phoneNumber.areSame(
                number,
                number_raw
            )
        );

        const name = await new Promise<string | null>(
            resolve => bootbox_custom.prompt({
                "title": `Create contact ${phoneNumber.prettyPrint(number)} in ${this.userSim.friendlyName} internal memory`,
                "value": !!contact ? contact.name : "New contact",
                "callback": result => resolve(result),
            })
        );

        if (!name) {
            return;
        }

        if( !this.userSim.isOnline ){

            await new Promise(resolve=> 
                bootbox_custom.alert(
                    `Can't proceed, ${this.userSim.friendlyName} no longer online`,
                    ()=> resolve()
                )
            );

            return;

        }

        if (!contact) {

            bootbox_custom.loading("Creating contact...");

            const contact = await new Promise<types.UserSim.Contact>(resolve =>
                this.evtClickCreateContact.post({
                    name,
                    number,
                    "onSubmitted": contact => resolve(contact)
                })
            );

            this.createUiContact(contact);

        } else {

            if (contact.name === name) {
                return;
            }

            bootbox_custom.loading(
                "Updating contact name..."
            );

            await new Promise(resolve =>
                this.evtClickUpdateContactName.post({
                    contact,
                    "newName": name,
                    "onSubmitted": () => resolve()
                })
            );

            this.notifyContactChanged(contact);

        }

        bootbox_custom.dismissLoading();

    }

    public async interact_deleteContacts(provided_number?: phoneNumber) {

        const contacts: types.UserSim.Contact[] = (() => {

            if (provided_number !== undefined) {

                const contact = this.userSim.phonebook.find(
                    ({ number_raw }) => phoneNumber.areSame(
                        provided_number,
                        number_raw
                    )
                )!;

                return [contact];

            } else {

                return Array.from(this.uiContacts.values())
                    .filter(uiContact => uiContact.isSelected)
                    .map(uiContact => uiContact.contact)
                    ;

            }

        })();

        const isConfirmed = await new Promise<boolean>(resolve =>
            bootbox_custom.confirm({
                "size": "small",
                "message": [
                    "Are you sure you want to delete",
                    contacts.map(({ name }) => name).join(" "),
                    `from ${this.userSim.friendlyName} internal storage ?`
                ].join(" "),
                "callback": result => resolve(result)
            })
        );

        if (!isConfirmed) {
            return;
        }

        if( !this.userSim.isOnline ){

            await new Promise(resolve=> 
                bootbox_custom.alert(
                    `Can't delete, ${this.userSim.friendlyName} no longer online`,
                    ()=> resolve()
                )
            );

            return;

        }

        bootbox_custom.loading("Deleting contacts...");

        await new Promise(resolve =>
            this.evtClickDeleteContacts.post({
                contacts,
                "onSubmitted": () => resolve()
            })
        );

        for (const contact of contacts) {

            this.notifyContactChanged(contact);

        }

        this.updateButtons();

        bootbox_custom.dismissLoading();

    }

    public async interact_updateContact(provided_number?: phoneNumber) {

        const contact = provided_number !== undefined ?
            this.userSim.phonebook.find(
                ({ number_raw }) => phoneNumber.areSame(
                    provided_number,
                    number_raw
                )
            )! :
            Array.from(this.uiContacts.values())
                .find(uiContact => uiContact.isSelected)!.contact
            ;


        const prettyNumber = phoneNumber.prettyPrint(
            phoneNumber.build(
                contact.number_raw,
                !!this.userSim.sim.country ?
                    this.userSim.sim.country.iso :
                    undefined
            )
        );

        const newName = await new Promise<string | null>(
            resolve => bootbox_custom.prompt({
                "title": `New contact name for ${prettyNumber} stored in ${this.userSim.friendlyName}`,
                "value": contact.name,
                "callback": result => resolve(result),
            })
        );

        if (!newName || contact.name === newName) {
            return;
        }

        if( !this.userSim.isOnline ){

            await new Promise(resolve=> 
                bootbox_custom.alert(
                    `Can't update, ${this.userSim.friendlyName} no longer online`,
                    ()=> resolve()
                )
            );

            return;

        }

        bootbox_custom.loading("Updating contact name ...");

        await new Promise(resolve =>
            this.evtClickUpdateContactName.post({
                contact,
                newName,
                "onSubmitted": () => resolve()
            })
        );

        bootbox_custom.dismissLoading();

        this.notifyContactChanged(contact);

    }


}

class UiContact {

    public readonly structure = html.templates.find("li").clone();

    /** only forward click event, need to be selected manually from outside */
    public evtClick = new VoidSyncEvent();

    constructor(
        public readonly userSim: types.UserSim.Usable,
        public readonly contact: types.UserSim.Contact
    ) {

        this.structure
            .on("click", () => {

                var selection = window.getSelection();

                //Do not trigger click if text selected.
                if (selection.toString().length !== 0) {
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
                selection.removeAllRanges();
                selection.addRange(range);

            });

        this.updateContactName();

        this.structure.find("span.id_notifications").hide();

    }


    //TODO: optimization
    /** updateName if different */
    public updateContactName() {

        this.structure.find("span.id_name").html(this.contact.name);

        this.structure
            .find("span.id_number")
            .html(() => {

                const iso = this.userSim.sim.country ?
                    this.userSim.sim.country.iso : undefined

                return phoneNumber.prettyPrint(
                    phoneNumber.build(
                        this.contact.number_raw,
                        iso
                    ),
                    iso
                );


            })

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



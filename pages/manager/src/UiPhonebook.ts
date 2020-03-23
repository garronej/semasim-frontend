//NOTE: Slimscroll must be loaded on the page.

import * as types from "frontend-shared/dist/lib/types/userSim";
import { env } from "frontend-shared/dist/lib/env";
import { VoidEvt } from "frontend-shared/node_modules/evt";
import { assert } from "frontend-shared/dist/tools/typeSafety/assert";
import { isAscendingAlphabeticalOrder } from "frontend-shared/dist/tools/isAscendingAlphabeticalOrder";
import { loadUiClassHtml } from "frontend-shared/dist/lib/loadUiClassHtml";
import { phoneNumber } from "frontend-shared/node_modules/phone-number";
import { Polyfill as WeakMap } from "minimal-polyfills/dist/lib/WeakMap";
import { NonPostableEvts } from "frontend-shared/dist/tools/NonPostableEvts";

declare const require: any;

type DialogApi = import("frontend-shared/dist/tools/modal/dialog").DialogApi;

type UserSimEvts = Pick<
    NonPostableEvts<import("frontend-shared/dist/lib/types/userSim").UserSim.Usable.Evts.ForSpecificSim>,
    "evtReachabilityStatusChange" |
    "evtNewUpdatedOrDeletedContact" |
    "evtDelete"
>;


export type UiPhonebook = InstanceType<ReturnType<typeof uiPhonebookDependencyInjection>["UiPhonebook"]>;

export function uiPhonebookDependencyInjection(
    params: {
        startMultiDialogProcess: typeof import("frontend-shared/dist/tools/modal/dialog").startMultiDialogProcess;
        createModal: typeof import("frontend-shared/dist/tools/modal").createModal;
    }
) {

    const { startMultiDialogProcess, createModal } = params;

    const html = loadUiClassHtml(
        require("../templates/UiPhonebook.html"),
        "UiPhonebook"
    );

    //Object.assign(window, { dialogApi });

    class UiPhonebook {

        public readonly structure = html.structure.clone();

        private readonly buttonClose = this.structure.find(".id_close");
        private readonly buttonEdit = this.structure.find(".id_edit");
        private readonly buttonDelete = this.structure.find(".id_delete");
        private readonly buttonCreateContact = this.structure.find(".id_createContact");
        //private readonly divsToHideIfNoContacts = this.structure.find("._toHideIfNoContacts");

        public readonly hideModal: () => Promise<void>;
        public readonly showModal: () => Promise<void>;

        public static isPhoneNumberUtilityScriptLoaded = false;

        /** Fetch phone number utils, need to be called before instantiating objects */
        public static async fetchPhoneNumberUtilityScript() {

            console.assert(!this.isPhoneNumberUtilityScriptLoaded);

            await phoneNumber.remoteLoadUtil(
                `${env.assetsRoot}plugins/ui/intl-tel-input/js/utils.js`
            );

            this.isPhoneNumberUtilityScriptLoaded = true;

        }


        constructor(
            private readonly params: {
                userSim: types.UserSim.Usable;
                userSimEvts: UserSimEvts;
                createContact(params: { name: string; number: phoneNumber; }): Promise<void>;
                deleteContacts(contacts: types.UserSim.Contact[]): Promise<void>;
                updateContactName(params: { contact: types.UserSim.Contact; newName: string; }): Promise<void>;
            }
        ) {

            {

                const { hide, show } = createModal(
                    this.structure,
                    {
                        "keyboard": false,
                        "backdrop": true
                    }
                );

                this.hideModal = hide;
                this.showModal = show;

            }

            params.userSimEvts.evtDelete.attachOnce(
                () => this.hideModal()
                    .then(() => this.structure.detach())
            );

            for (const contact of params.userSim.phonebook) {

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

            this.buttonEdit.on("click", () => this.interact_updateContact());

            this.buttonCreateContact.on("click", () => this.interact_createContact());

            params.userSimEvts.evtReachabilityStatusChange.attach(() => this.updateButtons());

            params.userSimEvts.evtNewUpdatedOrDeletedContact.attach(
                ({ eventType, contact }) => {

                    const uiContact = this.uiContacts.get(contact);

                    switch (eventType) {
                        case "DELETED":

                            assert(!!uiContact);
                            uiContact.structure.detach();

                            break;

                        case "UPDATED":

                            assert(!!uiContact);

                            uiContact.updateContactName();

                            this.placeUiContact(uiContact);

                            break;
                        case "NEW":

                            this.structure.find("input").val("");

                            this.createUiContact(contact);

                            this.updateSearch();

                            break;
                    }

                }
            );

        }


        /** mapped by types.UserSim.Contact */
        private readonly uiContacts = new WeakMap<types.UserSim.Contact, UiContact>();

        private updateButtons() {

            [
                this.buttonClose,
                this.buttonCreateContact,
                this.buttonDelete,
                this.buttonEdit
            ].forEach(button => button.prop("disabled", !this.params.userSim.reachableSimState));

            const selectedCount = this.params.userSim.phonebook
                .map(contact => this.uiContacts.get(contact))
                .filter((uiContact): uiContact is UiContact => !!uiContact)
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

            const uiContact = new UiContact(this.params.userSim, contact);

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

                const uiContact = this.params.userSim.phonebook
                    .map(contact => this.uiContacts.get(contact))
                    .filter((uiContact): uiContact is UiContact => !!uiContact)
                    .find(uiContact => uiContact.structure.get(0) === li_elem);

                assert(!!uiContact, "uiContact not found");

                return uiContact;

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



        /** 
         * Trigger ui process to create a contact.
         * External call when create contact from 
         * android app, provide number.
         * Internally when button is clicked no number provided.
         */
        public async interact_createContact(provided_number?: phoneNumber) {

            const { dialogApi, endMultiDialogProcess } = startMultiDialogProcess();

            await (async (dialogApi: DialogApi) => {

                const { userSim } = this.params;

                const number = provided_number || await new Promise<phoneNumber | undefined>(
                    async function callee(resolve) {

                        const className = "prompt-phone-number-modal";

                        dialogApi.create("prompt", {
                            "title": `Phone number`,
                            "size": "small",
                            className,
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
                                        resolve_ => dialogApi.create("alert", {
                                            "message": `${number} is not a valid phone number`,
                                            "callback": () => resolve_()
                                        })
                                    );

                                    callee(resolve);

                                    return;

                                }

                                resolve(number);

                            },
                        });

                        const modal = await new Promise<JQuery>(resolve => {

                            const mutationObserver = new MutationObserver(function (mutations) {
                                mutations.forEach(mutation => {

                                    if (mutation.type !== "childList") {
                                        return;
                                    }

                                    const $node = (() => {

                                        const out: JQuery[] = [];

                                        mutation.addedNodes.forEach(node => out.push($(node)));

                                        return out;

                                    })().find($node => $node.hasClass(className));

                                    if ($node === undefined) {
                                        return;
                                    }

                                    mutationObserver.disconnect();

                                    resolve($node);

                                });
                            });

                            mutationObserver.observe(document.documentElement, {
                                "attributes": true,
                                "characterData": true,
                                "childList": true,
                                "subtree": true,
                                "attributeOldValue": true,
                                "characterDataOldValue": true
                            });

                        });

                        modal.find(".bootbox-body").css("text-align", "center");

                        const input = modal.find("input");

                        input.intlTelInput((() => {

                            const simIso = userSim.sim.country?.iso;
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
                    resolve => dialogApi.create("prompt", {
                        "title": `Create contact ${phoneNumber.prettyPrint(number)} in ${this.params.userSim.friendlyName} internal memory`,
                        "value": !!contact ? contact.name : "New contact",
                        "callback": result => resolve(result),
                    })
                );

                if (!name) {
                    return;
                }

                if (!this.params.userSim.reachableSimState) {

                    await new Promise(resolve =>
                        dialogApi.create("alert", {
                            "message": `Can't proceed, ${this.params.userSim.friendlyName} no longer online`,
                            "callback": () => resolve()
                        })
                    );

                    return;

                }

                if (!contact) {

                    dialogApi.loading("Creating contact...");

                    await this.params.createContact({ name, number });

                } else {

                    if (contact.name === name) {
                        return;
                    }

                    dialogApi.loading(
                        "Updating contact name..."
                    );

                    await this.params.updateContactName({
                        contact,
                        "newName": name,
                    });

                }

                dialogApi.dismissLoading();

            })(dialogApi);

            endMultiDialogProcess();

        }

        public async interact_deleteContacts(provided_number?: phoneNumber) {

            const { dialogApi, endMultiDialogProcess } = startMultiDialogProcess();

            await (async (dialogApi: DialogApi) => {

                const contacts: types.UserSim.Contact[] = (() => {

                    if (provided_number !== undefined) {

                        const contact = this.params.userSim.phonebook.find(
                            ({ number_raw }) => phoneNumber.areSame(
                                provided_number,
                                number_raw
                            )
                        )!;

                        return [contact];

                    } else {

                        return this.params.userSim.phonebook
                            .map(contact => this.uiContacts.get(contact))
                            .filter((uiContact): uiContact is UiContact => !!uiContact)
                            .filter(uiContact => uiContact.isSelected)
                            .map(uiContact => uiContact.contact);
                        ;


                    }

                })();

                const isConfirmed = await new Promise<boolean>(resolve =>
                    dialogApi.create("confirm", {
                        "size": "small",
                        "message": [
                            "Are you sure you want to delete",
                            contacts.map(({ name }) => name).join(" "),
                            `from ${this.params.userSim.friendlyName} internal storage ?`
                        ].join(" "),
                        "callback": result => resolve(result)
                    })
                );

                if (!isConfirmed) {
                    return;
                }

                if (!this.params.userSim.reachableSimState) {

                    await new Promise(resolve =>
                        dialogApi.create("alert", {
                            "message": `Can't delete, ${this.params.userSim.friendlyName} no longer online`,
                            "callback": () => resolve()
                        })
                    );

                    return;

                }

                dialogApi.loading("Deleting contacts...");

                await this.params.deleteContacts(contacts);


                this.updateButtons();

                dialogApi.dismissLoading();

            })(dialogApi);

            endMultiDialogProcess();


        }

        public async interact_updateContact(provided_number?: phoneNumber) {

            const { dialogApi, endMultiDialogProcess } = startMultiDialogProcess();

            await (async (dialogApi: DialogApi) => {


                const contact = provided_number !== undefined ?
                    this.params.userSim.phonebook.find(
                        ({ number_raw }) => phoneNumber.areSame(
                            provided_number,
                            number_raw
                        )
                    )! :
                    this.params.userSim.phonebook
                        .map(contact => this.uiContacts.get(contact))
                        .find(uiContact => uiContact?.isSelected)!.contact
                    ;


                const prettyNumber = phoneNumber.prettyPrint(
                    phoneNumber.build(
                        contact.number_raw,
                        this.params.userSim.sim.country?.iso
                    )
                );

                const newName = await new Promise<string | null>(
                    resolve => dialogApi.create("prompt", {
                        "title": `New contact name for ${prettyNumber} stored in ${this.params.userSim.friendlyName}`,
                        "value": contact.name,
                        "callback": result => resolve(result),
                    })
                );

                if (!newName || contact.name === newName) {
                    return;
                }

                if (!this.params.userSim.reachableSimState) {

                    await new Promise(resolve =>
                        dialogApi.create("alert", {
                            "message": `Can't update, ${this.params.userSim.friendlyName} no longer online`,
                            "callback": () => resolve()
                        })
                    );

                    return;

                }

                dialogApi.loading("Updating contact name ...");

                await this.params.updateContactName({
                    contact,
                    newName,
                });


                dialogApi.dismissLoading();

            })(dialogApi);

            endMultiDialogProcess();

        }


    }

    class UiContact {

        public readonly structure = html.templates.find("li").clone();

        /** only forward click event, need to be selected manually from outside */
        public evtClick = new VoidEvt();

        constructor(
            public readonly userSim: types.UserSim.Usable,
            public readonly contact: types.UserSim.Contact
        ) {

            this.structure
                .on("click", () => {

                    const selection = window.getSelection();

                    //Do not trigger click if text selected.
                    if (selection !== null && selection.toString().length !== 0) {
                        return;
                    }

                    this.evtClick.post();

                })
                .find(".id_number")
                .on("dblclick", e => {
                    e.preventDefault();  //cancel system double-click event

                    const range = document.createRange();
                    range.selectNodeContents(e.currentTarget);


                    const selection = window.getSelection();

                    if (selection !== null) {

                        selection.removeAllRanges();
                        selection.addRange(range);

                    }


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

    return { UiPhonebook };

}


import { SyncEvent } from "ts-events-extended";
import * as types from "../../../shared/dist/lib/types";
import * as localApiHandlers from "../../../shared/dist/lib/toBackend/localApiHandlers";
import * as remoteApiCaller from "../../../shared/dist/lib/toBackend/remoteApiCaller";
import { loadUiClassHtml } from "../../../shared/dist/lib/tools/loadUiClassHtml";
import * as bootbox_custom from "../../../shared/dist/lib/tools/bootbox_custom";
import { UiButtonBar } from "./UiButtonBar";
import { UiPhonebook } from "./UiPhonebook";
import { UiSimRow } from "./UiSimRow";
import { UiShareSim } from "./UiShareSim";
import { phoneNumber } from "phone-number";

declare const require: (path: string) => any;

const html = loadUiClassHtml(
    require("../templates/UiController.html"),
    "UiController"
);

export type Action = {
    type: "CREATE_CONTACT";
    imsi: string;
    number: phoneNumber;
} | {
    type: "UPDATE_CONTACT_NAME" | "DELETE_CONTACT";
    number: phoneNumber;
};

const backToAppUrl= "semasim://main";

export class UiController {

    public readonly structure = html.structure.clone();

    private readonly uiButtonBar = new UiButtonBar();

    private readonly uiShareSim = new UiShareSim(
        (() => {

            const evt = new SyncEvent<{
                userSim: types.UserSim.Owned;
                email: string;
            }>();

            localApiHandlers.evtSharingRequestResponse.attach(
                ({ userSim, email }) => evt.post({ userSim, email })
            );

            localApiHandlers.evtSharedSimUnregistered.attach(
                ({ userSim, email }) => evt.post({ userSim, email })
            );

            return evt;

        })()
    );

    private readonly uiSimRows: UiSimRow[] = [];

    private readonly uiPhonebooks: UiPhonebook[] = [];

    private setState(placeholder: "MAIN" | "NO SIM") {

        switch (placeholder) {
            case "MAIN": {

                $("#loader-line-mask").removeClass("loader-line-mask");

                this.structure.show();

            }; break;
            case "NO SIM": {

                $("#loader-line-mask").addClass("loader-line-mask");

                this.structure.hide();

            }; break;
        }

    }

    private addUserSim(userSim: types.UserSim.Usable) {

        this.setState("MAIN");

        const uiSimRow = new UiSimRow(userSim);

        this.uiSimRows.push(uiSimRow);

        this.structure.append(uiSimRow.structure);

        uiSimRow.evtSelected.attach(() => {

            if (this.uiButtonBar.state.isSimRowSelected) {

                this.getSelectedUiSimRow(uiSimRow).unselect();

            }

            this.uiButtonBar.setState({
                "isSimRowSelected": true,
                "isSimSharable": types.UserSim.Owned.match(userSim),
                "isSimOnline": userSim.isOnline
            });

        });

        localApiHandlers.evtSimIsOnlineStatusChange.attach(
            userSim_ => userSim_ === userSim,
            () => {

                uiSimRow.populate();

                if (uiSimRow.isSelected) {

                    this.uiButtonBar.setState({ "isSimOnline": userSim.isOnline });

                }

                const uiPhonebook = this.uiPhonebooks.find(ui => ui.userSim === userSim)

                if (!!uiPhonebook) {
                    uiPhonebook.updateButtons();
                }

            }
        );

        //NOTE: Edge case where if other user that share the SIM create or delete contact the phonebook number is updated.
        for (const evt of [
            localApiHandlers.evtContactCreatedOrUpdated,
            localApiHandlers.evtContactDeleted
        ]) {

            evt.attach(
                ({ userSim: _userSim, contact }) => _userSim === userSim && contact.mem_index !== undefined,
                () => {

                    uiSimRow.populate();

                }
            );

        }


        //If no sim is selected in the list select this one by triggering a click on the row element.
        if (!this.uiButtonBar.state.isSimRowSelected) {

            uiSimRow.structure.click();

        }

    }

    private async removeUserSim(userSim: types.UserSim.Usable) {

        const uiSimRow = this.uiSimRows.find(uiSimRow => uiSimRow.userSim === userSim)!;

        if (this.uiButtonBar.state.isSimRowSelected) {

            if (uiSimRow === this.getSelectedUiSimRow()) {

                this.uiButtonBar.setState({
                    "isSimRowSelected": false,
                    "isSimSharable": false,
                    "isSimOnline": false,
                    "areDetailsShown": false
                });

                uiSimRow.unselect();

            }

        }

        uiSimRow.structure.remove();

        if ((await remoteApiCaller.getUsableUserSims()).length === 0) {

            this.setState("NO SIM");

        }

    }

    constructor(
        private userSims: types.UserSim.Usable[],
        private action?: Action
    ) {

        this.setState("NO SIM");

        this.initUiButtonBar();

        this.initUiShareSim();

        for (const userSim of userSims.sort((a, b) => +b.isOnline - +a.isOnline)) {

            this.addUserSim(userSim);

        }

        remoteApiCaller.evtUsableSim.attach(
            userSim => this.addUserSim(userSim)
        );

        localApiHandlers.evtSimPermissionLost.attachOnce(
            userSim => this.removeUserSim(userSim)
        );

        this.handleAction();

    }

    private async handleAction() {

        if (!this.action) {
            return;
        }

        const action = this.action;

        const userSim: types.UserSim | undefined = await (async () => {

            switch (action.type) {
                case "UPDATE_CONTACT_NAME":
                case "DELETE_CONTACT": {

                    await UiPhonebook.fetchPhoneNumberUtilityScript();

                    const userSims = this.userSims
                        .filter(
                            ({ phonebook }) => !!phonebook.find(
                                ({ number_raw }) => phoneNumber.areSame(action.number, number_raw)
                            )
                        );

                        const prettyNumber= phoneNumber.prettyPrint(action.number);

                    if (userSims.length === 0) {

                        await new Promise(resolve =>
                            bootbox_custom.alert(
                                [
                                    `${prettyNumber} is not saved in any of your SIM phonebook.`,
                                    "Use the android contacts native feature to edit contact stored in your phone."
                                ].join("<br>"),
                                () => resolve()
                            )
                        );

                        return undefined;
                    } else if (userSims.length === 1) {
                        return userSims.pop();
                    }

                    const index = await new Promise<number | null>(
                        resolve => bootbox_custom.prompt({
                            "title": `${prettyNumber} is present in ${userSims.length}, select phonebook to edit.`,
                            "inputType": "select",
                            "inputOptions": userSims.map(userSim => ({
                                "text": `${userSim.friendlyName} ${userSim.isOnline ? "" : "( offline )"}`,
                                "value": userSims.indexOf(userSim)
                            })),
                            "callback": (indexAsString: string) => resolve(parseInt(indexAsString))
                        })
                    );

                    if (index === null) {

                        await new Promise(resolve =>
                            bootbox_custom.alert(
                                "No SIM selected, aborting.",
                                () => resolve()
                            )
                        );

                        return undefined;

                    }

                    return userSims[index];

                }
                case "CREATE_CONTACT":
                    return this.userSims.find(
                        ({ sim }) => sim.imsi === action.imsi
                    );
            }

        })();

        if (!userSim) {

            window.location.href = backToAppUrl;

            return;

        }

        if (!userSim.isOnline) {

            await new Promise(resolve =>
                bootbox_custom.alert(
                    `${userSim.friendlyName} is not currently online. Can't edit phonebook`,
                    () => resolve()
                )
            );

            window.location.href = backToAppUrl;

            return;

        }

        const uiSimRow = this.uiSimRows.find(
            uiSimRow => uiSimRow.userSim === userSim
        )!;

        uiSimRow.structure.click();

        //NOTE: Spaghetti code continue in evtClickContact handler....
        this.uiButtonBar.evtClickContacts.post();

    }

    private getSelectedUiSimRow(notUiSimRow?: UiSimRow): UiSimRow {

        return this.uiSimRows.find(
            uiSimRow => uiSimRow !== notUiSimRow && uiSimRow.isSelected
        )!;

    }

    private async initUiPhonebook(userSim: types.UserSim.Usable): Promise<UiPhonebook> {

        if (!UiPhonebook.isPhoneNumberUtilityScriptLoaded) {

            bootbox_custom.loading("Loading");

            await UiPhonebook.fetchPhoneNumberUtilityScript();

            bootbox_custom.dismissLoading();

        }

        const uiPhonebook = new UiPhonebook(userSim);

        this.uiPhonebooks.push(uiPhonebook);

        uiPhonebook.evtClickCreateContact.attach(
            ({ name, number, onSubmitted }) =>
                remoteApiCaller.createContact(
                    userSim,
                    name,
                    number
                ).then(contact => onSubmitted(contact))
        );

        uiPhonebook.evtClickDeleteContacts.attach(
            ({ contacts, onSubmitted }) => Promise.all(
                contacts.map(
                    contact => remoteApiCaller.deleteContact(
                        userSim,
                        contact
                    )
                )
            ).then(() => onSubmitted())
        );

        uiPhonebook.evtClickUpdateContactName.attach(
            ({ contact, newName, onSubmitted }) =>
                remoteApiCaller.updateContactName(
                    userSim,
                    contact,
                    newName
                ).then(() => onSubmitted())
        );

        localApiHandlers.evtSimPermissionLost.attachOnce(
            userSim_ => userSim_ === userSim,
            () => uiPhonebook.hideModal().then(() =>
                uiPhonebook.structure.detach()
            )
        );

        localApiHandlers.evtContactCreatedOrUpdated.attach(
            e => e.userSim === userSim,
            ({ contact }) => uiPhonebook.notifyContactChanged(contact)
        );

        localApiHandlers.evtContactDeleted.attach(
            e => e.userSim === userSim,
            ({ contact }) => uiPhonebook.notifyContactChanged(contact)
        );

        return uiPhonebook;

    }


    private initUiButtonBar(): void {

        this.structure.append(this.uiButtonBar.structure);

        this.uiButtonBar.evtToggleDetailVisibility.attach(isShown => {

            for (const uiSimRow of this.uiSimRows) {

                if (isShown) {

                    if (uiSimRow.isSelected) {
                        uiSimRow.setDetailsVisibility("SHOWN");
                    } else {
                        uiSimRow.setVisibility("HIDDEN");
                    }

                } else {

                    if (uiSimRow.isSelected) {
                        uiSimRow.setDetailsVisibility("HIDDEN");
                    } else {
                        uiSimRow.setVisibility("SHOWN");
                    }

                }

            }



        });

        this.uiButtonBar.evtClickContacts.attach(async () => {

            const { userSim } = this.getSelectedUiSimRow();

            let uiPhonebook = this.uiPhonebooks.find(
                uiPhonebook => uiPhonebook.userSim === userSim
            );

            if (!uiPhonebook) {

                uiPhonebook = await this.initUiPhonebook(userSim);

            }


            if (!this.action) {

                uiPhonebook.showModal();

            } else {

                let pr: Promise<void>;

                switch (this.action.type) {
                    case "CREATE_CONTACT":
                        pr = uiPhonebook.interact_createContact(
                            this.action.number
                        );
                        break;
                    case "UPDATE_CONTACT_NAME":
                        pr = uiPhonebook.interact_updateContact(
                            this.action.number
                        );
                        break;
                    case "DELETE_CONTACT":
                        pr = uiPhonebook.interact_deleteContacts(
                            this.action.number
                        );
                        break;
                }

                this.action = undefined;

                await pr!;

                window.location.href = backToAppUrl;

            }


        });

        this.uiButtonBar.evtClickDelete.attach(async () => {

            const { userSim } = this.getSelectedUiSimRow();

            const shouldProceed = await new Promise<boolean>(
                resolve => bootbox_custom.confirm({
                    "title": "Unregister SIM",
                    "message": `Do you really want to unregister ${userSim.friendlyName}?`,
                    callback: result => resolve(result)
                })
            );

            if (shouldProceed) {

                await remoteApiCaller.unregisterSim(userSim);

                this.removeUserSim(userSim);

            }


        });

        this.uiButtonBar.evtClickShare.attach(async () => {

            const { userSim } = this.getSelectedUiSimRow();

            /*
            NOTE: If the user was able to click on share the 
            selected SIM is owned.
            */
            this.uiShareSim.open(
                userSim as types.UserSim.Owned
            );

        });

        this.uiButtonBar.evtClickRename.attach(async () => {

            const uiSimRow = this.getSelectedUiSimRow();

            const friendlyNameSubmitted = await new Promise<string | null>(
                resolve => bootbox_custom.prompt({
                    "title": "Friendly name for this sim?",
                    "value": uiSimRow.userSim.friendlyName,
                    "callback": result => resolve(result),
                })
            );

            if (!!friendlyNameSubmitted) {

                await remoteApiCaller.changeSimFriendlyName(
                    uiSimRow.userSim,
                    friendlyNameSubmitted
                );

                uiSimRow.populate();

            }

        });

        this.uiButtonBar.evtClickReboot.attach(async () => {

            const { userSim } = this.getSelectedUiSimRow();

            const shouldProceed = await new Promise<boolean>(
                resolve => bootbox_custom.confirm({
                    "title": "Reboot GSM Dongle",
                    "message": `Do you really want to reboot Dongle ${userSim.dongle.manufacturer} ${userSim.dongle.model}?`,
                    callback: result => resolve(result)
                })
            );

            if (!shouldProceed) {
                return;
            }

            bootbox_custom.loading("Sending reboot command to dongle");

            /*
            NOTE: If the user was able to click on the reboot button
            the sim is necessary online.
            */
            await remoteApiCaller.rebootDongle(
                userSim as types.Online<types.UserSim.Usable>
            );

            bootbox_custom.dismissLoading();

            await new Promise<void>(
                resolve => bootbox_custom.alert(
                    "Restart command issued successfully, the SIM should be back online within 30 seconds",
                    () => resolve()
                )
            );

        });


    }

    private initUiShareSim() {

        this.uiShareSim.evtShare.attach(
            async ({ userSim, emails, message, onSubmitted }) => {

                await remoteApiCaller.shareSim(userSim, emails, message);

                onSubmitted();

            }
        );

        this.uiShareSim.evtStopSharing.attach(
            async ({ userSim, emails, onSubmitted }) => {

                await remoteApiCaller.stopSharingSim(userSim, emails);

                onSubmitted();

            }
        );


    }


}



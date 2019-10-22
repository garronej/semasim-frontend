import { SyncEvent } from "frontend-shared/node_modules/ts-events-extended";
import * as types from "frontend-shared/dist/lib/types/userSim";
import * as backendEvents from "frontend-shared/dist/lib/toBackend/events";
import * as remoteApiCaller from "frontend-shared/dist/lib/toBackend/remoteApiCaller/base";
import { loadUiClassHtml } from "frontend-shared/dist/lib/loadUiClassHtml";
import { dialogApi } from "frontend-shared/dist/tools/modal/dialog";
import { UiButtonBar } from "./UiButtonBar";
import { UiPhonebook } from "./UiPhonebook";
import { UiSimRow } from "./UiSimRow";
import { UiShareSim } from "./UiShareSim";
import { phoneNumber } from "frontend-shared/node_modules/phone-number";

declare const require: (path: string) => any;

const html = loadUiClassHtml(
    require("../templates/UiController.html"),
    "UiController"
);

export class UiController {

    public readonly structure = html.structure.clone();

    private readonly uiButtonBar = new UiButtonBar();

    private readonly uiShareSim = new UiShareSim(
        (() => {

            const evt = new SyncEvent<{
                userSim: types.UserSim.Owned;
                email: string;
            }>();

            backendEvents.evtSharingRequestResponse.attach(
                ({ userSim, email }) => evt.post({ userSim, email })
            );

            backendEvents.evtOtherSimUserUnregisteredSim.attach(
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
                "isSimReachable": !!userSim.reachableSimState
            });

        });

        backendEvents.evtSimIsOnlineStatusChange.attach(
            userSim_ => userSim_ === userSim,
            () => {

                uiSimRow.populate();

                if (uiSimRow.isSelected) {

                    this.uiButtonBar.setState({ "isSimReachable": !!userSim.reachableSimState });

                }

                const uiPhonebook = this.uiPhonebooks.find(ui => ui.userSim === userSim)

                if (!!uiPhonebook) {
                    uiPhonebook.updateButtons();
                }

            }
        );

        for (const evt of [
            backendEvents.evtSimGsmConnectivityChange,
            backendEvents.evtSimCellSignalStrengthChange
        ]) {

            evt.attach(
                userSim_ => userSim_ === userSim,
                () => uiSimRow.populate()
            );

        }

        //NOTE: Edge case where if other user that share the SIM create or delete contact the phonebook number is updated.
        for (const evt of [
            backendEvents.evtContactCreatedOrUpdated,
            backendEvents.evtContactDeleted
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
                    "isSimReachable": false,
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

    constructor(private userSims: types.UserSim.Usable[]) {

        this.setState("NO SIM");

        this.initUiButtonBar();

        this.initUiShareSim();

        for (const userSim of userSims.sort((a, b) => +!!b.reachableSimState - +!!a.reachableSimState)) {

            this.addUserSim(userSim);

        }

        backendEvents.evtUsableSim.attach(
            userSim => this.addUserSim(userSim)
        );

        backendEvents.evtSimPermissionLost.attachOnce(
            userSim => this.removeUserSim(userSim)
        );

    }

    private getSelectedUiSimRow(notUiSimRow?: UiSimRow): UiSimRow {

        return this.uiSimRows.find(
            uiSimRow => uiSimRow !== notUiSimRow && uiSimRow.isSelected
        )!;

    }

    private async initUiPhonebook(userSim: types.UserSim.Usable): Promise<UiPhonebook> {

        if (!UiPhonebook.isPhoneNumberUtilityScriptLoaded) {

            dialogApi.loading("Loading");

            await UiPhonebook.fetchPhoneNumberUtilityScript();

            dialogApi.dismissLoading();

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

        backendEvents.evtSimPermissionLost.attachOnce(
            userSim_ => userSim_ === userSim,
            () => uiPhonebook.hideModal().then(() =>
                uiPhonebook.structure.detach()
            )
        );

        backendEvents.evtContactCreatedOrUpdated.attach(
            e => e.userSim === userSim,
            ({ contact }) => uiPhonebook.notifyContactChanged(contact)
        );

        backendEvents.evtContactDeleted.attach(
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

            const uiPhonebook = this.uiPhonebooks.find(
                uiPhonebook => uiPhonebook.userSim === userSim
            ) || await this.initUiPhonebook(userSim);


            uiPhonebook.showModal();

        });

        this.uiButtonBar.evtClickDelete.attach(async () => {

            const { userSim } = this.getSelectedUiSimRow();

            const shouldProceed = await new Promise<boolean>(
                resolve => dialogApi.create("confirm",{
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
                resolve => dialogApi.create("prompt", {
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
                resolve => dialogApi.create("confirm", {
                    "title": "Reboot GSM Dongle",
                    "message": `Do you really want to reboot Dongle ${userSim.dongle.manufacturer} ${userSim.dongle.model}?`,
                    callback: result => resolve(result)
                })
            );

            if (!shouldProceed) {
                return;
            }

            dialogApi.loading("Sending reboot command to dongle");

            /*
            NOTE: If the user was able to click on the reboot button
            the sim is necessary online.
            */
            await remoteApiCaller.rebootDongle(
                userSim as types.Online<types.UserSim.Usable>
            );

            dialogApi.dismissLoading();

            await new Promise<void>(
                resolve => dialogApi.create("alert", {
                    "message": "Restart command issued successfully, the SIM should be back online within 30 seconds",
                    "callback": () => resolve()
                })
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

    public interact_updateContactName(number: phoneNumber) {
        return this.interact_({ "type": "UPDATE_CONTACT_NAME", number });
    }

    public interact_deleteContact(number: phoneNumber) {
        return this.interact_({ "type": "DELETE_CONTACT", number });
    }

    public interact_createContact(imsi: string, number: phoneNumber) {
        return this.interact_({ "type": "CREATE_CONTACT", imsi, number });
    }

    private async interact_(action: {
        type: "CREATE_CONTACT";
        imsi: string;
        number: phoneNumber;
    } | {
        type: "UPDATE_CONTACT_NAME" | "DELETE_CONTACT";
        number: phoneNumber;
    }) {

        const userSim = "imsi" in action ?
            this.userSims.find(
                ({ sim }) => sim.imsi === action.imsi
            ) : await interact_getUserSimContainingNumber(
                this.userSims,
                action.number
            );

        if (!userSim) {

            await new Promise(resolve =>
                dialogApi.create("alert", {
                    "message": "No SIM selected, aborting.",
                    "callback": () => resolve()
                })
            );

            return;

        }

        if (!userSim.reachableSimState) {

            await new Promise(resolve =>
                dialogApi.create("alert", {
                    "message": `${userSim.friendlyName} is not currently online. Can't edit phonebook`,
                    "callback": () => resolve()
                })
            );

            return;

        }

        const uiPhonebook = this.uiPhonebooks.find(
            uiPhonebook => uiPhonebook.userSim === userSim
        ) || await this.initUiPhonebook(userSim);

        switch (action.type) {
            case "CREATE_CONTACT": await uiPhonebook.interact_createContact(action.number); break;
            case "DELETE_CONTACT": await uiPhonebook.interact_deleteContacts(action.number); break;
            case "UPDATE_CONTACT_NAME": await uiPhonebook.interact_updateContact(action.number); break;
        }

    }


}

/** Interact only if more than one SIM holds the phone number */
async function interact_getUserSimContainingNumber(
    userSims: types.UserSim.Usable[],
    number: phoneNumber
): Promise<types.UserSim.Usable | undefined> {

    if (!UiPhonebook.isPhoneNumberUtilityScriptLoaded) {
        await UiPhonebook.fetchPhoneNumberUtilityScript();
    }

    const userSimsContainingNumber = userSims
        .filter(
            ({ phonebook }) => !!phonebook.find(
                ({ number_raw }) => phoneNumber.areSame(number, number_raw)
            )
        )
        ;


    if (userSimsContainingNumber.length === 0) {

        await new Promise(resolve =>
            dialogApi.create("alert", {
                "message": [
                    `${phoneNumber.prettyPrint(number)} is not saved in any of your SIM phonebook.`,
                    "Use the android contacts native feature to edit contact stored in your phone."
                ].join("<br>"),
                "callback": () => resolve()
            })
        );

        return undefined;
    } else if (userSimsContainingNumber.length === 1) {
        return userSimsContainingNumber.pop();
    }
    
    //TODO: Toss away
    const index = await new Promise<number | null>(
        resolve => dialogApi.create("prompt",({
            "title": `${phoneNumber.prettyPrint(number)} is present in ${userSimsContainingNumber.length}, select phonebook to edit.`,
            "inputType": "select",
            "inputOptions": userSimsContainingNumber.map(userSim => ({
                "text": `${userSim.friendlyName} ${!!userSim.reachableSimState ? "" : "( offline )"}`,
                "value": userSimsContainingNumber.indexOf(userSim)
            })),
            "callback": (indexAsString: string) => resolve(parseInt(indexAsString))
        }) as any)
    );

    if (index === null) {

        return undefined;

    }

    return userSimsContainingNumber[index];

}
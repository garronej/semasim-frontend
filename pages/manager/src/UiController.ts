
import { SyncEvent } from "ts-events-extended";
import * as types from "../../../shared/dist/lib/types";
import * as localApiHandlers from "../../../shared/dist/lib/toBackend/localApiHandlers";
import * as remoteApiCaller from "../../../shared/dist/lib/toBackend/remoteApiCaller";
import { loadUiClassHtml } from "../../../shared/dist/lib/tools/loadUiClassHtml";
import * as bootbox_custom from "../../../shared/dist/lib/tools/bootbox_custom";
import { UiButtonBar } from "./UiButtonBar";
import { UiSimRow } from "./UiSimRow";
import { UiShareSim } from "./UiShareSim";

declare const require: (path: string) => any;

const html = loadUiClassHtml(
    require("../templates/UiController.html"),
    "UiController"
);

export class UiController {

    public readonly structure = html.structure.clone();

    private readonly uiButtonBar = new UiButtonBar();

    private readonly uiShareSim = new UiShareSim(
        (()=>{

            const evt = new SyncEvent<{ 
                userSim: types.UserSim.Owned;
                email: string;
            }>();

            localApiHandlers.evtSharingRequestResponse.attach(
                ({ userSim, email })=> evt.post({ userSim, email })
            );

            localApiHandlers.evtSharedSimUnregistered.attach(
                ({ userSim, email })=> evt.post({ userSim, email })
            );

            return evt;

        })()
    );

    private readonly uiSimRows: UiSimRow[] =[];

    private setPlaceholder(placeholder: "MAIN" | "NO SIM"){

        switch(placeholder){
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

    private addUserSim(userSim: types.UserSim.Usable ){

        this.setPlaceholder("MAIN");

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
            ()=> {

                uiSimRow.populate();

                if( uiSimRow.isSelected ){

                    this.uiButtonBar.setState({ "isSimOnline": userSim.isOnline });

                }

            }
        );

        //NOTE: Edge case where if other user that share the SIM create or delete contact the phonebook number is updated.
        for (const evt of [localApiHandlers.evtContactCreatedOrUpdated, localApiHandlers.evtContactDeleted]) {

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

            this.setPlaceholder("NO SIM");

        }

    }

    constructor() {

        this.setPlaceholder("NO SIM");

        this.initUiButtonBar();

        this.initUiShareSim();

        remoteApiCaller.getUsableUserSims().then(userSims => {

            for (const userSim of userSims) {

                this.addUserSim(userSim);

            }

        });

        remoteApiCaller.evtUsableSim.attach(
            userSim => this.addUserSim(userSim)
        );

        localApiHandlers.evtSimPermissionLost.attach(
            userSim => this.removeUserSim(userSim)
        );

    }

    private getSelectedUiSimRow(notUiSimRow?: UiSimRow): UiSimRow {

        return this.uiSimRows.find(
            uiSimRow => uiSimRow !== notUiSimRow && uiSimRow.isSelected
        )!;

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



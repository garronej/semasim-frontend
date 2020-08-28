import * as types from "frontend-shared/dist/lib/types/UserSim";
import { loadUiClassHtml } from "frontend-shared/dist/lib/loadUiClassHtml";
import { UiButtonBar } from "./UiButtonBar";
import { uiPhonebookDependencyInjection } from "./UiPhonebook";
import { UiSimRow } from "./UiSimRow";
import { uiShareSimDependencyInjection } from "./UiShareSim";
import { phoneNumber } from "frontend-shared/node_modules/phone-number";
import { assert } from "frontend-shared/dist/tools/typeSafety/assert";
import { Polyfill as WeakMap } from "minimal-polyfills/WeakMap";
import { Evt, StatefulReadonlyEvt, StatefulEvt } from "frontend-shared/node_modules/evt";

declare const require: (path: string) => any;

type UiPhonebook = import("./UiPhonebook").UiPhonebook;
type UiShareSim = import("./UiShareSim").UiShareSim;

type CoreApi = Pick<
    import("frontend-shared/dist/lib/toBackend/remoteApiCaller").CoreApi,
    "createContact" |
    "updateContactName" |
    "deleteContact" |
    "unregisterSim" |
    "changeSimFriendlyName" |
    "rebootDongle" |
    "shareSim" |
    "stopSharingSim"
>;

type UserSimEvts = Pick<
    types.UserSim.Usable.Evts,
    "evtNew" |
    "evtDelete" |
    "evtReachabilityStatusChange" |
    "evtCellularConnectivityChange" |
    "evtCellularSignalStrengthChange" |
    "evtNewUpdatedOrDeletedContact" |
    "evtSharedUserSetChange" |
    "evtFriendlyNameChange"

>;

export type UiController = InstanceType<ReturnType<typeof uiControllerDependencyInjection>["UiController"]>;

export function uiControllerDependencyInjection(
    params: {
        dialogApi: typeof import("frontend-shared/dist/tools/modal/dialog").dialogApi;
        startMultiDialogProcess: typeof import("frontend-shared/dist/tools/modal/dialog").startMultiDialogProcess;
        createModal: typeof import("frontend-shared/dist/tools/modal").createModal;
    }
) {

    const { dialogApi, startMultiDialogProcess, createModal } = params;

    const { UiPhonebook } = uiPhonebookDependencyInjection({ startMultiDialogProcess, createModal });
    const { UiShareSim } = uiShareSimDependencyInjection({ createModal, dialogApi });

    const html = loadUiClassHtml(
        require("../templates/UiController.html"),
        "UiController"
    );

    class UiController {

        public readonly structure = html.structure.clone();

        constructor(
            private readonly params: {
                userSims: types.UserSim.Usable[];
                userSimEvts: UserSimEvts;
                coreApi: CoreApi
            }
        ) {

            const { userSims, userSimEvts, coreApi } = params;

            const uiShareSim = new UiShareSim({
                userSimEvts,
                "shareSim": ({ userSim, emails, message }) => coreApi.shareSim({ userSim, emails, message }),
                "stopSharingSim": ({ userSim, emails }) => coreApi.stopSharingSim({ userSim, emails })
            });

            const evtSelectedUserSim = Evt.create<types.UserSim.Usable | null>(null);


            const { evtAreDetailsShown } = this.initUiButtonBar({
                evtSelectedUserSim,
                uiShareSim
            });

            const { addUserSim } = this.addUserSimFactory({
                evtSelectedUserSim,
                evtAreDetailsShown
            });

            //NOTE: List first usable SIMs.
            userSims
                .sort((a, b) => +!!b.reachableSimState - +!!a.reachableSimState)
                .forEach(userSim => addUserSim({ userSim }))
                ;

            userSimEvts.evtNew.attach(({ userSim }) => addUserSim({ userSim }));

            Evt.useEffect(
                () => {

                    const hasSim = userSims.length !== 0

                    $("#loader-line-mask")[hasSim ? "removeClass" : "addClass"]("loader-line-mask");

                    this.structure[hasSim ? "show" : "hide"]();

                },
                Evt.merge([
                    userSimEvts.evtNew,
                    userSimEvts.evtDelete
                ])
            );


        }

        private initUiButtonBar(params: {
            evtSelectedUserSim: StatefulReadonlyEvt<types.UserSim.Usable | null>;
            uiShareSim: Pick<UiShareSim, "open">;
        }): { evtAreDetailsShown: StatefulReadonlyEvt<boolean>; } {

            const { evtSelectedUserSim, uiShareSim } = params;

            const uiButtonBar = new UiButtonBar({
                "evtSelectedUserSim": evtSelectedUserSim,
                "onButtonClicked": async ({ userSim, button }) => {

                    switch (button) {
                        case "DELETE": {

                            const shouldProceed = await new Promise<boolean>(
                                resolve => dialogApi.create("confirm", {
                                    "title": "Unregister SIM",
                                    "message": `Do you really want to unregister ${userSim.friendlyName}?`,
                                    callback: result => resolve(result)
                                })
                            );

                            if (!shouldProceed) {
                                return;
                            }

                            await this.params.coreApi.unregisterSim(userSim);

                        } break;
                        case "RENAME": {

                            const friendlyNameSubmitted = await new Promise<string | null>(
                                resolve => dialogApi.create("prompt", {
                                    "title": "Friendly name for this sim?",
                                    "value": userSim.friendlyName,
                                    "callback": result => resolve(result),
                                })
                            );

                            if (!friendlyNameSubmitted) {
                                return;
                            }

                            await this.params.coreApi.changeSimFriendlyName({
                                userSim,
                                "friendlyName": friendlyNameSubmitted
                            });

                        } break;
                        case "CONTACTS": {

                            (await this.getUiPhonebook(userSim)).showModal();

                        } break;

                        case "REBOOT": {

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
                            await this.params.coreApi.rebootDongle(userSim);

                            dialogApi.dismissLoading();

                            await new Promise<void>(
                                resolve => dialogApi.create("alert", {
                                    "message": "Restart command issued successfully, the SIM should be back online within 30 seconds",
                                    "callback": () => resolve()
                                })
                            );


                        } break;
                        case "SHARE": {

                            /*
                            NOTE: If the user was able to click on share the 
                            selected SIM is owned.
                            */
                            assert(types.UserSim.Owned.match(userSim));

                            uiShareSim.open(userSim);


                        } break;
                    }
                }
            });

            this.structure.append(uiButtonBar.structure);

            return { "evtAreDetailsShown": uiButtonBar.evtAreDetailsShown };

        }

        private addUserSimFactory(
            params: {
                evtSelectedUserSim: StatefulEvt<types.UserSim.Usable | null>;
                evtAreDetailsShown: StatefulReadonlyEvt<boolean>;
            }
        ) {

            const { evtSelectedUserSim, evtAreDetailsShown } = params;

            const addUserSim = (
                params: {
                    userSim: types.UserSim.Usable;
                }
            ): void => {

                const { userSim } = params;


                const uiSimRow = new UiSimRow({
                    userSim,
                    "userSimEvts": types.UserSim.Usable.Evts.ForSpecificSim.build(
                        this.params.userSimEvts,
                        userSim,
                        [
                            "evtFriendlyNameChange",
                            "evtReachabilityStatusChange",
                            "evtCellularConnectivityChange",
                            "evtCellularSignalStrengthChange",
                            "evtNewUpdatedOrDeletedContact",
                            "evtDelete"
                        ]
                    ),
                    evtSelectedUserSim,
                    evtAreDetailsShown
                });

                this.structure.append(uiSimRow.structure);

                //If no sim is selected in the list select this one by triggering a click on the row element.
                if (evtSelectedUserSim.state === null) {
                    evtSelectedUserSim.state = userSim;
                }

            };

            return { addUserSim };

        }

        private getUiPhonebook = (() => {

            const map = new WeakMap<types.UserSim.Usable, UiPhonebook>();

            return async (userSim: types.UserSim.Usable): Promise<UiPhonebook> => {

                {
                    const out = map.get(userSim);

                    if (out !== undefined) {
                        return out;
                    }

                }

                if (!UiPhonebook.isPhoneNumberUtilityScriptLoaded) {

                    dialogApi.loading("Loading");

                    await UiPhonebook.fetchPhoneNumberUtilityScript();

                    dialogApi.dismissLoading();

                }

                map.set(
                    userSim,
                    new UiPhonebook({
                        userSim,
                        "userSimEvts": types.UserSim.Usable.Evts.ForSpecificSim.build(
                            this.params.userSimEvts,
                            userSim,
                            [
                                "evtReachabilityStatusChange",
                                "evtNewUpdatedOrDeletedContact",
                                "evtDelete"
                            ]
                        ),
                        "createContact": ({ name, number }) => this.params.coreApi.createContact({
                            userSim, name, "number_raw": number
                        }).then(() => { }),
                        "deleteContacts": contacts => Promise.all(
                            contacts.map(contact => this.params.coreApi.deleteContact({
                                userSim,
                                contact
                            }))
                        ).then(() => { }),
                        "updateContactName": ({ contact, newName }) => this.params.coreApi.updateContactName({
                            userSim, contact, newName
                        }).then(() => { })
                    })
                );

                return this.getUiPhonebook(userSim);

            }

        })();


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
                this.params.userSims.find(
                    ({ sim }) => sim.imsi === action.imsi
                ) : await interact_getUserSimContainingNumber(
                    this.params.userSims,
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

            const uiPhonebook = await this.getUiPhonebook(userSim);

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
            resolve => dialogApi.create("prompt", ({
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

    return { UiController };

}


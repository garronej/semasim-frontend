
import { apiClient as api, types } from "../../../api";
import { UiButtonBar } from "./UiButtonBar";
import * as tools from "../../../tools";
import { UiSimRow } from "./UiSimRow";
import { UiShareSim } from "./UiShareSim";
import { SyncEvent } from "ts-events-extended";

declare const require: (path: string) => any;

const html = tools.loadUiClassHtml(
    require("../templates/UiController.html"),
    "UiController"
);

export class UiController {

    public readonly structure = html.structure.clone();

    public readonly evtRefresh= new SyncEvent<UiController.State>();

    private readonly uiButtonBar= new UiButtonBar();

    private readonly uiShareSim = new UiShareSim();

    private readonly uiSimRows: UiSimRow[] = [];

    constructor(
        useableUserSims: types.UserSim.Usable[],
        previousState?: UiController.State,
    ) {

        this.initUiButtonBar();

        this.initUiShareSim();

        for (const userSim of useableUserSims) {

            this.initUiSimRow(userSim);

        }

        if (!previousState || useableUserSims.map(({ sim })=> sim.imsi).indexOf( previousState.selectedSim ) < 0 ) {

            previousState = {
                "selectedSim": useableUserSims[0].sim.imsi,
                "areDetailsShown": false
            };

        }

        this.uiSimRows.filter(
            ({ userSim }) => userSim.sim.imsi === previousState!.selectedSim
        )[0].structure.click();

        if (previousState.areDetailsShown) {

            this.uiButtonBar.btnDetail.click();

        }

    }

    private getSelectedUiSimRow(notUiSimRow?: UiSimRow): UiSimRow {

        return this.uiSimRows.filter(
            uiSimRow => uiSimRow !== notUiSimRow && uiSimRow.isSelected
        )[0];

    }

    private initUiButtonBar(): void {

        this.structure.find("#_1").append(this.uiButtonBar.structure);

        this.uiButtonBar.evtClickDetail.attach(() => {

            for (const uiSimRow of this.uiSimRows) {

                if (uiSimRow.isSelected) {
                    uiSimRow.setDetailsVisibility("SHOWN");
                } else {
                    uiSimRow.setVisibility("HIDDEN");
                }

            }

        });

        this.uiButtonBar.evtClickBack.attach(() => {

            for (const uiSimRow of this.uiSimRows) {

                if (uiSimRow.isSelected) {
                    uiSimRow.setDetailsVisibility("HIDDEN");
                } else {
                    uiSimRow.setVisibility("SHOWN");
                }

            }

        });

        this.uiButtonBar.evtClickDelete.attach(async () => {

            const { userSim } = this.getSelectedUiSimRow();

            const shouldProceed = await new Promise<boolean>(
                resolve => tools.bootbox_custom.confirm({
                    "title": "Unregister SIM",
                    "message": `Do you really want to unregister ${userSim.friendlyName}?`,
                    callback: result => resolve(result)
                })
            );

            if (shouldProceed) {

                await api.unregisterSim(userSim.sim.imsi);

                this.uiButtonBar.evtClickRefresh.post();

            }


        });

        this.uiButtonBar.evtClickShare.attach(async () => {

            const imsi= this.getSelectedUiSimRow().userSim.sim.imsi;

            const userSim= (await api.getUserSims())
            .filter( ({ sim })=> sim.imsi === imsi )[0] as types.UserSim.Owned
            ;

            this.uiShareSim.open(userSim);

        });

        this.uiButtonBar.evtClickRename.attach(async () => {

            const { userSim } = this.getSelectedUiSimRow();

            const friendlyNameSubmitted = await new Promise<string | null>(
                resolve => tools.bootbox_custom.prompt({
                    "title": "Friendly name for this sim?",
                    "value": userSim.friendlyName,
                    "callback": result => resolve(result),
                })
            );

            if (friendlyNameSubmitted) {

                await api.setSimFriendlyName(userSim.sim.imsi, friendlyNameSubmitted);

                this.uiButtonBar.evtClickRefresh.post();

            }

        });

        this.uiButtonBar.evtClickRefresh.attach(() => this.evtRefresh.post({
            "selectedSim": this.getSelectedUiSimRow().userSim.sim.imsi,
            "areDetailsShown": this.uiButtonBar.state.areDetailsShown
        }));

    }

    private initUiShareSim() {

        this.uiShareSim.evtShare.attach(
            async ({ userSim, emails, message, onSubmitted }) => {

                const affectedUser = await api.shareSim(userSim.sim.imsi, emails, message);

                userSim.ownership.sharedWith.notConfirmed = [
                    ...userSim.ownership.sharedWith.notConfirmed,
                    ...affectedUser.notRegistered,
                    ...affectedUser.registered
                ].filter((item, pos, self) => self.indexOf(item) == pos);

                onSubmitted();

            }
        );

        this.uiShareSim.evtStopSharing.attach(
            async ({ userSim, emails, onSubmitted }) => {

                await api.stopSharingSim(userSim.sim.imsi, emails);

                for( const email of emails ){

                    for( const arr of [ 
                        userSim.ownership.sharedWith.confirmed, 
                        userSim.ownership.sharedWith.notConfirmed
                    ]){

                        const index= arr.indexOf(email);

                        if( index > -1 ){
                            arr.splice(index,1);
                        }


                    }

                }

                onSubmitted();

            }
        );


    }

    private initUiSimRow(userSim: types.UserSim.Usable) {

        const uiSimRow = new UiSimRow(userSim);

        this.uiSimRows.push(uiSimRow);

        this.structure.find("#_1").append(uiSimRow.structure);

        uiSimRow.evtSelected.attach(() => {

            if (this.uiButtonBar.state.isSimRowSelected) {

                this.getSelectedUiSimRow(uiSimRow).unselect();

            }

            this.uiButtonBar.setState({
                "isSimRowSelected": true,
                "isSimSharable": types.UserSim.Owned.match(userSim)
            });

        });

    }

}

export namespace UiController {

    export type State = {
        selectedSim: string;
        areDetailsShown: boolean;
    };

}


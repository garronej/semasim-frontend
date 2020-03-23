import { Evt } from "frontend-shared/node_modules/evt"
import * as types from "frontend-shared/dist/lib/types/userSim";
import { loadUiClassHtml } from "frontend-shared/dist/lib/loadUiClassHtml";
import { NonPostableEvts } from "frontend-shared/dist/tools/NonPostableEvts";


declare const require: any;

const html = loadUiClassHtml(
    require("../templates/UiShareSim.html"),
    "UiShareSim"
);

require("../templates/UiShareSim.less");

type UserSimEvts = Pick<
    NonPostableEvts<types.UserSim.Usable.Evts>,
    "evtSharedUserSetChange" |
    "evtDelete"
>;

export type UiShareSim = InstanceType<ReturnType<typeof uiShareSimDependencyInjection>["UiShareSim"]>;

export function uiShareSimDependencyInjection(
    params: {
        dialogApi: import("frontend-shared/dist/tools/modal/dialog").DialogApi;
        createModal: typeof import("frontend-shared/dist/tools/modal").createModal;
    }
) {

    const { dialogApi, createModal } = params;

    class UiShareSim {

        private readonly structure = html.structure.clone();

        private readonly buttonClose = this.structure.find(".id_close");
        private readonly buttonStopSharing = this.structure.find(".id_stopSharing");
        private readonly divListContainer = this.structure.find(".id_list");
        private readonly inputEmails = this.structure.find(".id_emails");
        private readonly textareaMessage = this.structure.find(".id_message textarea");
        private readonly buttonSubmit = this.structure.find(".id_submit");
        private readonly divsToHideIfNotShared = this.structure.find("._toHideIfNotShared");


        private currentUserSim: types.UserSim.Owned | undefined = undefined;

        private readonly hideModal: () => Promise<void>;
        private readonly showModal: () => Promise<void>;

        private getInputEmails(): string[] {

            const raw = this.inputEmails.val();

            return !!raw ? JSON.parse(raw) : [];

        }


        private readonly userSimEvts: Pick<UserSimEvts, "evtSharedUserSetChange">;

        constructor(
            params: {
                userSimEvts: UserSimEvts;
                shareSim(params: { userSim: types.UserSim.Owned; emails: string[]; message: string; }): Promise<void>;
                stopSharingSim(params: { userSim: types.UserSim.Owned; emails: string[]; }): Promise<void>;
            }
        ) {

            this.userSimEvts = params.userSimEvts;

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

            params.userSimEvts.evtDelete.attach(
                ({ userSim }) => userSim === this.currentUserSim,
                () => this.hideModal()
            );

            this.buttonClose.on("click", () => this.hideModal());

            (this.inputEmails as any).multiple_emails({
                "placeholder": "Enter email addresses",
                "checkDupEmail": true
            });


            this.buttonStopSharing.on("click", async () => {

                const emails: string[] = [];

                this.divListContainer.find(".id_row.selected").each((_, element) => {

                    emails.push($(element).find(".id_email").html());

                });


                await this.hideModal();

                dialogApi.loading("Revoking some user's SIM access");

                await params.stopSharingSim({
                    "userSim": this.currentUserSim!,
                    emails
                });

                dialogApi.dismissLoading();

                this.open(this.currentUserSim!);

            });

            this.buttonSubmit.on("click", async () => {

                if (this.getInputEmails().length === 0) {

                    this.structure.find(".id_emails")
                        .trigger(jQuery.Event("keypress", { "keycode": 13 }));

                } else {

                    const emails = this.getInputEmails();

                    await this.hideModal();

                    dialogApi.loading("Granting sim access to users");


                    await params.shareSim({
                        "userSim": this.currentUserSim!,
                        emails,
                        "message": this.textareaMessage.html()
                    });

                    dialogApi.dismissLoading();

                    this.open(this.currentUserSim!);

                }

            });

            this.inputEmails.change(() => {

                if (this.getInputEmails().length === 0) {

                    this.buttonSubmit.text("Validate email");

                    this.textareaMessage.parent().hide();

                } else {

                    this.buttonSubmit.text("Share");

                    this.textareaMessage.parent().show({
                        "done": () => this.textareaMessage.focus()
                    });

                }

            });

        }


        public open(userSim: types.UserSim.Owned): void {

            this.userSimEvts.evtSharedUserSetChange.detach(Evt.getCtx(this));


            this.currentUserSim = userSim;

            this.textareaMessage.html([
                `I would like to share the SIM card`,
                userSim.friendlyName,
                userSim.sim.storage.number || "",
                `with you.`
            ].join(" "));

            this.inputEmails.parent().find("li").detach();

            this.inputEmails.val("");

            this.inputEmails.trigger("change");

            if (
                userSim.ownership.sharedWith.confirmed.length === 0 &&
                userSim.ownership.sharedWith.notConfirmed.length === 0
            ) {

                this.divsToHideIfNotShared.hide();

            } else {

                this.divListContainer.find(".id_row").detach();

                this.divsToHideIfNotShared.show();

                const onRowClick = (divRow?: JQuery) => {

                    if (!!divRow) {

                        divRow.toggleClass("selected");

                    }

                    const selectedCount: number =
                        this.divListContainer.find(".id_row.selected").length;

                    if (selectedCount === 0) {

                        this.buttonStopSharing.hide();

                    } else {

                        this.buttonStopSharing.show();

                        this.buttonStopSharing.find("span").html(`Revoke access (${selectedCount})`);

                    }

                };

                const appendRow = (email: string, isConfirmed: boolean) => {

                    const divRow = html.templates.find(".id_row").clone();

                    divRow.find(".id_email").text(email);

                    divRow.find(".id_isConfirmed")
                        .text(isConfirmed ? "confirmed" : "Not yet confirmed")
                        .addClass(isConfirmed ? "color-green" : "color-yellow")
                        ;

                    divRow.on("click", () => onRowClick(divRow));

                    this.userSimEvts.evtSharedUserSetChange.attach(
                        ({ userSim, email: email_ }) => (
                            userSim === this.currentUserSim &&
                            email_ === email
                        ),
                        Evt.getCtx(this),
                        () => {

                            if (userSim.ownership.sharedWith.confirmed.indexOf(email) >= 0) {

                                divRow.find(".id_isConfirmed")
                                    .removeClass("color-yellow")
                                    .text("confirmed")
                                    .addClass("color-green")
                                    ;

                            } else {

                                divRow.remove();

                                if (
                                    userSim.ownership.sharedWith.confirmed.length === 0 &&
                                    userSim.ownership.sharedWith.notConfirmed.length === 0
                                ) {

                                    this.divsToHideIfNotShared.hide();

                                }

                            }

                        }
                    );

                    this.divListContainer.append(divRow);

                };

                for (const email of userSim.ownership.sharedWith.confirmed) {

                    appendRow(email, true);

                }

                for (const email of userSim.ownership.sharedWith.notConfirmed) {

                    appendRow(email, false);

                }

                onRowClick();

            }

            this.showModal();

        }

    }

    return { UiShareSim };

}

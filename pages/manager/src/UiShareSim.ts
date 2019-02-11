import * as types from "../../../shared/dist/lib/types";
import { SyncEvent } from "ts-events-extended";
import * as bootbox_custom from "../../../shared/dist/lib/tools/bootbox_custom";
import { loadUiClassHtml } from "../../../shared/dist/lib/tools/loadUiClassHtml";
import * as modal_stack from "../../../shared/dist/lib/tools/modal_stack";

declare const require: any;

const html = loadUiClassHtml(
    require("../templates/UiShareSim.html"),
    "UiShareSim"
);

require("../templates/UiShareSim.less");

export class UiShareSim {

    private readonly structure = html.structure.clone();

    private readonly buttonClose = this.structure.find(".id_close");
    private readonly buttonStopSharing = this.structure.find(".id_stopSharing");
    private readonly divListContainer = this.structure.find(".id_list");
    private readonly inputEmails = this.structure.find(".id_emails");
    private readonly textareaMessage = this.structure.find(".id_message textarea");
    private readonly buttonSubmit = this.structure.find(".id_submit");
    private readonly divsToHideIfNotShared = this.structure.find("._toHideIfNotShared");

    public evtShare = new SyncEvent<{
        userSim: types.UserSim.Owned;
        emails: string[];
        message: string;
        onSubmitted: () => void;
    }>();

    public evtStopSharing = new SyncEvent<{
        userSim: types.UserSim.Owned;
        emails: string[];
        onSubmitted: () => void;
    }>();

    private currentUserSim: types.UserSim.Owned | undefined = undefined;

    private readonly hideModal: ()=> Promise<void>;
    private readonly showModal: ()=> Promise<void>;

    private getInputEmails(): string[] {

        const raw = this.inputEmails.val();

        return !!raw ? JSON.parse(raw) : [];

    }

    /** 
     * The evt argument should post be posted whenever.
     * -An user accept a sharing request.
     * -An user reject a sharing request.
     * -An user unregistered a shared sim.
     */
    constructor(
        private readonly evt: SyncEvent<{
            userSim: types.UserSim.Owned;
            email: string;
        }>
    ) {

        const { hide, show }= modal_stack.add(this.structure, {
            "keyboard": false,
            "backdrop": true
        });

        this.hideModal= hide;
        this.showModal= show;

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

            bootbox_custom.loading("Revoking some user's SIM access");

            await new Promise(resolve =>
                this.evtStopSharing.post({
                    "userSim": this.currentUserSim!,
                    emails,
                    "onSubmitted": () => resolve()
                })
            );

            bootbox_custom.dismissLoading();

            this.open(this.currentUserSim!);

        });

        this.buttonSubmit.on("click", async () => {

            if (this.getInputEmails().length === 0) {

                this.structure.find(".id_emails")
                    .trigger(jQuery.Event("keypress", { "keycode": 13 }));

            } else {

                const emails = this.getInputEmails();

                await this.hideModal();

                bootbox_custom.loading("Granting sim access to some users");

                await new Promise(resolve =>
                    this.evtShare.post({
                        "userSim": this.currentUserSim!,
                        emails,
                        "message": this.textareaMessage.html(),
                        "onSubmitted": () => resolve()
                    })
                );

                bootbox_custom.dismissLoading();

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
                    "done": ()=> this.textareaMessage.focus()
                });

            }

        });

    }


    public open(userSim: types.UserSim.Owned): void {

        this.evt.detach(this);

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

                this.evt.attach(
                    ({ userSim, email: email_ }) => (
                        userSim === this.currentUserSim &&
                        email_ === email
                    ),
                    this,
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



import { types } from "../../../api";
import { SyncEvent } from "ts-events-extended";
import * as tools from "../../../tools";

declare const require: any;

const html = tools.loadUiClassHtml(
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

    private hide(): Promise<void> {

        this.structure.modal("hide");

        return new Promise(resolve =>
            this.structure.one("hidden.bs.modal", () => resolve())
        );

    }

    private getInputEmails(): string[] {

        const raw = this.inputEmails.val();

        return !!raw ? JSON.parse(raw) : [];

    }

    constructor() {

        this.structure.modal({
            "keyboard": false,
            "show": false,
            "backdrop": "true"
        });

        this.buttonClose.on("click", () => this.structure.modal("hide"));

        (this.structure.find(".id_emails") as any).multiple_emails({
            "placeholder": "Enter email addresses",
            "checkDupEmail": true
        });

        this.buttonStopSharing.on("click", async () => {

            const emails: string[] = [];

            this.divListContainer.find(".id_row.selected").each((_, element) => {

                emails.push($(element).find(".id_email").html());

            });

            await this.hide();

            tools.bootbox_custom.loading("Revoking some user's SIM access");

            await new Promise(resolve =>
                this.evtStopSharing.post({
                    "userSim": this.currentUserSim!,
                    emails,
                    "onSubmitted": () => resolve()
                })
            );

            tools.bootbox_custom.dismissLoading();

            this.open(this.currentUserSim!);

        });

        this.buttonSubmit.on("click", async () => {

            const emails = this.getInputEmails();

            await this.hide();

            tools.bootbox_custom.loading("Granting sim access to some users");

            await new Promise(resolve =>
                this.evtShare.post({
                    "userSim": this.currentUserSim!,
                    emails,
                    "message": this.textareaMessage.html(),
                    "onSubmitted": () => resolve()
                })
            );

            tools.bootbox_custom.dismissLoading();

            this.open(this.currentUserSim!);

        });

        this.inputEmails.change(() => {

            if (this.getInputEmails().length === 0) {

                this.buttonSubmit.addClass("disabled");

                this.textareaMessage.parent().hide();

            } else {

                this.buttonSubmit.removeClass("disabled");

                this.textareaMessage.parent().show();


            }

        });

    }


    public open(userSim: types.UserSim.Owned): void {

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

                    this.buttonStopSharing.find("span").html(`Remove (${selectedCount})`);

                }

            };

            const appendRow = (email: string, isConfirmed: boolean) => {

                const divRow = html.templates.find(".id_row").clone()

                divRow.find(".id_email").text(email);

                divRow.find(".id_isConfirmed")
                    .text(isConfirmed ? "confirmed" : "Not yet confirmed")
                    .addClass(isConfirmed ? "color-green" : "color-yellow")
                    ;

                divRow.on("click", () => onRowClick(divRow));

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

        this.structure.modal("show");

    }

}



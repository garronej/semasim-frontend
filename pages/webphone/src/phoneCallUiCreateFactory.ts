
//NOTE: Require ion sound loaded on the page.

import { SyncEvent } from "frontend-shared/node_modules/ts-events-extended";
import * as types from "frontend-shared/dist/lib/types/userSimAndPhoneCallUi";
import * as wd from "frontend-shared/dist/lib/types/webphoneData/types";
import { loadUiClassHtml } from "frontend-shared/dist/lib/loadUiClassHtml";
import { phoneNumber } from "frontend-shared/node_modules/phone-number";
import * as modalApi from "frontend-shared/dist/tools/modal";

declare const ion: any;
declare const require: any;

export const phoneCallUiCreateFactory: types.PhoneCallUi.CreateFactory = params => {

    if (params.assertJsRuntimeEnv !== "browser") {
        throw new Error("wrong assertion");
    }

    return Promise.resolve(params => {

        if (params.assertJsRuntimeEnv !== "browser") {
            throw new Error("wrong assertion");
        }
        return new PhoneCallUiImpl(params.userSim);

    });

};

const html = loadUiClassHtml(
    require("../templates/UiVoiceCall.html"),
    "UiVoiceCall"
);

class PhoneCallUiImpl implements types.PhoneCallUi {

    private readonly structure = html.structure.clone();

    private readonly countryIso: string | undefined;

    private readonly btnGreen = this.structure.find(".id_btn-green");
    private readonly btnRed = this.structure.find(".id_btn-red");

    private readonly evtBtnClick = new SyncEvent<"GREEN" | "RED">();

    private readonly evtNumpadDtmf = new SyncEvent<{ signal: types.PhoneCallUi.DtmFSignal; duration: number }>();

    private readonly hideModal: () => Promise<void>;
    private readonly showModal: () => Promise<void>;

    constructor(
        private readonly userSim: types.UserSim.Usable
    ) {

        this.countryIso = userSim.sim.country?.iso;

        {

            const { hide, show } = modalApi.createModal(
                this.structure,
                {
                    "keyboard": false,
                    "backdrop": "static"
                }
            );

            this.hideModal = hide;

            this.showModal = show;

        }

        this.structure.find("span.id_me").html(userSim.friendlyName);

        this.structure.find("span.id_me_under").html(
            !!this.userSim.sim.storage.number ?

                phoneNumber.prettyPrint(
                    phoneNumber.build(
                        this.userSim.sim.storage.number,
                        this.countryIso
                    ),
                    this.countryIso
                ) : ""
        );

        this.btnGreen.on("click", () => this.evtBtnClick.post("GREEN"));
        this.btnRed.on("click", () => this.evtBtnClick.post("RED"));

        const mouseDownStart: { [signal: string]: number } = {};

        for (let i = 0; i <= 11; i++) {

            const signal: types.PhoneCallUi.DtmFSignal = (i <= 9) ? `${i}` : (i === 10) ? "*" : "#" as any;

            this.structure
                .find("button.id_key" + (signal === "*" ? "Ast" : (signal === "#" ? "Sharp" : signal)))
                .on("mousedown", () => mouseDownStart[signal] = Date.now())
                .on("click", () => {

                    let duration = Date.now() - mouseDownStart[signal];

                    if (duration < 250) {
                        duration = 250;
                    }

                    this.evtNumpadDtmf.post({
                        signal,
                        duration
                    });
                })
                ;

        }

    }

    private setContact(wdChat: wd.Chat<"PLAIN">): void {

        this.structure.find("span.id_contact")
            .html(wdChat.contactName ? wdChat.contactName : "");

        this.structure.find("span.id_contact_under")
            .html(
                phoneNumber.prettyPrint(
                    wdChat.contactNumber,
                    this.countryIso
                )
            );


    }

    private setArrows(direction: "INCOMING" | "OUTGOING"): void {

        this.structure.find("[class^='sel_arrow-']").addClass("hide");

        this.structure
            .find(`.sel_arrow-${(direction === "INCOMING") ? "left" : "right"}`)
            .removeClass("hide")
            ;

    }

    private state: "RINGING" | "RINGBACK" | "ESTABLISHED" | "LOADING" | "TERMINATED" =
        "TERMINATED";

    private setState(
        state: typeof PhoneCallUiImpl.prototype.state,
        message: string
    ): void {

        console.log("UiVoiceCall.setState", { state, message });

        if (state === this.state) {
            return;
        }

        this.state = state;

        this.evtBtnClick.detach();

        let keyPad = this.structure.find(".id_numpad");

        keyPad.hide();

        this.structure.find("[class^='id_icon-']").addClass("hide");

        let spanTimer: any = this.structure.find("span.id_timer");

        if (spanTimer["timer"] instanceof Function) {
            spanTimer["timer"]("remove");
            spanTimer.text("");
        }

        this.evtNumpadDtmf.detach();

        this.btnGreen.addClass("hide");
        this.btnRed.addClass("hide");

        this.showModal();

        try {

            ion.sound.stop("semasim_ringtone");

        } catch{ }

        switch (state) {
            case "RINGING":
                ion.sound.play("semasim_ringtone", { "loop": true });
                this.btnGreen.removeClass("hide").html("Answer");
                this.btnRed.removeClass("hide").html("Reject");
                this.structure.find(".id_icon-ring").removeClass("hide");
                break;
            case "RINGBACK":
                this.structure.find(".id_icon-ring").removeClass("hide");
                this.btnRed.removeClass("hide").html("Hangup");
                break;
            case "ESTABLISHED":
                keyPad.show();
                this.btnRed.removeClass("hide").html("Hangup");
                spanTimer["timer"]("start");
                break;
            case "LOADING":
                this.btnRed.removeClass("hide").html("Cancel");
                this.structure.find(".id_icon-spin").removeClass("hide");
                break;
            case "TERMINATED":
                this.structure.find(".id_icon-hangup").removeClass("hide");
                setTimeout(() => this.hideModal(), 1500);
                break;
            default: break;
        }

        this.structure.find(".id_status").html(message);

    }

    private onEstablished(): ReturnType<types.PhoneCallUi.OnEstablished> {

        this.setState("ESTABLISHED", "In call");

        const evtUserInput = new SyncEvent<types.PhoneCallUi.InCallUserAction>();

        this.evtNumpadDtmf.attach(
            ({ signal, duration }) =>
                evtUserInput.post({ "userAction": "DTMF", signal, duration })
        );

        this.evtBtnClick.attachOnce(() => {

            this.setState("TERMINATED", "You hanged up");

            evtUserInput.post({ "userAction": "HANGUP" });

        });

        return { evtUserInput };

    }

    public readonly openUiForIncomingCall: types.PhoneCallUi["openUiForIncomingCall"] =
        wdChat => {

            this.setContact(wdChat);

            this.setArrows("INCOMING");

            this.setState("RINGING", "Incoming call");

            return {
                "onTerminated": message => this.setState("TERMINATED", message),
                "prUserInput": new Promise(resolve => this.evtBtnClick.attachOnce(btnId => {

                    if (btnId === "RED") {

                        this.setState("TERMINATED", "You rejected the call");

                        resolve({ "userAction": "REJECT" });

                    } else {

                        this.setState("LOADING", "Connecting...");

                        resolve({
                            "userAction": "ANSWER",
                            "onEstablished": () => this.onEstablished()
                        });

                    }

                }))
            };

        };

    public readonly evtUiOpenedForOutgoingCall: types.PhoneCallUi["evtUiOpenedForOutgoingCall"] = new SyncEvent();

    public readonly openUiForOutgoingCall: types.PhoneCallUi["openUiForOutgoingCall"] =
        wdChat => {

            this.setContact(wdChat);

            this.setArrows("OUTGOING");

            this.setState("LOADING", "Loading...");

            this.evtUiOpenedForOutgoingCall.post({
                "phoneNumber": wdChat.contactNumber,
                "onTerminated": message => this.setState("TERMINATED", message),
                "onRingback": () => {

                    this.setState("RINGBACK", "Remote is ringing");

                    return {
                        "onEstablished": () => this.onEstablished(),
                        "prUserInput": new Promise(
                            resolve => this.evtBtnClick.attachOnce(() => {

                                this.setState("TERMINATED", "You hanged up before remote answered");

                                resolve({ "userAction": "HANGUP" });

                            })
                        )
                    };

                },
                "prUserInput": new Promise(
                    resolve => this.evtBtnClick.attachOnce(() => {

                        this.setState("TERMINATED", "You canceled the call before remote was ringing");

                        resolve({ "userAction": "CANCEL" });

                    })
                )

            });


        };

}



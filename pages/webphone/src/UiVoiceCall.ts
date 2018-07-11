import { SyncEvent } from "ts-events-extended";

import { types } from "../../../api";

import * as tools from "../../../tools";
//import * as wd from "./data";
import Wd = types.WebphoneData;

import { phoneNumber } from "../../../shared";
import { Ua } from "./Ua";


declare const ion: any;
declare const require: any;
//const transform = require("sdp-transform");

const html = tools.loadUiClassHtml(
    require("../templates/UiVoiceCall.html"),
    "UiVoiceCall"
);

export class UiVoiceCall {

    private readonly structure = html.structure.clone();

    private readonly countryIso: string | undefined;

    private readonly btnGreen= this.structure.find(".id_btn-green");
    private readonly btnRed= this.structure.find(".id_btn-red");

    private readonly evtBtnClick= new SyncEvent<"GREEN" | "RED">();

    private readonly evtNumpadDtmf= new SyncEvent<{ signal: Ua.DtmFSignal; duration: number }>();

    constructor(
        private readonly userSim: types.UserSim.Usable
    ) {

        this.countryIso= userSim.sim.country?
            userSim.sim.country.iso : undefined;

        this.structure.modal({
            "keyboard": false,
            "show": false,
            "backdrop": "static"
        });


        this.structure.find("span.id_me").html(userSim.friendlyName);

        //FIXME: this is redundant.
        this.structure.find("span.id_me_under").html(
            !!this.userSim.sim.storage.number ?
                (intlTelInputUtils as any).formatNumber(
                    this.userSim.sim.storage.number,
                    this.countryIso || null,
                    intlTelInputUtils.numberFormat.NATIONAL
                ) : ""
        );

        this.btnGreen.on("click", () => this.evtBtnClick.post("GREEN"));
        this.btnRed.on("click", () => this.evtBtnClick.post("RED"));

        let mouseDownStart: { [signal: string]: number }= {};

        for (let i = 0; i <= 11; i++) {

            let signal: Ua.DtmFSignal = (i <= 9) ? `${i}` : (i === 10) ? "*" : "#" as any;

            this.structure.find(
                "button.id_key" + (signal === "*" ? "Ast" : (signal === "#" ? "Sharp" : signal))
            )
                .on("mousedown", () => mouseDownStart[signal] = Date.now())
                .on("click", () => {

                    let duration= Date.now() - mouseDownStart[signal];

                    if( duration < 250 ){
                        duration = 250;
                    }

                    let e = {
                        signal,
                        duration
                    };

                    this.evtNumpadDtmf.post(e);
                }
                )
                ;

        }

    }

    private setContact(wdChat: Wd.Chat): void {

        let prettyNumber = phoneNumber.prettyPrint(
            wdChat.contactNumber,
            this.countryIso
        );


        this.structure.find("span.id_contact")
            .html(wdChat.contactName ? wdChat.contactName : "");

        this.structure.find("span.id_contact_under")
            .html(prettyNumber);


    }

    private setArrows(direction: "INCOMING" | "OUTGOING"): void {

        this.structure.find("[class^='sel_arrow-']").addClass("hide");

        this.structure
            .find(`.sel_arrow-${(direction === "INCOMING") ? "left" : "right"}`)
            .removeClass("hide")
            ;

    }

    private onEstablished(): {
        evtUserInput: SyncEvent<UiVoiceCall.InCallUserAction>
    } {

        this.setState("ESTABLISHED", "In call");

        let evtUserInput = new SyncEvent<UiVoiceCall.InCallUserAction>();

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

    public onIncoming(wdChat: Wd.Chat): {
        onTerminated(message: string): void;
        prUserInput: Promise<{
            userAction: "ANSWER";
            onEstablished: typeof UiVoiceCall.prototype.onEstablished;
        } | {
            userAction: "REJECT";
        }>;
    } {

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

    }



    public onOutgoing(wdChat: Wd.Chat): {
        onTerminated(message: string): void;
        onRingback(): {
            onEstablished: typeof UiVoiceCall.prototype.onEstablished,
            prUserInput: Promise<{ userAction: "HANGUP"; }>;
        };
        prUserInput: Promise<{ userAction: "CANCEL"; }>;
    } {

        this.setContact(wdChat);

        this.setArrows("OUTGOING");

        this.setState("LOADING", "Loading...");

        return {
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
        };


    }

    private state: UiVoiceCall.State= "TERMINATED";

    private setState(
        state: UiVoiceCall.State,
        message: string
    ): void {

        if( state === this.state ){
            return;
        }

        this.state= state;

        this.evtBtnClick.detach();

        let keyPad = this.structure.find(".id_numpad");

        keyPad.hide();

        this.structure.find("[class^='id_icon-']").addClass("hide");

        let spanTimer = this.structure.find("span.id_timer");

        if (spanTimer["timer"] instanceof Function) {
            spanTimer["timer"]("remove");
            spanTimer.text("");
        }

        this.evtNumpadDtmf.detach();

        this.btnGreen.addClass("hide");
        this.btnRed.addClass("hide");

        this.structure.modal("show");

        ion.sound.stop("semasim_ringtone");

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
                setTimeout(() => this.structure.modal("hide"), 1500);
                break;
            default: break;
        }

        this.structure.find(".id_status").html(message);

    }

}


export namespace UiVoiceCall {

    export type State = "RINGING" | "RINGBACK" | "ESTABLISHED" | "LOADING" | "TERMINATED";

    export type InCallUserAction =
        InCallUserAction.Dtmf |
        InCallUserAction.Hangup;

    export namespace InCallUserAction {

        export type Dtmf = {
            userAction: "DTMF";
            signal: Ua.DtmFSignal;
            duration: number;
        };

        export type Hangup = {
            userAction: "HANGUP";
        };

    }

}

import { SyncEvent } from "ts-events-extended";

import { types } from "../../../api";

import { loadHtml } from "./loadHtml";
//import * as wd from "./data";
import Wd = types.WebphoneData;

import { phoneNumber } from "../../../shared";


declare const require: any;
//const transform = require("sdp-transform");

const html = loadHtml(
    require("../templates/UiVoiceCall.html"),
    "UiVoiceCall"
);

export class UiVoiceCall {

    private readonly structure = html.structure.clone();

    private readonly countryIso: string | undefined;

    private readonly evtBtnClick= new SyncEvent<"GREEN" | "RED">();

    private readonly btnGreen= this.structure.find(".id_btn-green");
    private readonly btnRed= this.structure.find(".id_btn-red");

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

        this.structure.find("span.id_me").html((()=>{

            let out= userSim.friendlyName;

            if (this.userSim.sim.storage.number) {

                out+= " ( " + (intlTelInputUtils as any).formatNumber(
                    this.userSim.sim.storage.number.asStored,
                    this.countryIso || null,
                    intlTelInputUtils.numberFormat.NATIONAL
                ) + " ) ";

            }

            return out;

        })());


        this.btnGreen.on("click", ()=> this.evtBtnClick.post("GREEN"));
        this.btnRed.on("click", () => this.evtBtnClick.post("RED"));

    }

    private setContact(wdChat: Wd.Chat): void {

        let prettyNumber = phoneNumber.prettyPrint(
            wdChat.contactNumber,
            this.countryIso
        );

        this.structure.find("span.id_contact")
            .html(
                !!wdChat.contactName ?
                    `${wdChat.contactName} ( ${prettyNumber} )` :
                prettyNumber
        );


    }

    private setArrows(direction: "INCOMING" | "OUTGOING"): void {

        this.structure.find("[class^='sel_arrow-']").addClass("hide");

        this.structure
            .find(`.sel_arrow-${(direction === "INCOMING") ? "left" : "right"}`)
            .removeClass("hide")
            ;

    }

    public onIncoming(wdChat: Wd.Chat): {
        onTerminated(message: string): void;
        prUserInput: Promise<{
            userAction: "ANSWER";
            onEstablished(): {
                prUserInput: Promise<{ userAction: "HANGUP" }>
            }
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
                        "onEstablished": () => {

                            this.setState("ESTABLISHED", "in call");

                            return {
                                "prUserInput": new Promise(resolve => this.evtBtnClick.attachOnce(() => {

                                    this.setState("TERMINATED", "You hanged up");

                                    resolve({ "userAction": "HANGUP" });

                                }))
                            };

                        }
                    });

                }

            }))
        };

    }


    public onOutgoing(wdChat: Wd.Chat): {
        onTerminated(message: string): void;
        onRingback(): {
            onEstablished(): {
                prUserInput: Promise<{ userAction: "HANGUP"; }>
            }
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
                    "onEstablished": () => {

                        this.setState("ESTABLISHED", "In call");

                        return {
                            "prUserInput": new Promise(resolve =>
                                this.evtBtnClick.attachOnce(() => {

                                    this.setState("TERMINATED", "You hanged up");

                                    resolve({ "userAction": "HANGUP" });

                                })
                            )
                        };

                    },
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

    private setState(
        state: UiVoiceCall.State,
        message: string
    ): void {

        this.evtBtnClick.detach();

        this.structure.find("[class^='id_icon-']").addClass("hide");

        let spanTimer = this.structure.find("span.id_timer");

        if (spanTimer["timer"] instanceof Function) {
            spanTimer["timer"]("remove");
            spanTimer.text("");
        }

        this.btnGreen.addClass("hide");
        this.btnRed.addClass("hide");

        this.structure.modal("show");

        switch (state) {
            case "RINGING":
                this.btnGreen.removeClass("hide").html("Answer");
                this.btnRed.removeClass("hide").html("Reject");
                this.structure.find(".id_icon-ring").removeClass("hide");
                break;
            case "RINGBACK":
                this.structure.find(".id_icon-ring").removeClass("hide");
                this.btnRed.removeClass("hide").html("Hangup");
                break;
            case "ESTABLISHED":
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

}

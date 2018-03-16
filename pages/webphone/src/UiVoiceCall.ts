import { VoidSyncEvent, SyncEvent } from "ts-events-extended";

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

    private readonly evtBtnOk= new VoidSyncEvent();
    private readonly evtBtnKo= new VoidSyncEvent();

    private readonly btnOk= this.structure.find(".id_ok");
    private readonly btnKo= this.structure.find(".id_ko");

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

        this.btnOk.on("click", ()=> this.evtBtnOk.post());
        this.btnKo.on("click", () => this.evtBtnKo.post());

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

    public openIncoming(wdChat: Wd.Chat): {
        onTerminated(message: string): void;
        prUserFeedback: Promise<UiVoiceCall.OpenIncoming.UserFeedback>;
    } {

        this.setContact(wdChat);

        console.log("updated<3");

        this.structure.find("[class^='sel_arrow-']").addClass("hide");
        //this.structure.find("i[class^='sel_arrow-']").addClass("hide");
        this.structure.find(".sel_arrow-left").removeClass("hide");
        this.setState("RINGING", "Incoming call");

        let evtTerminated = new SyncEvent<string>();

        evtTerminated.attachOnce(
            message => {

                this.evtBtnOk.detach();
                this.evtBtnKo.detach();

                this.setState("TERMINATED", message)
            }
        );

        return {
            "onTerminated": message => evtTerminated.post(message),
            "prUserFeedback": new Promise(
                resolve => {

                    this.evtBtnOk.attachOnce(() => {

                        this.setState("LOADING", "Connecting...");

                        this.evtBtnKo.detach();

                        resolve({
                            "status": "ANSWERED",
                            "onEstablished": () => {

                                this.setState("ESTABLISHED", "in call");

                                return new Promise(
                                    resolve => this.evtBtnKo.attachOnce(() => {

                                        this.setState("TERMINATED", "you hanged up");

                                        resolve("HANGUP");

                                    })
                                );


                            }
                        })

                    });

                    this.evtBtnKo.attachOnce(() => {

                        this.evtBtnOk.detach();

                        this.setState("TERMINATED", "you rejected the call");

                        resolve({ "status": "REJECTED" });

                    });

                }
            )
        }

    }

    public openOutgoing(wdChat: Wd.Chat): void {

        this.setContact(wdChat);

        //TODO

    }

    private setState(
        state: UiVoiceCall.State,
        message: string
    ): void {

        this.structure.find("[class^='id_icon-']").addClass("hide");
        //this.structure.find("span[class^='sel_icon-']").addClass("hide");

        let spanTimer = this.structure.find("span.id_timer");

        if (spanTimer["timer"] instanceof Function) {
            spanTimer["timer"]("remove");
            spanTimer.text("");
        }

        this.btnOk.addClass("hide");
        this.btnKo.addClass("hide");

        this.structure.modal("show");

        switch (state) {
            case "RINGING":
                this.btnOk.removeClass("hide").html("Answer");
                this.btnKo.removeClass("hide").html("Reject");
                this.structure.find(".id_icon-ring").removeClass("hide");
                break;
            case "RINGBACK":
                this.structure.find(".id_icon-ring").removeClass("hide");
                this.btnKo.removeClass("hide").html("Hangup");
                break;
            case "ESTABLISHED":
                this.btnKo.removeClass("hide").html("Hangup");
                spanTimer["timer"]("start");
                break;
            case "ERROR":
                this.structure.find(".id_icon-failure").removeClass("hide");
                break;
            case "LOADING":
                this.btnKo.removeClass("hide").html("Cancel");
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

    export type State =
        "RINGING" | "RINGBACK" | "ESTABLISHED" |
        "ERROR" | "LOADING" | "TERMINATED"
        ;

    export namespace OpenIncoming {

        export type UserFeedback =
            UserFeedback.Answered |
            UserFeedback.Rejected
            ;

        export namespace UserFeedback {

            export type Answered = {
                status: "ANSWERED";
                onEstablished(): Promise<"HANGUP">;
            }

            export type Rejected = {
                status: "REJECTED";
            }


        }


    }

}

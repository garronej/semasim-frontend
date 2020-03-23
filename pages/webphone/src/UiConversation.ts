
import { loadUiClassHtml } from "frontend-shared/dist/lib/loadUiClassHtml";
import { phoneNumber } from "../../../local_modules/phone-number/dist/lib";
import {  VoidEvt, Evt, IObservable } from "frontend-shared/node_modules/evt";
import * as types from "frontend-shared/dist/lib/types";
import * as moment from "moment";
import { runNowAndWhenEventOccurFactory } from "frontend-shared/dist/tools/runNowAndWhenEventOccurFactory";
import { NonPostableEvts } from "frontend-shared/dist/tools/NonPostableEvts";

declare const ion: any;
declare const require: any;
//declare const titlenotifier: any;

const html = loadUiClassHtml(
    require("../templates/UiConversation.html"),
    "UiConversation"
);

require("../templates/UiConversation.less");

declare const Buffer: any;

type UserSimEvts = Pick<
    NonPostableEvts<types.UserSim.Usable.Evts.ForSpecificSim>,
    "evtReachabilityStatusChange" |
    "evtCellularConnectivityChange" |
    "evtOngoingCall"
>;


const [checkMark, crossMark] = ["e29c93", "e29d8c"]
    .map(unicode => Buffer.from(unicode, "hex").toString("utf8") as string)
    ;

export class UiConversation {

    public readonly structure = html.structure.clone();

    public readonly evtUpdateContact = new VoidEvt();
    public readonly evtVoiceCall = new VoidEvt();
    public readonly evtSendText = new Evt<string>();
    public readonly evtDelete = new VoidEvt();

    public readonly evtChecked = new VoidEvt();

    private readonly textarea = this.structure.find("textarea");
    private readonly aSend = this.structure.find("a.id_send");
    private readonly ul = this.structure.find("ul");
    private readonly btnUpdateContact = this.structure.find("button.id_updateContact");
    private readonly btnCall = this.structure.find("button.id_call");
    private readonly btnDelete = this.structure.find("button.id_delete");


    constructor(
        private readonly params: {
            userSim: types.UserSim.Usable;
            userSimEvts: UserSimEvts;
            obsIsSipRegistered: IObservable<boolean>;
            wdChat: types.wd.Chat,
            evtUpdatedOrDeletedWdChat: Evt<"UPDATED" | "DELETED">;
            evtNewOrUpdatedMessage: Evt<types.wd.Message>;
            fetchOlderWdMessages: () => Promise<types.wd.Message[]>
        }
    ) {

        const { 
            userSim, 
            userSimEvts, 
            obsIsSipRegistered, 
            wdChat, 
            evtUpdatedOrDeletedWdChat, 
            evtNewOrUpdatedMessage, 
            fetchOlderWdMessages 
        }= params;

        {

            const { runNowAndWhenEventOccur } = runNowAndWhenEventOccurFactory({
                ...userSimEvts,
                "evtIsSipRegisteredValueChange": obsIsSipRegistered.evtChange,
                "evtUpdatedWdChat": (() => {

                    const out = new VoidEvt();

                    evtUpdatedOrDeletedWdChat.attach(
                        eventData => eventData === "UPDATED",
                        () => out.post()
                    );


                    return out;
                })()

            });

            const isDialable = phoneNumber.isDialable(wdChat.contactNumber);



            runNowAndWhenEventOccur(
                () => this.structure.find("span.id_name")
                    .text(wdChat.contactName ?? ""),
                ["evtUpdatedWdChat"]
            );

            runNowAndWhenEventOccur(
                () => {

                    if (obsIsSipRegistered.value && isDialable) {

                        this.textarea.removeAttr("disabled");
                        this.aSend.show();

                    } else {

                        this.textarea.attr("disabled", true as any);
                        this.aSend.hide();

                    }

                },
                [ "evtIsSipRegisteredValueChange" ]
            );

            runNowAndWhenEventOccur(
                () => {

                    this.btnUpdateContact.prop("disabled", (
                        userSim.reachableSimState === undefined ||
                        !isDialable
                    ));

                    this.btnDelete.prop(
                        "disabled",
                        userSim.reachableSimState === undefined
                    );

                },
                ["evtReachabilityStatusChange"]
            );
                


            runNowAndWhenEventOccur(
                () => this.btnCall.prop(
                    "disabled",
                    !(
                        isDialable &&
                        obsIsSipRegistered.value &&
                        !!userSim.reachableSimState?.isGsmConnectivityOk &&
                        (
                            userSim.reachableSimState.ongoingCall === undefined ||
                            userSim.reachableSimState.ongoingCall.number === this.params.wdChat.contactNumber &&
                            !userSim.reachableSimState.ongoingCall.isUserInCall
                        )
                    )
                ),
                [
                    "evtIsSipRegisteredValueChange",
                        "evtReachabilityStatusChange",
                        "evtCellularConnectivityChange",
                        "evtOngoingCall"
                ]
            );



        }



        this.structure.find("span.id_number").text(
            phoneNumber.prettyPrint(
                wdChat.contactNumber,
                userSim.sim.country?.iso
            )
        );

        evtNewOrUpdatedMessage.attach(
            wdMessage => this.newOrUpdatedMessage(wdMessage)
        );

        evtUpdatedOrDeletedWdChat.attach(
            eventData => eventData === "DELETED",
            () => this.structure.detach()
        );


        this.btnUpdateContact
            .on("click", () => this.evtUpdateContact.post());

        this.btnCall
            .on("click", () => this.evtVoiceCall.post());

        this.btnDelete
            .on("click", () => this.evtDelete.post());

        this.structure.find("span.id_number")
            .on("dblclick", e => {
                e.preventDefault();

                const selection = window.getSelection();
                const range = document.createRange();
                range.selectNodeContents(e.currentTarget);

                if (selection !== null) {

                    selection.removeAllRanges();
                    selection.addRange(range);

                }

            });


        this.aSend.on("click", () => {

            let text = this.textarea.val();

            if (!text || text.match(/^\ +$/)) {
                return;
            }

            this.evtSendText.post(text);

            this.textarea.val("");

            this.textarea.trigger("autosize.resizeIncludeStyle");

        });

        this.textarea
            .on("keypress", event => {

                this.evtChecked.post();

                if (event.key === "Enter" && !event.shiftKey) {

                    this.aSend.trigger("click");

                    return false;
                }

            })
            .on("focus", () => this.evtChecked.post())
            ;

        this.ul.slimScroll({
            "position": "right",
            "distance": '0px',
            "railVisible": true,
            "height": '400px',
            "start": "bottom"
        }).bind("slimscroll", (async (_e: any, pos: string) => {

            if (pos !== "top") {
                return;
            }

            const wdMessages = await fetchOlderWdMessages();

            if (wdMessages.length === 0) {
                return;
            }

            const li = this.ul.find("li:first");


            for (const wdMessage of wdMessages) {
                this.newOrUpdatedMessage(wdMessage, "MUTE");
            }


            this.ul.slimScroll({ "scrollTo": `${li.position().top}px` });


        }) as any);


        for (let wdMessage of wdChat.messages) {

            this.newOrUpdatedMessage(wdMessage, "MUTE");

        }

        this.unselect();

    }

    public setSelected() {

        this.structure.show({
            "duration": 0,
            "complete": () => {

                this.ul.slimScroll({ "scrollTo": `${this.ul.prop("scrollHeight")}px` });


                //NOTE: So that SMS from with no number to reply to can be marked as read.
                if (!!this.textarea.attr("disabled")) {
                    this.evtChecked.post();
                } else {
                    this.textarea.trigger("focus");
                }


                (this.textarea as any)["autosize"]();

            }
        });


    }

    public unselect() {
        this.structure.hide();
    }

    private get isSelected(): boolean {
        return this.structure.is(":visible");
    }

    /** new Message or update existing one */
    private readonly newOrUpdatedMessage = (() => {

        const uiBubbles = new Map<types.wd.Message, UiBubble>();

        /** 
         * Place uiBubble in the structure, assume all bubbles already sorted 
         * return true if the bubble is the last <li> of the <ul>
         * */
        const placeUiBubble = (() => {

            const getUiBubbleFromStructure = (li_elem: HTMLElement): UiBubble => {

                for (const uiBubble of uiBubbles.values()) {

                    if (uiBubble.structure.get(0) === li_elem) {

                        return uiBubble;

                    }

                }

                throw new Error("uiBubble not found");


            };

            return (uiBubble: UiBubble): boolean => {


                const lis = this.ul.find("li");

                for (let i = lis.length - 1; i >= 0; i--) {

                    const uiBubble_i = getUiBubbleFromStructure(lis.get(i));

                    if (types.wd.Message.compare(uiBubble.wdMessage, uiBubble_i.wdMessage) >= 0) {

                        //Message is more recent than current

                        uiBubble.structure.insertAfter(uiBubble_i.structure);

                        return i === lis.length - 1;

                    }

                }

                this.ul.prepend(uiBubble.structure);

                return false;

            };

        })();

        return (wdMessage: types.wd.Message, mute: "MUTE" | undefined = undefined) => {

            if (uiBubbles.has(wdMessage)) {

                uiBubbles.get(wdMessage)!.structure.remove();

                //this.uiBubbles.delete(wdMessage.ref);

            }

            let uiBubble: UiBubble;

            if (wdMessage.direction === "INCOMING") {

                if (wdMessage.isNotification) {

                    const uiBubbleIncomingNotification = new UiBubble.IncomingNotification(
                        wdMessage, this.params.wdChat, this.params.userSim
                    );

                    uiBubble = uiBubbleIncomingNotification;

                } else {

                    if (!mute) {
                        ion.sound.play(this.isSelected ? "water_droplet" : "button_tiny");
                    }

                    const uiBubbleIncomingText = new UiBubble.IncomingText(
                        wdMessage, this.params.wdChat, this.params.userSim
                    );

                    uiBubble = uiBubbleIncomingText;


                }

            } else {

                const uiBubbleOutgoing = new UiBubble.Outgoing(wdMessage);

                uiBubble = uiBubbleOutgoing;

            }

            uiBubbles.set(wdMessage, uiBubble);

            const isAtBottom = placeUiBubble(uiBubble);

            if (this.isSelected && isAtBottom) {

                this.ul.slimScroll({ "scrollTo": this.ul.prop("scrollHeight") });

            }


        }





    })();




}

class UiBubble {

    public readonly structure = html.templates.find("li").clone();

    constructor(
        public readonly wdMessage: types.wd.Message
    ) {

        this.structure.find("p.id_content")
            .html(wdMessage.text.split("\n").join("<br>"));

        this.structure.find("span.id_date")
            .html(moment.unix(~~(wdMessage.time / 1000)).format("Do MMMM H:mm"));

    }
}

namespace UiBubble {

    export class IncomingText extends UiBubble {

        constructor(
            public readonly wdMessage: types.wd.Message.Incoming.Text,
            public readonly wdChat: types.wd.Chat,
            public readonly userSim: types.UserSim.Usable
        ) {

            super(wdMessage);

            this.structure.find("div.message").addClass("in");

            this.structure.find("p.id_emitter").html(
                (() => {

                    if (this.wdChat.contactName) {

                        return this.wdChat.contactName;

                    } else {

                        return phoneNumber.prettyPrint(
                            this.wdChat.contactNumber,
                            this.userSim.sim.country ?
                                this.userSim.sim.country.iso : undefined
                        );

                    }

                })()
            );

        }

    }

    export class IncomingNotification extends UiBubble {

        constructor(
            public readonly wdMessage: types.wd.Message.Incoming.Notification,
            public readonly wdChat: types.wd.Chat,
            public readonly userSim: types.UserSim.Usable
        ) {

            super(wdMessage);

            this.structure.find("div.message").addClass("notification");

        }

    }

    export class Outgoing extends UiBubble {

        constructor(
            public readonly wdMessage: types.wd.Message.Outgoing
        ) {

            super(wdMessage);


            this.structure.find("div.message")
                .addClass("out")
                .find("p.id_emitter")
                .html(
                    (
                        wdMessage.status === "STATUS REPORT RECEIVED" &&
                        wdMessage.sentBy.who === "OTHER"
                    ) ? wdMessage.sentBy.email : "You"
                )
                ;


            this.structure.find("span.id_check").text((() => {

                switch (wdMessage.status) {
                    case "SEND REPORT RECEIVED": return !!wdMessage.isSentSuccessfully ? checkMark : crossMark;
                    case "STATUS REPORT RECEIVED": return `${checkMark}${checkMark}`;
                    case "PENDING": return "";
                }

            })());


        }

    }

}


import { loadUiClassHtml } from "../../../shared/dist/lib/tools/loadUiClassHtml";
import { phoneNumber } from "phone-number";
import { VoidSyncEvent, SyncEvent } from "ts-events-extended";
import * as types from "../../../shared/dist/lib/types";
import wd = types.webphoneData;
import * as moment from "moment";

declare const ion: any;
declare const require: any;
//declare const titlenotifier: any;

const html = loadUiClassHtml(
    require("../templates/UiConversation.html"),
    "UiConversation"
);

require("../templates/UiConversation.less");

declare const Buffer: any;


//const checkMark= "\u221a";
const checkMark: string = Buffer.from("e29c93", "hex").toString("utf8");
const crossMark: string = Buffer.from("e29d8c", "hex").toString("utf8");

export class UiConversation {

    public readonly structure = html.structure.clone();

    public readonly evtUpdateContact = new VoidSyncEvent();
    public readonly evtVoiceCall = new VoidSyncEvent();
    public readonly evtSendText = new SyncEvent<string>();
    public readonly evtDelete = new VoidSyncEvent();

    public readonly evtChecked = new VoidSyncEvent();

    private readonly textarea = this.structure.find("textarea");
    private readonly aSend = this.structure.find("a.id_send");
    private readonly ul = this.structure.find("ul");
    private readonly btnUpdateContact = this.structure.find("button.id_updateContact");
    private readonly btnCall = this.structure.find("button.id_call");
    private readonly btnDelete = this.structure.find("button.id_delete");

    public setReadonly(isReadonly: boolean) {

        if (isReadonly) {

            this.textarea.attr("disabled", true as any);
            this.aSend.hide();
            this.btnUpdateContact.prop("disabled", true);
            this.btnCall.prop("disabled", true);
            this.btnDelete.prop("disabled", true);

        } else {

            if (!phoneNumber.isDialable(this.wdChat.contactNumber)) {
                return;
            }

            this.textarea.removeAttr("disabled");
            this.aSend.show();
            this.btnUpdateContact.prop("disabled", false);
            this.btnCall.prop("disabled", false);
            this.btnDelete.prop("disabled", false);

        }

    }

    public readonly evtLoadMore= new SyncEvent<{
        onLoaded: (wdMessages: wd.Message[])=> void;
    }>();

    constructor(
        public readonly userSim: types.UserSim.Usable,
        public readonly wdChat: wd.Chat
    ) {

        this.notifyContactNameUpdated();
        this.setReadonly(true);

        this.btnUpdateContact
            .on("click", () => this.evtUpdateContact.post());

        this.btnCall
            .on("click", () => this.evtVoiceCall.post());

        this.btnDelete
            .on("click", () => this.evtDelete.post());


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
        }).bind("slimscroll", ((_e, pos) => {

            if (pos !== "top") {
                return;
            }

            this.evtLoadMore.post({
                "onLoaded": wdMessages => {

                    if (wdMessages.length === 0) {
                        return;
                    }

                    const li = this.ul.find("li:first");


                    for (const wdMessage of wdMessages) {
                        this.newMessage(wdMessage, "MUTE");
                    }


                    this.ul.slimScroll({ "scrollTo": `${li.position().top}px` });


                }
            });

        }) as any);


        for (let wdMessage of this.wdChat.messages) {

            this.newMessage(wdMessage, "MUTE");

        }

        this.unselect();

    }

    public setSelected() {

        this.structure.show({
            "duration": 0,
            "complete": () => {

                this.ul.slimScroll({ "scrollTo": `${this.ul.prop("scrollHeight")}px` });

                this.textarea.trigger("focus");

                this.textarea["autosize"]();

            }
        });


    }

    public unselect() {

        this.structure.hide();

    }

    private get isSelected(): boolean {
        return this.structure.is(":visible");
    }

    public notifyContactNameUpdated() {

        let prettyNumber = phoneNumber.prettyPrint(
            this.wdChat.contactNumber,
            this.userSim.sim.country ?
                this.userSim.sim.country.iso : undefined
        )

        if (this.wdChat.contactName) {

            this.structure.find("span.id_name").text(this.wdChat.contactName);

            this.structure.find("span.id_number").text(` ( ${prettyNumber} ) `);

        } else {

            this.structure.find("span.id_name").text("");
            this.structure.find("span.id_number").text(prettyNumber);

        }

    }

    /** indexed by wd.Message.id_ */
    private readonly uiBubbles = new Map<number, UiBubble>();

    /** 
     * Place uiBubble in the structure, assume all bubbles already sorted 
     * return true if the bubble is the last <li> of the <ul>
     * */
    private placeUiBubble(uiBubble: UiBubble): boolean {

        const getUiBubbleFromStructure = (li_elem: HTMLElement): UiBubble => {

            for (const uiBubble of this.uiBubbles.values()) {

                if (uiBubble.structure.get(0) === li_elem) {

                    return uiBubble;

                }

            }

            throw new Error("uiBubble not found");


        };

        const lis = this.ul.find("li");

        for (let i = lis.length - 1; i >= 0; i--) {

            const uiBubble_i = getUiBubbleFromStructure(lis.get(i));

            if (wd.compareMessage(uiBubble.wdMessage, uiBubble_i.wdMessage) >= 0) {

                //Message is more recent than current

                uiBubble.structure.insertAfter(uiBubble_i.structure);

                return i === lis.length - 1;

            }

        }

        this.ul.prepend(uiBubble.structure);

        return false;

    }

    /** new Message or update existing one */
    public newMessage(wdMessage: wd.Message, mute: "MUTE" | undefined = undefined) {

        if (this.uiBubbles.has(wdMessage.id_)) {

            this.uiBubbles.get(wdMessage.id_)!.structure.remove();

            this.uiBubbles.delete(wdMessage.id_);

        }

        let uiBubble: UiBubble;

        if (wdMessage.direction === "INCOMING") {

            if (wdMessage.isNotification) {

                const uiBubbleIncomingNotification = new UiBubble.IncomingNotification(
                    wdMessage, this.wdChat, this.userSim
                );

                uiBubble = uiBubbleIncomingNotification;

            } else {

                if (!mute) {
                    ion.sound.play(this.isSelected ? "water_droplet" : "button_tiny");
                }

                const uiBubbleIncomingText = new UiBubble.IncomingText(
                    wdMessage, this.wdChat, this.userSim
                );

                uiBubble = uiBubbleIncomingText;


            }

        } else {

            const uiBubbleOutgoing = new UiBubble.Outgoing(wdMessage);

            uiBubble = uiBubbleOutgoing;

        }

        this.uiBubbles.set(wdMessage.id_, uiBubble);

        const isAtBottom = this.placeUiBubble(uiBubble);

        if (this.isSelected && isAtBottom) {

            this.ul.slimScroll({ "scrollTo": this.ul.prop("scrollHeight") });

        }


    }


}

class UiBubble {

    public readonly structure = html.templates.find("li").clone();

    constructor(
        public readonly wdMessage: wd.Message
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
            public readonly wdMessage: wd.Message.Incoming.Text,
            public readonly wdChat: wd.Chat,
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
            public readonly wdMessage: wd.Message.Incoming.Notification,
            public readonly wdChat: wd.Chat,
            public readonly userSim: types.UserSim.Usable
        ) {

            super(wdMessage);

            this.structure.find("div.message").addClass("notification");

        }

    }

    export class Outgoing extends UiBubble {

        constructor(
            public readonly wdMessage: wd.Message.Outgoing
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

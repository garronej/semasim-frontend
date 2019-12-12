
import { loadUiClassHtml } from "frontend-shared/dist/lib/loadUiClassHtml";
import { phoneNumber } from "../../../local_modules/phone-number/dist/lib";
import { VoidSyncEvent, SyncEvent } from "frontend-shared/node_modules/ts-events-extended";
import * as types from "frontend-shared/dist/lib/types/userSim";
import * as wd from "frontend-shared/dist/lib/types/webphoneData/logic";
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



const [ checkMark, crossMark ] = [ "e29c93", "e29d8c" ]
    .map(unicode => Buffer.from(unicode, "hex").toString("utf8") as string)
    ;

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

    private readonly isDialable: boolean;

    
    //TODO: See if should be optimized, it is called every times
    //the chat notification count change ( e.g. every incoming message )
    //but it current implementation nothing is done in this case.
    /** To call whenever the widget should be updated */
    public notify() {

        this.structure.find("span.id_name").text(this.wdChat.contactName || "");

        if (this.isRegistered() && this.isDialable) {

            this.textarea.removeAttr("disabled");
            this.aSend.show();

        } else {

            this.textarea.attr("disabled", true as any);
            this.aSend.hide();

        }

        this.btnUpdateContact.prop("disabled", (
            this.userSim.reachableSimState === undefined || 
            !this.isDialable
        ));

        this.btnDelete.prop("disabled", this.userSim.reachableSimState === undefined);

        this.btnCall.prop(
            "disabled",
            (
                !this.isRegistered() ||
                !this.isDialable ||
                this.userSim.reachableSimState === undefined ||
                !this.userSim.reachableSimState.isGsmConnectivityOk ||
                (
                    this.userSim.reachableSimState.ongoingCall !== undefined &&
                    (
                        this.userSim.reachableSimState.ongoingCall.number !== this.wdChat.contactNumber ||
                        this.userSim.reachableSimState.ongoingCall.isUserInCall
                    )
                ) ||
                !this.isRegistered()
            )
        );


    }


    constructor(
        public readonly userSim: types.UserSim.Usable,
        private readonly isRegistered: () => boolean,
        public readonly wdChat: wd.Chat<"PLAIN">,
        private readonly fetchOlderWdMessages: ()=> Promise<wd.Message<"PLAIN">[]>
    ) {

        const prettyNumber = phoneNumber.prettyPrint(
            this.wdChat.contactNumber,
            this.userSim.sim.country ?
                this.userSim.sim.country.iso : undefined
        )

        this.isDialable = phoneNumber.isDialable(this.wdChat.contactNumber);

        this.structure.find("span.id_number").text(prettyNumber);

        this.notify();

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

            const wdMessages = await this.fetchOlderWdMessages();

            if (wdMessages.length === 0) {
                return;
            }

            const li = this.ul.find("li:first");


            for (const wdMessage of wdMessages) {
                this.newOrUpdatedMessage(wdMessage, "MUTE");
            }


            this.ul.slimScroll({ "scrollTo": `${li.position().top}px` });


        }) as any);


        for (let wdMessage of this.wdChat.messages) {

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


    //TODO: Use object references instead of refs.
    /** indexed by wd.Message.ref */
    private readonly uiBubbles = new Map<string, UiBubble>();

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
    public newOrUpdatedMessage(wdMessage: wd.Message<"PLAIN">, mute: "MUTE" | undefined = undefined) {

        if (this.uiBubbles.has(wdMessage.ref)) {

            this.uiBubbles.get(wdMessage.ref)!.structure.remove();

            this.uiBubbles.delete(wdMessage.ref);

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

        this.uiBubbles.set(wdMessage.ref, uiBubble);

        const isAtBottom = this.placeUiBubble(uiBubble);

        if (this.isSelected && isAtBottom) {

            this.ul.slimScroll({ "scrollTo": this.ul.prop("scrollHeight") });

        }


    }


}

class UiBubble {

    public readonly structure = html.templates.find("li").clone();

    constructor(
        public readonly wdMessage: wd.Message<"PLAIN">
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
            public readonly wdMessage: wd.Message.Incoming.Text<"PLAIN">,
            public readonly wdChat: wd.Chat<"PLAIN">,
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
            public readonly wdMessage: wd.Message.Incoming.Notification<"PLAIN">,
            public readonly wdChat: wd.Chat<"PLAIN">,
            public readonly userSim: types.UserSim.Usable
        ) {

            super(wdMessage);

            this.structure.find("div.message").addClass("notification");

        }

    }

    export class Outgoing extends UiBubble {

        constructor(
            public readonly wdMessage: wd.Message.Outgoing<"PLAIN">
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

import { loadHtml } from "./loadHtml";
import { types } from "../../../api";
import { phoneNumber } from "../../../shared";
//import { read as wdr } from "./data";
import { VoidSyncEvent, SyncEvent } from "ts-events-extended";
import Wd= types.WebphoneData;
import * as moment from "moment";

declare const ion: any;
declare const require: any;
//declare const titlenotifier: any;

const html = loadHtml(
    require("../templates/UiConversation.html"),
    "UiConversation"
);

require("../templates/UiConversation.less");

export class UiConversation {

    public readonly structure = html.structure.clone();

    public readonly evtUpdateContact = new VoidSyncEvent();
    public readonly evtVoiceCall = new VoidSyncEvent();
    public readonly evtSendText = new SyncEvent<string>();

    public readonly evtChecked = new VoidSyncEvent();

    private readonly textarea = this.structure.find("textarea");
    private readonly aSend = this.structure.find("a.id_send");
    private readonly ul = this.structure.find("ul");

    constructor(
        public readonly userSim: types.UserSim.Usable,
        public readonly wdChat: types.WebphoneData.Chat
    ) {

        this.notifyContactNameUpdated();

        this.structure.find("button.id_updateContact")
            .on("click", () => this.evtUpdateContact.post());

        this.structure.find("button.id_call")
            .on("click", () => this.evtVoiceCall.post());


        this.aSend.on("click", () => {

            let text = this.textarea.val();

            if (!text || text.match(/^\ +$/) ) {
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
        });


        for (let wdMessage of this.wdChat.messages) {

            this.newMessage(wdMessage, "MUTE");

        }

        this.unselect();

    }

    public setSelected() {

        this.structure.show({
            "duration": 0,
            "complete": () => {

                this.ul.slimScroll({ "scrollTo": this.ul.prop("scrollHeight") });

                this.textarea.trigger("focus");

                (this.textarea as any).autosize();

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

    private readonly uiBubbles = new Map<Wd.Message, UiBubble>();

    /** Place uiBubble in the structure, assume all bubbles already sorted */
    private placeUiBubble(uiBubble: UiBubble){

        let lis = this.ul.find("li");

        let getUiBubble_i: (i: number) => UiBubble = (() => {

            let uiBubbleArr = Array.from(this.uiBubbles.values());

            return i => uiBubbleArr.find(
                ({ structure }) => structure.get(0) === lis.get(i)
            )!;

        })();

        for (let i = lis.length - 1; i >= 0; i--) {

            let uiBubble_i = getUiBubble_i(i);

            if (uiBubble.time >= uiBubble_i.time) {

                uiBubble.structure.insertAfter(uiBubble_i.structure);

                return;

            }

        }

        this.ul.prepend(uiBubble.structure);

    }

    /** new Message or update existing one */
    public newMessage(wdMessage: Wd.Message, mute: "MUTE" | undefined= undefined) {

        if (this.uiBubbles.has(wdMessage)) {

            this.uiBubbles.get(wdMessage)!.structure.remove();

            this.uiBubbles.delete(wdMessage);

        }

        let uiBubble: UiBubble;

        if (wdMessage.direction === "INCOMING") {

            if (wdMessage.isNotification) {

                let uiBubbleIncomingNotification = new UiBubble.IncomingNotification(
                    wdMessage, this.wdChat, this.userSim
                );

                uiBubble = uiBubbleIncomingNotification;

            } else {

                if( !mute ){
                    ion.sound.play(this.isSelected?"water_droplet":"button_tiny");
                }

                let uiBubbleIncomingText = new UiBubble.IncomingText(
                    wdMessage, this.wdChat, this.userSim
                );

                uiBubble = uiBubbleIncomingText;


            }

        } else {

            let uiBubbleOutgoing = new UiBubble.Outgoing(wdMessage);

            uiBubble = uiBubbleOutgoing;

        }

        this.uiBubbles.set(wdMessage, uiBubble);

        this.placeUiBubble(uiBubble);

        if (this.isSelected) {

            this.ul.slimScroll({
                "scrollTo": this.ul.prop("scrollHeight")
            });

        } else {


        }


    }


}

class UiBubble {

    public readonly structure = html.templates.find("li").clone();

    public readonly time: number;

    constructor(
        public readonly wdMessage: Wd.Message
    ) {

        this.time = (() => {

            let wdMessage = this.wdMessage;

            let time: number | null = null;

            if (wdMessage.direction === "OUTGOING") {
                switch (wdMessage.status) {
                    case "STATUS REPORT RECEIVED":
                        time = wdMessage.deliveredTime || wdMessage.dongleSendTime;
                        break;
                    case "SEND REPORT RECEIVED":
                        time = wdMessage.dongleSendTime;
                        break;
                }
            }

            return time || wdMessage.time;

        })();

        this.structure.find("p.id_content")
            .html(wdMessage.text.split("\n").join("<br>"));

        this.structure.find("span.id_date")
            .html(moment.unix(~~(this.time / 1000)).format("Do MMMM H:mm"));

    }
}

namespace UiBubble {

    //TODO: notification
    export class IncomingText extends UiBubble {

        constructor(
            public readonly wdMessage: Wd.Message.Incoming.Text,
            public readonly wdChat: Wd.Chat,
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
            public readonly wdMessage: Wd.Message.Incoming.Notification,
            public readonly wdChat: Wd.Chat,
            public readonly userSim: types.UserSim.Usable
        ) {

            super(wdMessage);

            console.log("todo");

        }

    }

    export class Outgoing extends UiBubble {

        constructor(
            public readonly wdMessage: Wd.Message.Outgoing
        ) {

            super(wdMessage);

            this.structure.find("div.message")
                .addClass("out")
                .find("p.id_emitter")
                .html(
                    (this.wdMessage.sentBy.who === "MYSELF") ?
                        "Me" : this.wdMessage.sentBy.email
                )
                ;


            //TODO: 
            this.structure.find("p.id_content")
                .html(wdMessage.text.split("\n").join("<br>") + ` ${this.wdMessage.status}`);



        }


    }

}

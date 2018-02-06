import { loadHtml } from "./loadHtml";
import { types } from "../../../api";
import { phoneNumber } from "../../../shared";
//import { read as wdr } from "./data";
import { VoidSyncEvent, SyncEvent } from "ts-events-extended";
import Wd= types.WebphoneData;
import * as moment from "moment";

declare const require: any;
//declare const titlenotifier: any;
//declare const ion: any;

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

            this.newMessage(wdMessage);

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

    /*
    public get isSelected(): boolean {
        return this.structure.is(":visible");
    }
    */

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

    public newMessage(wdMessage: Wd.Message) {

        let uiBubble: UiBubble;

        if (wdMessage.direction === "INCOMING") {

            let uiBubbleIncoming = new UiBubbleIncoming(
                wdMessage, this.wdChat, this.userSim
            );

            uiBubble = uiBubbleIncoming;

        } else {

            let uiBubbleOutgoing = new UiBubbleOutgoing(wdMessage);

            uiBubble = uiBubbleOutgoing;

        }

        this.uiBubbles.set(wdMessage, uiBubble);


        let uiBubble_i: UiBubble | undefined = undefined;

        for (let i = this.wdChat.messages.length - 1; i >= 0; i--) {

            if (this.wdChat.messages[i] === wdMessage) {

                let wdMessage_i = this.wdChat.messages[i + 1];

                if (wdMessage_i) {
                    uiBubble_i = this.uiBubbles.get(wdMessage_i)!;
                }

                break;

            }

        }

        if (uiBubble_i) {

            uiBubble.structure.insertBefore(uiBubble_i.structure);

        } else {

            this.ul.append(uiBubble.structure);

        }

        if (this.ul.is(":visible")) {

            this.ul.slimScroll({
                "scrollTo": this.ul.prop("scrollHeight")
            });

        }


    }


}

class UiBubble {

    public readonly structure = html.templates.find("li").clone();

    constructor(
        public readonly wdMessage: Wd.Message.Base
    ) {


        this.structure.find("p.id_content")
            .html(wdMessage.text.split("\n").join("<br>"));

        this.structure.find("span.id_date")
            .html(moment.unix(wdMessage.time).format("Do MMMM H:mm"));



    }
}

//TODO: notification
class UiBubbleIncoming extends UiBubble {

    constructor(
        public readonly wdMessage: Wd.Message.Incoming,
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

class UiBubbleOutgoing extends UiBubble {

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

        this.updateStatus();

    }

    public updateStatus() {
        console.log(`TODO: change to ${this.wdMessage.status}`);
    }

}

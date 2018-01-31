/*
declare const require: any;
const EventEmitter = require("events");
declare const titlenotifier: any;
import * as pe from "./prototypeExtensions";
import { Widget } from "./Widget";
declare const ion: any;

pe.Function_.extendsClass(ChatWidget, Widget);

require("../templates/ChatWidget.less");

ChatWidget["loadTemplate"](
    require("../templates/ChatWidget.html")
);

export function ChatWidget(params) {

    Widget.call(this);

    this.structure.find("button.id_updateContact").on("click", this.emit.bind(this, "updateContact"));

    this.structure.find("button.id_call").on("click", this.emit.bind(this, "voiceCall"));

    let textarea: JQuery = this.structure.find("textarea");
    let send: JQuery = this.structure.find("a.id_send");

    send.on("click", () => {

        if (!textarea.html()) {
            return;
        }

        this.emit("send", textarea.val());

        textarea.val("");

        textarea.trigger("autosize.resizeIncludeStyle");

    });

    textarea.on("keypress", event=> {

        this.emit("checked");

        if (event.key === "Enter" && !event.shiftKey) {

            send.trigger("click");

            return false;
        }

    }).on("focus", ()=> this.emit("checked"));

    (this.structure as JQuery).find("ul").slimScroll({
        "position": "right",
        "distance": '0px',
        "railVisible": true,
        "height": '400px',
        "start": "bottom"
    });

    if (params.selected === undefined) {
        this.selected = false;
    }

    for (let prop in params) {
        this[prop] = params[prop];
    }

}


Object.defineProperties(
    ChatWidget.prototype,
    {
        "selected": {
            "set": function (bool) {

                if (bool) {

                    this.__selected__ = true;

                    this.structure.show({
                        "duration": 0,
                        "complete": ()=> {

                            let ul: JQuery = this.structure.find("ul");

                            ul.slimScroll({ "scrollTo": ul.prop("scrollHeight") });

                            (this.structure as JQuery).find("textarea").trigger("focus").autosize();

                        }
                    });

                } else {

                    this.__selected__ = false;

                    this.structure.hide();
                }

            },
            "get": function () {

                return this.__selected__ === true;

            }
        },
        "contact": {
            "get": function () {

                return this.__contact__;

            },
            "set": function (contact) {

                this.__contact__ = contact;


                if (contact.name) {
                    this.structure.find("span.id_name").html(contact.name);
                    this.structure.find("span.id_number").html(` ( ${contact.formatedNumber} ) `);
                } else {
                    this.structure.find("span.id_name").html("");
                    this.structure.find("span.id_number").html(contact.formatedNumber);
                }
            }
        },
        "messages": {
            "get": function () {

                if (this.__messages__ === undefined) {
                    this.__messages__ = Object.create(Array.prototype, this.getMessagesProperties());
                }

                return this.__messages__;

            },
            "set": function (setMessageDescriptor) {

                this.messages.empty();

                for (let number in setMessageDescriptor) {

                    this.insertMessage(setMessageDescriptor[number], true);

                }

            }
        }
    });

ChatWidget.prototype.getMessagesProperties = function () {

    return {
        "empty": {
            "value": function () {

                for (let message of this) {

                    this.delete(message);

                }

            }
        },
        "delete": {
            "value": function (message) {

                let i = this.indexOf(message);

                if (i !== -1) {
                    this.splice(i, 1).element.remove();
                }

            }
        },
        "push": {
            "value": function (message) {

                for (var i = 0, len = this.length; i < len; i++) {

                    if (message.date.getTime() < this[i].date.getTime()) {

                        message.element.insertBefore(this[i].element);

                        this.splice(i, 0, message);

                        return;

                    }

                }

                this.ul.append(message.element);

                if (this.ul.is(":visible")) {

                    (this.ul as JQuery).slimScroll({
                        "scrollTo": this.ul.prop("scrollHeight")
                    });

                }

                Array.prototype.push.call(this, message);

            }

        },
        "ul": {
            "value": this.structure.find("ul")
        }
    };


};


ChatWidget.prototype.insertMessage = function (messageDescriptor, mute) {

    if (messageDescriptor.incoming) {

        if (!mute) {

            if (this.selected) {
                ion.sound.play("water_droplet");
            } else {
                ion.sound.play("button_tiny");
            }

        }

        if (!window.focus) {
            titlenotifier.add();
        }


    }

    var element = this.templates.find("li").clone();

    this.messages.push(
        new Message(element, this.contact, messageDescriptor)
    );

};

pe.Function_.extendsClass(Message, EventEmitter);

function Message(
    element: JQuery, 
    contact, 
    messageDescriptor
) {

    EventEmitter.call(this);

    this.element = element;

    this.contact = contact;

    Object.assign(this, messageDescriptor);

    this.element.on("click", this.emit(this, "click"));

}

Object.defineProperties(Message.prototype, {
    "element": { "writable": true },
    "contact": { "writable": true },
    "indexOnContact": { "writable": true },
    "incoming": {
        "set": function (value) {

            if (value) {

                this.element.find("div.message").addClass("in");

                if (this.contact.name) {
                    this.element.find("p.id_emitter").html(this.contact.name);
                } else {
                    this.element.find("p.id_emitter").html(this.contact.formatedNumber);
                }
            } else {
                this.element.find("div.message").addClass("out").find("p.id_emitter").html("Me");
            }

            this.__incoming__ = value;

        },
        "get": function () {
            return this.__value__;
        }
    },
    "content": {
        "set": function (content) {


            this.element.find("p.id_content").html(content.split("\n").join("<br>"));

            this.__content__ = content;

        },
        "get": function () {
            return this.__content__;

        }
    },
    "date": {
        "set": function (date) {

            this.__date__ = date;

            this.element.find("span.id_date").html(this.__date__.toDateString());


        },
        "get": function () {
            return this.__date__;
        }
    }
});
*/

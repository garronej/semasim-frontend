import * as pe from "./prototypeExtensions";
import { Widget } from "./Widget";
declare const require: any;
const EventEmitter = require("events");

pe.Function_.extendsClass(ContactWidget, Widget);

ContactWidget["loadTemplate"](
    require("../templates/ContactWidget.html")
);

export function ContactWidget(params) {

    Widget.call(this);

    (this.structure as JQuery).find("ul").slimScroll({
        "position": "right",
        "distance": '0px',
        "railVisible": true,
        "height": '400px',
        "size": "5px"
    });

    this.simCountry = params.simCountry;

    this.eventHandlers = params.eventHandlers;
    this.contacts = params.contacts;

}


Object.defineProperty(
    ContactWidget.prototype,
    "contacts",
    {
        "set": function (setContactDescriptor) {

            this.contacts.empty();

            for (let number of Object.keys(setContactDescriptor)) {

                this.insertContact(setContactDescriptor[number], true);

            }

            this.updateSearch();


        },
        "get": function () {

            if (this.__contacts__ === undefined) {

                this.__contacts__ = Object.create(Object.prototype, this.getContactsProperties());

            }

            return this.__contacts__;

        }
    }
);


ContactWidget.prototype.getContactsProperties = function () {

    return {
        "selectedContact": {
            "writable": true,
            "value": null
        },
        "empty": {
            "value": function () {

                Object.keys(this).forEach(function (number) {

                    this.delete(number);

                }.bind(this));

            }
        },
        "delete": {
            "value": function (number) {

                var contact = this[number];

                if (contact) {

                    if (contact.selected) {
                        this.selectedContact = null;
                    }

                    contact.element.remove();

                    delete this[number]

                }

            }
        },
        "setSelected": {
            "value": function (number) {

                if (this.selectedContact) {

                    this.selectedContact.selected = false;

                }

                this[number].selected = true;

                this.selectedContact = this[number];

            }
        }
    };


};


ContactWidget.prototype.insertContact = function (contactDescriptor, skipUpdateSearch) {

    if (this.contacts[contactDescriptor.number]) {

        if (this.contacts[contactDescriptor.number].selected) {

            setTimeout(this.contacts.setSelected.bind(this.contacts, contactDescriptor.number), 0);

        }

        this.contacts.delete(contactDescriptor.number);

    }

    var widget = this;

    var element = widget.templates.find("li").clone();

    this.contacts[contactDescriptor.number] = new Contact(element, this.simCountry, contactDescriptor, {
        "click": function () {

            widget.contacts.setSelected(this.number);

            widget.emit("click", this);


        },
        "updated": function () {

            if (true || !this.selected) {

                widget.updatePosition(this);

            }

        }
    });

    if (!skipUpdateSearch) {

        this.updateSearch();

    }

};

ContactWidget.prototype.updateSearch = function () {

    (this.structure as JQuery).find("input").quicksearch(this.structure.find("ul li"));

    this.structure.find("ul").slimScroll({ "scrollTo": 0 });

};


ContactWidget.prototype.updatePosition = function (contact) {

    var lis = this.structure.find("ul li");

    for (var i = 0, len = lis.length; i < len; i++) {

        if (lis[i] === contact.element[0]) {
            continue;
        }

        let contact_i = this.contacts[lis.eq(i).attr("number")];

        if (contact.lastActivity.getTime() > contact_i.lastActivity.getTime()) {

            contact.element.insertBefore(contact_i.element);

            return;

        } else if (contact.lastActivity.getTime() === contact_i.lastActivity.getTime()) {

            if( pe.String_.lt( new String(contact.name), contact_i.name) ){

                contact.element.insertBefore(contact_i.element);

                return;

            }

        }

    }

    this.structure.find("ul").append(contact.element);

};

pe.Function_.extendsClass(Contact, EventEmitter);

function Contact(element, simCountry, contactDescriptor, eventHandlers) {

    EventEmitter.call(this);

    this.element = element;
    this.simCountry = simCountry;
    this.number = contactDescriptor.number;

    this.name= contactDescriptor.name;
    this.unreadMessages= contactDescriptor.unreadMessages;
    this.missedCalls= contactDescriptor.missedCalls;
    this.storedInSim= contactDescriptor.storedInSim;
    this.eventHandlers= contactDescriptor.eventHandlers;

    this.lastActivity = contactDescriptor.lastActivity;

    this.element.on("click", this.emit.bind(this, "click"));

}

Object.defineProperties(Contact.prototype, {
    "number": {
        "set": function (number) {

            this.element.attr("number", number);

            this.formatedNumber = (function () {

                return (intlTelInputUtils as any).formatNumber(
                    number, 
                    null, 
                    isNumberFromCountry( number, this.simCountry)?
                        intlTelInputUtils.numberFormat.NATIONAL :
                        intlTelInputUtils.numberFormat.INTERNATIONAL
                );

            }).call(this);

            this.element.find("span.id_number").html(this.formatedNumber);
            this.__number__ = number;

        },
        "get": function () {
            return this.__number__;
        }
    },
    "name": {
        "set": function (name) {

            if (name) {

                this.element.find("span.id_name").html(name);

                this.element.find("span.id_number").addClass("visible-lg-inline").html(
                    ` ( ${this.formatedNumber} ) `
                );

                this.__name__ = name;

            }
        },
        "get": function () {
            return this.__name__;

        }
    },
    "unreadMessages": {
        "set": function (n) {


            if (n > 0) {
                this.element.find("span.id_unreadMessages").html(n).stop().fadeIn(0);
            } else {

                n = 0;

                this.element.find("span.id_unreadMessages").fadeOut(2000);
                //this.element.find("span.id_unreadMessages").fadeIn(2000);

            }

            var prev = this.unreadMessages;

            this.__unreadMessages__ = n;

            if (this.lastActivity && n > prev) {
                this.lastActivity = new Date();
            }

        },
        "get": function () {

            return (this.__unreadMessages__ === undefined) ? 0 : this.__unreadMessages__;

        }
    },
    "missedCalls": {
        "set": function (n) {

            if (n > 0) {
                this.element.find("i.id_missedCalls").stop().fadeIn(0);
            } else {

                n = 0;

                this.element.find("i.id_missedCalls").fadeOut(2000);

            }

            var prev = this.missedCalls;

            this.__missedCalls__ = n;

            if (this.lastActivity && n > prev) {
                this.lastActivity = new Date();
            }

        },
        "get": function () {
            return (this.__missedCalls__ === undefined) ? 0 : this.__missedCalls__;
        }
    },
    "lastActivity": {
        "set": function (time) {

            if (time) {
                this.__lastActivity__ = new Date(time);
                this.element.addClass("chatData");
            } else {
                this.__lastActivity__ = new Date(0);
            }


            this.emit("updated");

        },
        "get": function () {
            return this.__lastActivity__;
        }
    },
    "selected": {
        "get": function () {
            return (this.__selected__ === true);

        },
        "set": function (value) {

            if (value) {
                this.element.addClass("selected");
                this.__selected__ = true;
            } else {
                this.element.removeClass("selected");
                this.__selected__ = false;
            }

        }

    }
});

function isNumberFromCountry(
    numberE164: string,
    countryIso2: string
): boolean {

    try {

        for (let countryData of $.fn.intlTelInput.getCountryData()) {

            if (countryData.iso2 === countryIso2.toLowerCase()) {

                return (numberE164.substring(1, countryData.dialCode.length + 1) === countryData.dialCode);

            }

        }

    } catch (error) {
        console.log("isNumberFromCountry error", error);
    }

    return false;

}

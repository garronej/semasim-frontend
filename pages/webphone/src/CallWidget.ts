declare const require: any;
const transform = require("sdp-transform");

import * as pe from "./prototypeExtensions";
import { Widget } from "./Widget";

pe.Function_.extendsClass(CallWidget, Widget);

CallWidget["loadTemplate"](
    require("../templates/CallWidget.html")
);

export function CallWidget(params) {

    Widget.call(this);

    this.number = params.number;

    (this.structure as JQuery).modal({
        "keyboard": false,
        "show": false,
        "backdrop": "static"
    });

    this.iceServers = [
        {
            "url": "stun:" + "ice.semasim.com" + ":53"
        },
        {
            "urls": [
                "turn:" + "ice.semasim.com" + ":53?transport=udp",
                "turn:" + "ice.semasim.com" + ":443?transport=tcp",
                "turns:" + "ice.semasim.com" + ":443?transport=tcp"
            ],
            "username": params.username,
            "credential": params.credential,
            "credentialType": "password"
        }
    ];


}


CallWidget.prototype.outgoingCall = function (contact, session) {

    console.log("outgoing call");

    this.openOutgoing(contact);

    var widget = this;

    session.on("addstream", function (data) {

        $("<audio>", { "autoplay": "", "src": window.URL.createObjectURL(data.stream) });

    }).on("failed", function (data) {

        widget.setState(CallWidget["TERMINATED"], data.originator + " " + data.cause);

    }).on("iceconnectionstatechange", function (data) {

        //console.info("iceconnectionstatechange", data.state );

        if (data.state !== "connected") return;

        setTimeout(function () { widget.setState(CallWidget["RINGBACK"], "remote ringing"); }, 3000);

        this.once("ended", function (data) {

            widget.setState(CallWidget["TERMINATED"], data.originator + " " + data.cause);

        });


    }).on("inCall", function () {

        widget.setState(CallWidget["ESTABLISHED"], "in call");

    }).on("sdp", onSdp);


    this.structure.find("button.id_ko").one("click", function () {

        try {
            session.terminate();

        } catch (error) {

            console.info("on a eut une erreur onTerminate", error.message);

        }


    });

    this.structure.one("hide.bs.modal", function () {

        this.structure.find("button.id_ok").off("click");
        this.structure.find("button.id_ko").off("click");

        try { session.terminate(); } catch (e) { }

    }.bind(this));

};


CallWidget.prototype.incomingCall = function (contact, session) {

    console.info("incoming call");

    this.openIncoming(contact);

    var widget = this;

    session.on("addstream", function (data) {

        $("<audio>", { "autoplay": "", "src": URL.createObjectURL(data.stream) });

    }).on("failed", function (data) {

        console.info("failed", data.originator + " " + data.cause, data);

        widget.setState(CallWidget["TERMINATED"], data.originator + " " + data.cause);

    }).on("iceconnectionstatechange", function (data) {

        console.info("iceconnectionstatechange", data.state, data);

        if (data.state !== "connected") return;

        this.once("ended", function (data) {

            widget.setState(CallWidget["TERMINATED"], data.originator + " " + data.cause);

        });

        widget.setState(CallWidget["ESTABLISHED"], "in call");

    }).on("sdp", onSdp);


    this.structure.find("button.id_ok").one("click", function () {

        session.answer({
            "mediaConstraints": {
                "audio": true,
                "video": false
            },
            "pcConfig": {
                "iceServers": widget.iceServers,
                "gatheringTimeoutAfterRelay": 700
            }
        });

        widget.setState(CallWidget["LOADING"], "Working...");

    });


    this.structure.find("button.id_ko").one("click", function () {

        try {
            session.terminate();

        } catch (error) {

            console.info("on a eut une erreur onTerminate", error.message);

        }

    });

    this.structure.one("hide.bs.modal", function () {

        this.structure.find("button.id_ok").off("click");
        this.structure.find("button.id_ko").off("click");

        try { session.terminate(); } catch (e) { }

    }.bind(this));


}


function onSdp(data) {

    var sdp = transform.parse(data.sdp);

    //console.info(sdp);

    var candidates = sdp.media[0].candidates;

    sdp.media[0].candidates = [];

    if (candidates === undefined) {
        console.info("candidates undefined!");
    }

    for (let candidate of candidates) {

        if (candidate.transport.match(/^tcp$/i)) {

            continue;

        }


        if (data.originator === "remote") {

            if (candidate.type === "host") {

                if (candidate.ip === sdp.connection.ip) {

                    //continue;

                } else {

                    //continue;

                }


            }

            if (candidate.type === "srflx") {

                continue;

            }


        }


        if (data.originator === "local") {

            if (candidate.type === "host") {

                //continue;

            }


            if (candidate.type === "srflx") {

                continue;

            }


            if (candidate.type === "relay") {

                //continue;

            }


        }



        sdp.media[0].candidates.push(candidate);



    }


    console.info("sdp", data.originator, JSON.stringify(sdp.media[0].candidates, null, "\t"));


    data.sdp = transform.write(sdp);


}


Object.defineProperties(CallWidget.prototype, {
    "number": {
        "set": function (number) {

            this.structure.find("span.id_me").html("Me ( " + number + " ) ");

            this.__number__ = number;

        },
        "get": function () {
            return this.__number__;
        }
    },
    "contact": {
        "set": function (contact) {
            if (contact.name) {

                this.structure.find("span.id_contact").html(contact.name + " ( " + contact.number + " ) ");

            } else {

                this.structure.find("span.id_contact").html(contact.number);

            }

            this.__contact__ = contact;
        },
        "get": function () {
            return this.__contact__;
        }
    }
});

CallWidget.prototype.openIncoming = function (contact) {

    this.contact = contact;

    this.structure.find("i[class^='im-arrow-']").addClass("hide");
    this.structure.find("i.im-arrow-left16").removeClass("hide");
    this.setState(CallWidget["RINGING"], "Incoming call");
    this.structure.modal("show");
};

CallWidget.prototype.openOutgoing = function (contact) {

    this.contact = contact;

    this.structure.find("i[class^='im-arrow-']").addClass("hide");
    this.structure.find("i.im-arrow-right17").removeClass("hide");
    this.setState(CallWidget["LOADING"], "working...");
    this.structure.modal("show");
};


CallWidget.prototype.setState = function (state, message) {

    this.structure.find("span[class^='im-']").addClass("hide");

    var spanTimer = this.structure.find("span.id_timer");

    if (spanTimer.timer instanceof Function) {
        spanTimer.timer("remove");
        spanTimer.html("");
    }

    //$.ionSound.stop("google");

    this.structure.find("button.id_ok").addClass("hide");
    this.structure.find("button.id_ko").addClass("hide");

    switch (state) {
        case CallWidget["RINGING"]:
            //$.ionSound.loop("google");
            this.structure.find("button.id_ok").removeClass("hide").html("Answer");
            this.structure.find("button.id_ko").removeClass("hide").html("Reject");
            this.structure.find("span.im-phone4").removeClass("hide");
            break;
        case CallWidget["RINGBACK"]:
            this.structure.find("span.im-phone4").removeClass("hide");
            this.structure.find("button.id_ko").removeClass("hide").html("Hangup");
            break;
        case CallWidget["ESTABLISHED"]:
            this.structure.find("button.id_ko").removeClass("hide").html("Hangup");
            spanTimer.timer("start");
            break;
        case CallWidget["ERROR"]:
            this.structure.find("span.im-sad").removeClass("hide");
            break;
        case CallWidget["LOADING"]:
            this.structure.find("button.id_ko").removeClass("hide").html("Cancel");
            this.structure.find("span.im-spinner2").removeClass("hide");
            break;
        case CallWidget["TERMINATED"]:
            this.structure.find("span.im-phone-hang-up").removeClass("hide");
            setTimeout(function () {
                this.structure.modal("hide");
            }.bind(this), 1500);
            break;
        default: break;
    }

    this.structure.find("span.id_status").html(message);

};

[
    "RINGING",
    "RINGBACK",
    "ESTABLISHED",
    "ERROR",
    "LOADING",
    "TERMINATED"
].forEach(function each(state, index) {
    CallWidget.prototype[state] = CallWidget[state] = index;
});




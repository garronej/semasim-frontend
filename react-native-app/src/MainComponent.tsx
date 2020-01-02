
import * as React from "react";
import * as rn from "react-native";
import { dialogApi } from "frontend-shared/dist/tools/modal/dialog";
import { restartApp } from "frontend-shared/dist/lib/restartApp";

const log: typeof console.log = true ?
    ((...args: any[]) => console.log(...["[MainComponent]", ...args])) :
    (() => { });

type Webphone = import("frontend-shared/dist/lib/Webphone").Webphone;


(async ()=>{

    while(true){

        await new Promise(resolve=> setTimeout(resolve,5000));

        log("tick");

    }

})();

log("imported");

async function makeTestCall(webphone: Webphone | undefined){

    if( webphone === undefined ){

        dialogApi.create("alert", { "message": "No sim registered" });

        return;
    }

    if( !webphone.obsIsSipRegistered.value ){

        dialogApi.create(
            "alert", 
            { "message": `SIP not registered, reachableSimState: ${JSON.stringify(webphone.userSim.reachableSimState)}` }
        );

        return;

    }

    log("Making test call");

    const wdChat = webphone.wdChats.find(o => o.contactNumber === "+33636786385")!;
    //const wdChat = webphone.wdChats.find(o => o.contactNumber === "666")!;
    //const wdChat= await webphone.getAndOrCreateAndOrUpdateWdChat("+33146094949");

    webphone.placeOutgoingCall(wdChat);

}



function attachWebphoneListeners(webphone: Webphone | undefined){

    if( webphone === undefined ){
        return;
    }

    if (attachWebphoneListeners.alreadyDone.indexOf(webphone) >= 0) {
        return;
    }

    log("attachWebphoneListeners");

    attachWebphoneListeners.alreadyDone.push(webphone);

    log(JSON.stringify({ "wdChats": webphone.wdChats }, null, 2));

    webphone.obsIsSipRegistered.evtChange.attach(
        isSipRegistered => log(`evtIsSipRegisteredValueChanged ${isSipRegistered}`)
    );

    webphone.evtUserSimUpdated.attach(evtData=> log("evtUserSimUpdated", evtData));

    webphone.wdEvts.evtNewOrUpdatedWdMessage.attach(evtData=> log("wdEvts.evtNewOrUpdatedWdMessage", evtData));

    webphone.wdEvts.evtNewUpdatedOrDeletedWdChat.attach(evtData=> log("wdEvts.evtNewUpdatedOrDeletedWdChat", evtData));

}

attachWebphoneListeners.alreadyDone = [] as Webphone[];


export type Props = { webphones: Webphone[] };

export class MainComponent extends React.Component<Props, {}> {

    constructor(props: any) {
        super(props);

        attachWebphoneListeners(this.props.webphones[0]);

    }

    public render = () => (
        <rn.View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
            <rn.TouchableOpacity
                style={{ backgroundColor: "blue" }}
                onPress={() => makeTestCall(this.props.webphones[0])}>
                <rn.Text>Start call</rn.Text>
            </rn.TouchableOpacity>
            <rn.TouchableOpacity
                style={{ backgroundColor: "grey", marginTop: 30 }}
                onPress={() => {

                    restartApp("User required to restart");

                }}>
                <rn.Text>Restart app</rn.Text>
            </rn.TouchableOpacity>
            <rn.TouchableOpacity
                style={{ backgroundColor: "red", marginTop: 30 }}
                onPress={() => {

                    dialogApi.create("alert", { "message": "Hello word" });

                    setTimeout(()=> {

                        restartApp("Testing restart after dialog");

                    }, 5000);

                }}>
                <rn.Text>Show dialog then restart</rn.Text>
            </rn.TouchableOpacity>
        </rn.View>
    );

}



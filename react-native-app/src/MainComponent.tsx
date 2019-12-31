

import * as React from "react";
import * as rn from "react-native";

import RNRestart from "react-native-restart";


const log: typeof console.log = true ?
    ((...args: any[]) => console.log.apply(console, ["[MainComponent]", ...args])) :
    (() => { });

type Webphone = import("frontend-shared/dist/lib/Webphone").Webphone;


(async ()=>{

    while(true){

        await new Promise(resolve=> setTimeout(resolve,5000));

        log("tick");

    }

})();

log("imported");

async function makeTestCall(webphone: Webphone){

    log("Making test call");


    const wdChat = webphone.wdChats.find(o => o.contactNumber === "+33636786385")!;
    //const wdChat = webphone.wdChats.find(o => o.contactNumber === "666")!;
    //const wdChat= await webphone.getAndOrCreateAndOrUpdateWdChat("+33146094949");

    webphone.placeOutgoingCall(wdChat);

}



function attachWebphoneListeners(webphone: Webphone){

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

                    log("Restarting app now");

                    RNRestart.Restart();

                }}>
                <rn.Text>Restart app</rn.Text>
            </rn.TouchableOpacity>
        </rn.View>
    );

}




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

    webphone.placeOutgoingCall(wdChat);

}



function attachWebphoneListeners(webphone: Webphone){

    if (attachWebphoneListeners.alreadyDone.indexOf(webphone) >= 0) {
        return;
    }

    console.log("attachWebphoneListeners");

    attachWebphoneListeners.alreadyDone.push(webphone);

    console.log(JSON.stringify({ "wdChats": webphone.wdChats }, null, 2));

    webphone.obsIsSipRegistered.evtChange.attach(
        isSipRegistered => console.log(`evtIsSipRegisteredValueChanged ${isSipRegistered}`)
    );

    webphone.evtUserSimUpdated.attach(evtData=> console.log("evtUserSimUpdated", evtData));

    webphone.wdEvts.evtNewOrUpdatedWdMessage.attach(evtData=> console.log("wdEvts.evtNewOrUpdatedWdMessage", evtData));

    webphone.wdEvts.evtNewUpdatedOrDeletedWdChat.attach(evtData=> console.log("wdEvts.evtNewUpdatedOrDeletedWdChat", evtData));

}

attachWebphoneListeners.alreadyDone = [] as Webphone[];


export type Props = { webphones: Webphone[] };

export class MainComponent extends React.Component<Props, {}> {

    public componentDidMount = () => {

        log("componentDidMount");

    };

    public componentWillUnmount = () => {

        log("componentWillUnmount");

    };

    constructor(props: any) {
        super(props);

        log("constructor");

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


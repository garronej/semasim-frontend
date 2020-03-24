
import * as React from "react";
import * as rn from "react-native";
import * as types from "frontend-shared/dist/lib/types";
import { id } from "frontend-shared/dist/tools/typeSafety/id";
import { Evt, NonPostable } from "frontend-shared/node_modules/evt";

const log: typeof console.log = true ?
    ((...args: any[]) => console.log(...["[MainComponent]", ...args])) :
    (() => { });

(async () => {

    while (true) {

        await new Promise(resolve => setTimeout(resolve, 5000));

        log("tick");

    }

})();

log("imported");

async function makeTestCall(
    params: {
        webphone: types.Webphone | undefined;
        dialogApi: import("frontend-shared/dist/tools/modal/dialog").DialogApi;
    }
) {

    const { webphone, dialogApi } = params;

    if (webphone === undefined) {

        dialogApi.create("alert", { "message": "No sim registered" });

        return;
    }

    if (!webphone.obsIsSipRegistered.value) {


    }

    const { userSim } = webphone;

    if (!(
        webphone.obsIsSipRegistered.value &&
        userSim.reachableSimState?.isGsmConnectivityOk &&
        userSim.reachableSimState.ongoingCall === undefined
    )) {

        dialogApi.create(
            "alert",
            { "message": `Can't call now: ${JSON.stringify(webphone.userSim.reachableSimState)}` }
        );

        return;

    }

    log("Making test call");

    const wdChat = webphone.wdChats.find(o => o.contactNumber === "+33636786385")!;
    //const wdChat = webphone.wdChats.find(o => o.contactNumber === "666")!;
    //const wdChat= await webphone.getAndOrCreateAndOrUpdateWdChat("+33146094949");

    webphone.placeOutgoingCall(wdChat);

}



function attachWebphoneListeners(
    params: {
        webphone: types.Webphone | undefined;
    }
) {

    const { webphone } = params;

    if (webphone === undefined) {
        return;
    }

    if (attachWebphoneListeners.alreadyDone.indexOf(webphone) >= 0) {
        return;
    }

    attachWebphoneListeners.alreadyDone.push(webphone);

    log("attachWebphoneListeners");

    log(JSON.stringify({ "wdChats": webphone.wdChats }, null, 2));

    webphone.obsIsSipRegistered.evtChange.attach(
        isSipRegistered => log(`evtIsSipRegisteredValueChanged ${isSipRegistered}`)
    );

    (Object.keys(webphone.userSimEvts) as (keyof typeof webphone.userSimEvts)[]).forEach(evtName =>
        id<NonPostable<Evt<any>>>(webphone.userSimEvts[evtName])
            .attach(eventData => log(`${evtName}: ${JSON.stringify(eventData, null, 2)}`))
    );

    (Object.keys(webphone.wdEvts) as (keyof typeof webphone.wdEvts)[]).forEach(evtName =>
        id<NonPostable<Evt<any>>>(webphone.wdEvts[evtName])
            .attach(eventData => log(`${evtName}: ${JSON.stringify(eventData, null, 2)}`))
    );


}

attachWebphoneListeners.alreadyDone = id<types.Webphone[]>([]);


export type Props = {
    dialogApi: import("frontend-shared/dist/tools/modal/dialog").DialogApi;
    restartApp: import("frontend-shared/dist/lib/restartApp").RestartApp;
    webphones: types.Webphone[];
    accountManagementApi: types.AccountManagementApi;
};

export class MainComponent extends React.Component<Props, {}> {

    constructor(props: any) {
        super(props);

        attachWebphoneListeners({ "webphone": this.props.webphones[0] });

    }

    public render = () => (
        <rn.View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
            <rn.TouchableOpacity
                style={{ backgroundColor: "blue" }}
                onPress={() => makeTestCall({
                    "webphone": this.props.webphones[0],
                    "dialogApi": this.props.dialogApi
                })}>
                <rn.Text>Start call</rn.Text>
            </rn.TouchableOpacity>
            <rn.TouchableOpacity
                style={{ backgroundColor: "grey", marginTop: 30 }}
                onPress={() => this.props.restartApp("User required to restart")}>
                <rn.Text>Restart app</rn.Text>
            </rn.TouchableOpacity>
            <rn.TouchableOpacity
                style={{ backgroundColor: "red", marginTop: 30 }}
                onPress={() => {

                    this.props.dialogApi.create("alert", { "message": "Hello word" });

                    setTimeout(
                        () => this.props.restartApp("Testing restart after dialog"),
                        5000
                    );

                }}>
                <rn.Text>Show dialog then restart</rn.Text>
            </rn.TouchableOpacity>
        </rn.View>
    );


}



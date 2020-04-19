
import * as React from "react";
import * as rn from "react-native";
import * as types from "frontend-shared/dist/lib/types";
import { id } from "frontend-shared/dist/tools/typeSafety/id";
import { Evt } from "frontend-shared/node_modules/evt";
import { Webphone } from "frontend-shared/dist/lib/types/Webphone";
import {objectKeys} from "frontend-shared/node_modules/evt/dist/tools/typeSafety";

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

    const wdChat = await webphone.getOrCreateWdChat({ "number_raw": "06 36 78 63 85" });

    const { canCall } = Webphone.canCallFactory(webphone);

    if (!canCall(wdChat.contactNumber)) {

        dialogApi.create(
            "alert",
            { "message": `Can't call now: ${JSON.stringify(webphone.userSim.reachableSimState)}` }
        );

        return;

    }

    log("Making test call");

    //const wdChat = webphone.wdChats.find(o => o.contactNumber === "666")!;
    //const wdChat= await webphone.getAndOrCreateAndOrUpdateWdChat("+33146094949");

    webphone.placeOutgoingCall(wdChat);

}





export type Props = {
    dialogApi: import("frontend-shared/dist/tools/modal/dialog").DialogApi;
    restartApp: import("frontend-shared/dist/lib/restartApp").RestartApp;
    webphones: types.Webphone[];
    accountManagementApi: types.AccountManagementApi;
};

export type State = {
    lastUserSimEvent: string;
    lastWdChatEvent: string;
    lastWdMessageEvent: string;
    isSipRegistered: boolean;

};

export class MainComponent extends React.Component<Props, State> {

    public readonly state: Readonly<State> = {
        lastUserSimEvent: "",
        lastWdChatEvent: "",
        lastWdMessageEvent: "",
        isSipRegistered: false
    };


    private ctx = Evt.newCtx();

    componentDidMount = () => {

        Evt.merge(
            objectKeys(this.props.accountManagementApi.userSimEvts)
                .map(key => Evt.factorize(this.props.accountManagementApi.userSimEvts[key]).pipe(this.ctx, () => [key] as const))
        ).attach(lastUserSimEvent => {
            console.log("root", { lastUserSimEvent });
            this.setState({ lastUserSimEvent });
        });

        //this.props.accountManagementApi.
        (() => {

            const [webphone] = this.props.webphones;

            if (!webphone) {
                return;
            }

            Evt.useEffect(
                () => this.setState({ "isSipRegistered": webphone.evtIsSipRegistered.state }),
                webphone.evtIsSipRegistered.evtChange.pipe(this.ctx)
            );

            Evt.merge(
                Object.entries(webphone.userSimEvts)
                    .map<Evt<string>>(
                        ([key, evt]) => Evt.factorize(evt)
                            .pipe(this.ctx, () => [key] as const)
                    )
            ).attach(lastUserSimEvent => console.log("delegate", { lastUserSimEvent }));


            webphone.wdEvts.evtWdChat.attach(this.ctx, ({ wdChat, ...rest }) => {
                log("lastWdChatEvent", rest);
                this.setState({ "lastWdChatEvent": JSON.stringify(rest) })
            });
            webphone.wdEvts.evtWdMessage.attach(this.ctx, ({ wdChat, wdMessage, ...rest }) => {
                log("lastWdMessageEvent", rest);
                this.setState({ "lastWdMessageEvent": JSON.stringify(rest) });
            });


        })();



    };

    componentWillUnmount = () => this.ctx.done();


    public render = () => (
        <rn.View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
            <rn.Text>Webphone count: {this.props.webphones.length}</rn.Text>
            <rn.Text>Logged with: {this.props.accountManagementApi.email}</rn.Text>
            <rn.Text>Last userSim event: {this.state.lastUserSimEvent}</rn.Text>
            <rn.Text>webphone[0] isSipRegistered: {`${this.state.isSipRegistered}`} </rn.Text>
            <rn.Text>webphone[0] data last chat event: {this.state.lastWdChatEvent} </rn.Text>
            <rn.Text>webphone[0] data last message event: {this.state.lastWdMessageEvent} </rn.Text>
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



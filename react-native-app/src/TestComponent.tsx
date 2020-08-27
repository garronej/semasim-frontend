
import * as React from "react";
import * as rn from "react-native";
import * as types from "frontend-shared/dist/lib/types";
import { Evt } from "frontend-shared/node_modules/evt";
import { Webphone } from "frontend-shared/dist/lib/types/Webphone";
import { phoneNumber as phoneNumberLib } from "frontend-shared/node_modules/phone-number/dist/lib";
import type { DialogApi } from "frontend-shared/dist/tools/modal/dialog";
import type { restartApp } from "frontend-shared/dist/lib/restartApp";

const log: typeof console.log = true ?
    ((...args: any[]) => console.log(...["[TestComponent]", ...args])) :
    (() => { });

(async () => {

    while (true) {

        await new Promise(resolve => setTimeout(resolve, 5000));

        log("tick!");

    }

})();

log("imported");

export type Props = {
    dialogApi: DialogApi
    restartApp: typeof restartApp,
    webphones: types.Webphone[];
    accountManagementApi: types.AccountManagementApi;
};

export type State = {
    prettyPhoneNumber: string;
    canCall: boolean;
};

export class TestComponent extends React.Component<Props, State> {

    private evtPhoneNumberRaw = Evt.create("06 36 78 63 85");
    private evtWebphone = Evt.create(this.props.webphones[0]);

    readonly state: Readonly<State> = {
        "prettyPhoneNumber": "",
        "canCall": false,
    };

    private ctx = Evt.newCtx();

    //Probably missing componentDidUpdate
    componentDidMount = () => {

        Evt.useEffect(
            prettyPhoneNumber => this.setState({ prettyPhoneNumber }),
            this.evtPhoneNumberRaw
                .pipe(
                    this.ctx,
                    phoneNumberRaw => [
                        phoneNumberLib.build(
                            phoneNumberRaw,
                            this.evtWebphone.state.userSim.sim.country?.iso
                        )]
                )
                .pipe(
                    phoneNumber => [
                        !phoneNumberLib.isDialable(phoneNumber) ?
                            "" : phoneNumber
                    ]
                )
                .pipe(
                    phoneNumber => [
                        !phoneNumber ? "" :
                            phoneNumberLib.prettyPrint(
                                phoneNumber,
                                this.evtWebphone.state.userSim.sim.country?.iso
                            )
                    ]
                ).evtChange
        );

        Webphone.useEffectCanCall(
            canCall => this.setState({ canCall }),
            {
                "ctx": this.ctx,
                "evtWebphone": Evt.loosenType(this.evtWebphone),
                "evtPhoneNumberRaw": this.evtPhoneNumberRaw
            }
        );


    };



    componentWillUnmount = () => this.ctx.done();


    private placePhoneCall = async () => {

        const webphone = this.evtWebphone.state;

        const wdChat = await webphone.getOrCreateWdChat({
            "number_raw": this.evtPhoneNumberRaw.state
        });

        webphone.placeOutgoingCall(wdChat);

    };



    public render = () => (
        <rn.View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
            <rn.Text>Logged with: {this.props.accountManagementApi.email}</rn.Text>

            <rn.Text>Selected sim: </rn.Text>
            <rn.Picker
                selectedValue={0}
                style={{ "height": 50, "width": 150 }}
                onValueChange={(itemValue) => this.evtWebphone.state = this.props.webphones[itemValue]}
            >
                {
                    this.props.webphones.map(
                        (...[webphone, i]) =>
                            (<rn.Picker.Item label={webphone.userSim.friendlyName} value={i} key={i} />)
                    )
                }
            </rn.Picker>

            <rn.Text>Phone number</rn.Text>
            <rn.TextInput
                style={{ height: 40, borderColor: 'gray', borderWidth: 1 }}
                onChangeText={text => this.evtPhoneNumberRaw.state = text}
                value={this.evtPhoneNumberRaw.state}
            />

            <rn.Button
                onPress={this.placePhoneCall}
                title={`Call ${this.state.prettyPhoneNumber}`}
                color="#841584"
                accessibilityLabel="Learn more about this purple button"
                disabled={!this.state.canCall}
            />

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

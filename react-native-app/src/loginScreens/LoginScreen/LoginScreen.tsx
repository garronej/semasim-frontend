import * as React from "react";
import * as rn from "react-native";
import { InputField } from "../../genericComponents/InputField";
import { w, h, getOrientation } from "../../lib/dimensions";
import { GetStarted } from "./GetStarted";
import * as imageAssets from "../../lib/imageAssets";
import { default as DeviceInfo } from "react-native-device-info";
import { VoidDeferred } from "frontend-shared/dist/tools/Deferred";

const log: typeof console.log = true ?
    ((...args: any[]) => console.log(...["[LoginScreen]", ...args])) :
    (() => { });

type Api = import("frontend-shared/dist/lib/pageLogic/login").LaunchLogin.Api;

export type Props = {
    dialogApi: import("frontend-shared/dist/tools/modal/dialog").DialogApi;
    launchLogin: import("frontend-shared/dist/lib/appLauncher/appLaunch")
    .appLaunch.AuthenticationStep.AuthenticationApi.NeedLogin["launchLogin"];
    email: string | undefined;
    goToRegister(): void;
};

export type State = {
    isEmailInputHighlightedInRed: boolean;
    isPasswordInputHighlightedInRed: boolean;
    isAwaitingLoginResponse: boolean;
};


log("imported");

export class LoginScreen extends React.Component<Props, State> {

    private readonly prApi: Promise<Api>;

    constructor(props_: any) {

        super(props_);

        log("Constructor");
        //TODO: confirm that it is reinstantiated every time we switch from 
        //register to login screen.

        this.prApi = this.dComponentDidMount.pr.then(
            () => this.props.launchLogin({
                "intent": {
                    "action": "LOGIN",
                    "email": this.props.email
                },
                "uiApi": {
                    "emailInput": {
                        "getValue": () => this.emailInput!.getInputValue(),
                        "setValue": email => this.emailInput!.setInputValue(email)
                    },
                    "passwordInput": {
                        "getValue": () => this.passwordInput!.getInputValue(),
                        "setValue": password => this.passwordInput!.setInputValue(password)
                    },
                    "triggerClickButtonLogin": () => this.onGetStartedClick(),
                    "redirectToRegister": () => this.props.goToRegister(),
                    //NOTE: start spinning until screen replaced
                    "onLoginSuccess": () => this.setState({ "isAwaitingLoginResponse": true })
                }
            })
        );


    }

    private dComponentDidMount = new VoidDeferred();

    public componentDidMount = this.dComponentDidMount.resolve;

    public readonly state: Readonly<State> = {
        "isEmailInputHighlightedInRed": false,
        "isPasswordInputHighlightedInRed": false,
        "isAwaitingLoginResponse": false
    };

    private emailInput: InputField | null = null;
    private passwordInput: InputField | null = null;

    private onGetStartedClick = async () => {

        const [email, password] = [this.emailInput!, this.passwordInput!]
            .map(input => input.getInputValue());

        await new Promise<void>(resolve =>
            this.setState(
                {
                    "isEmailInputHighlightedInRed": !email,
                    "isPasswordInputHighlightedInRed": !password,
                    "isAwaitingLoginResponse": !!email && !!password
                }, () => resolve()
            )
        );

        if (!this.state.isAwaitingLoginResponse) {

            this.props.dialogApi.create("alert", { "message": "Fill up all fields" });

            return;

        }

        (await this.prApi).login({
            "assertJsRuntimeEnv": "react-native",
            "getDeviceUniqIdentifier": () => DeviceInfo.getUniqueId()
        });


    };

    public render = () => (
        <rn.KeyboardAvoidingView
            style={({
                "height": h(100),
                "width": w(100),
            })}
            behavior="position"
            keyboardVerticalOffset={-h(30)}
        >

            <rn.View
                style={{
                    "height": "100%",
                    "width": "100%",
                    ...(getOrientation() === "LANDSCAPE" ? ({ "flexDirection": "row" }) : {})
                }}
            >


                <rn.View style={
                    getOrientation() === "PORTRAIT" ? ({ "height": "41%" }) : ({ "width": "50%" })
                }>
                    <rn.Image
                        style={({ "width": "100%", "height": "100%" })}
                        resizeMode="contain"
                        source={imageAssets.semasimLogo}
                    />
                </rn.View>

                <rn.View style={({
                    "flex": 1,
                    "paddingHorizontal": w(5),
                    justifyContent: "space-between"
                })} >

                    <rn.View>

                        <InputField
                            style={({ "marginTop": h(5.25) })}
                            placeholder="Email"
                            icon={imageAssets.email}
                            onSubmitEditing={() => {

                                this.setState({
                                    "isEmailInputHighlightedInRed": this.emailInput!.getInputValue() === ""
                                });
                                this.passwordInput!.focus();
                            }}
                            keyboardType="email-address"
                            error={this.state.isEmailInputHighlightedInRed}
                            ref={ref => this.emailInput = ref}
                        />

                        <InputField
                            style={({ "marginTop": h(2.25) })}
                            placeholder="Password"
                            icon={imageAssets.password}
                            onSubmitEditing={this.onGetStartedClick}
                            returnKeyType="done"
                            secureTextEntry={true}
                            blurOnSubmit={true}
                            error={this.state.isPasswordInputHighlightedInRed}
                            ref={ref => this.passwordInput = ref}
                        />


                    </rn.View>

                    <rn.View style={{ justifyContent: "flex-end" }}>


                        <GetStarted
                            style={({ "marginBottom": h(4), "backgroundColor": "#2B46AA" })}
                            click={this.onGetStartedClick}
                            isAwaitingLoginResponse={this.state.isAwaitingLoginResponse}
                        />


                        <rn.View
                            style={({ "marginBottom": h(7), "flexDirection": "row" })}
                        >
                            <rn.TouchableOpacity
                                onPress={() => this.props.goToRegister()}
                                style={({ "flex": 1, })}
                                activeOpacity={0.6}
                            >
                                <rn.Text >Create Account</rn.Text>
                            </rn.TouchableOpacity>
                            <rn.TouchableOpacity
                                style={({ "flex": 1, "flexDirection": "row-reverse" })}
                                onPress={async () => (await this.prApi).requestRenewPassword()}
                            >
                                <rn.Text >Forgot Password</rn.Text>
                            </rn.TouchableOpacity>

                        </rn.View>


                    </rn.View>


                </rn.View>


            </rn.View>


        </rn.KeyboardAvoidingView>
    );

}

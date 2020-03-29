import * as React from "react";
import * as rn from "react-native";
import { w, h, percentageOfDiagonalDp } from "../lib/dimensions";
import { InputField } from "../genericComponents/InputField";
import * as imageAssets from "../lib/imageAssets";
import { VoidDeferred } from "frontend-shared/dist/tools/Deferred";

const log: typeof console.log = true ?
    ((...args: any[]) => console.log(...["[RegisterScreen]", ...args])) :
    (() => { });

export type Props = {
    dialogApi: import("frontend-shared/dist/tools/modal/dialog").DialogApi;
    launchRegister: import("frontend-shared/dist/lib/appLauncher/appLaunch")
    .appLaunch.AuthenticationStep.AuthenticationApi.NeedLogin["launchRegister"];
    goToLogin(email?: string): void;
};

export type State = {
    isEmailInputHighlightedInRed: boolean;
    isPasswordInputHighlightedInRed: boolean;
    isRepeatPasswordInputHighlightedInRed: boolean;
    isAwaitingAccountCreationResponse: boolean;
};

log("imported");

export class RegisterScreen extends React.Component<Props> {

    private readonly dPrComponentDidMount = new VoidDeferred();
    public componentDidMount = this.dPrComponentDidMount.resolve;

    private readonly prApi = this.dPrComponentDidMount.pr.then(
        () => this.props.launchRegister({
            "email": undefined,
            "uiApi": {
                "emailInput": {
                    "setValue": ({ value, readonly }) => this.emailInput!.setInputValue(value),
                    "getValue": () => this.emailInput!.getInputValue()
                },
                "passwordInput": {
                    "getValue": () => this.passwordInput!.getInputValue()
                },
                "redirectToLogin": ({ email }) => this.props.goToLogin(email)
            }
        })
    );


    public readonly state: Readonly<State> = {
        "isEmailInputHighlightedInRed": false,
        "isPasswordInputHighlightedInRed": false,
        "isRepeatPasswordInputHighlightedInRed": false,
        "isAwaitingAccountCreationResponse": false
    };

    private emailInput: InputField | null = null;
    private passwordInput: InputField | null = null;
    private passwordRepeatInput: InputField | null = null;

    private onContinueClick = async () => {

        const [email, password, passwordRepeat] = [
            this.emailInput!,
            this.passwordInput!,
            this.passwordRepeatInput!
        ].map(input => input.getInputValue());

        await new Promise<void>(resolve => {

            const isEmailInputHighlightedInRed = !email;
            const isPasswordInputHighlightedInRed = !password;
            const isRepeatPasswordInputHighlightedInRed = password !== passwordRepeat;

            this.setState(
                {
                    isEmailInputHighlightedInRed,
                    isPasswordInputHighlightedInRed,
                    isRepeatPasswordInputHighlightedInRed,
                    "isAwaitingAccountCreationResponse": (
                        !isEmailInputHighlightedInRed &&
                        !isPasswordInputHighlightedInRed &&
                        !isRepeatPasswordInputHighlightedInRed
                    )
                }, () => resolve()
            );

        });

        if (!this.state.isAwaitingAccountCreationResponse) {

            this.props.dialogApi.create(
                "alert",
                { "message": "Not all fields are correctly filled up" }
            );

            return;
        }

        (await this.prApi).register();


    };

    public render = (() => {

        const Continue: React.FunctionComponent<{
            click(): void;
            isAwaitingAccountCreationResponse: boolean;
        }> = props => (
            <rn.TouchableOpacity
                activeOpacity={0.5}
                onPress={props.click}
                style={{
                    "width": w(85),
                    "alignSelf": "center",
                    "alignItems": "center",
                    "justifyContent": "center",
                    "backgroundColor": "transparent",
                    "paddingVertical": w(2),
                    "borderRadius": w(10),
                    "borderColor": "#E0E0E0",
                    "borderWidth": 1,
                    "marginTop": h(3),
                    "height": percentageOfDiagonalDp(7)
                }}>
                {props.isAwaitingAccountCreationResponse ?
                    <rn.ActivityIndicator
                        size="large"
                        style={{ "height": h(0.75) }}
                        color="black"
                    />
                    :
                    <rn.Text style={{
                        "color": "black",
                        "fontWeight": '600',
                        "paddingVertical": h(1),
                        "fontSize": percentageOfDiagonalDp(1.7)
                    }}>Continue</rn.Text>}
            </rn.TouchableOpacity>
        );

        return () => (<rn.KeyboardAvoidingView
            style={({
                "height": h(100),
                "width": w(100),
                "backgroundColor": "white"
            })}
            behavior="position"
            keyboardVerticalOffset={-h(30)}
        >
            <rn.View style={styles.container}>
                <rn.Text style={styles.create}>CREATE ACCOUNT</rn.Text>
                <InputField
                    placeholder="Email"
                    icon={imageAssets.email}
                    onSubmitEditing={() => {

                        this.setState({
                            "isEmailInputHighlightedInRed": !this.emailInput!.getInputValue()
                        });

                        this.passwordInput!.focus();

                    }}
                    keyboardType="email-address"
                    error={this.state.isEmailInputHighlightedInRed}
                    style={styles.input}
                    ref={ref => this.emailInput = ref}
                />
                <InputField
                    placeholder="Password"
                    icon={imageAssets.password}
                    onSubmitEditing={() => {

                        this.setState({
                            "isPasswordInputHighlightedInRed": !this.passwordInput!.getInputValue()
                        });

                        this.passwordRepeatInput!.focus();

                    }}
                    error={this.state.isEmailInputHighlightedInRed}
                    style={styles.input}
                    ref={ref => this.passwordInput = ref}
                    secureTextEntry={true}
                />
                <InputField
                    placeholder="Repeat Password"
                    icon={imageAssets.repeat}
                    onSubmitEditing={() => {

                        const isRepeatValid = (
                            !this.state.isPasswordInputHighlightedInRed &&
                            this.passwordRepeatInput!.getInputValue() ===
                            this.passwordInput!.getInputValue()
                        );

                        this.setState({
                            "isPasswordInputHighlightedInRed": !isRepeatValid,
                            "isRepeatPasswordInputHighlightedInRed": !isRepeatValid
                        });


                    }}
                    error={this.state.isRepeatPasswordInputHighlightedInRed}
                    style={styles.input}
                    ref={ref => this.passwordRepeatInput = ref}
                    secureTextEntry={true}
                    returnKeyType="done"
                    blurOnSubmit={true} //TODO: See what it does
                />
                <Continue
                    isAwaitingAccountCreationResponse={this.state.isAwaitingAccountCreationResponse}
                    click={this.onContinueClick}
                />
                <rn.TouchableOpacity
                    onPress={() => this.props.goToLogin()}
                    style={styles.touchable}
                >
                    <rn.Text style={styles.signIn}>{'<'} Sign In</rn.Text>
                </rn.TouchableOpacity>
            </rn.View>


        </rn.KeyboardAvoidingView>
        );


    })();

}

class styles {

    private static styleSheet = rn.StyleSheet.create({
        "container": {
            "width": "100%",
            "height": "100%",
            "alignItems": "center",
            "justifyContent": "center",
        },
        "create": {
            "color": "black",
            "fontSize": percentageOfDiagonalDp(1.96),
            "fontWeight": "700"
        },
        "signIn": {
            "color": "black",
            "fontSize": percentageOfDiagonalDp(1.63),
            "fontWeight": "700"
        },
        "touchable": {
            "alignSelf": "flex-start",
            "marginLeft": w(8),
            "marginTop": h(3)
        }
    });

    static container = styles.styleSheet.container;

    static get create() {
        return [
            styles.styleSheet.create,
            {
                "marginTop": h(5.25),
                "marginBottom": h(3),
            }
        ];
    }

    static signIn = styles.styleSheet.signIn;

    static touchable = styles.styleSheet.touchable;

    static get input() {
        return {
            "marginVertical": h(1.5)
        };
    }

}



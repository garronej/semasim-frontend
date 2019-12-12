import * as React from "react";
import * as rn from "react-native";
import { InputField } from "../../genericComponents/InputField";
import { w, h, getOrientation } from "../../lib/dimensions";
import { GetStarted } from "./GetStarted";
import * as imageAssets from "../../lib/imageAssets";
import * as loginPageLogic from "frontend-shared/dist/lib/pageLogic/loginPageLogic";
import { dialogApi } from "frontend-shared/dist/tools/modal/dialog";

import { default as DeviceInfo } from 'react-native-device-info';

//@ts-ignore: Ignore the fact that we do not have type definition.
import { default as uuidv3 } from "uuid/v3"

const log: typeof console.log = false ? console.log.bind(console) : () => { };

export type Props = {
  email: string | undefined;
  goToRegister: () => void;
  onLoggedIn: () => void;
};

export type State = {
  isEmailInputHighlightedInRed: boolean;
  isPasswordInputHighlightedInRed: boolean;
  isAwaitingLoginResponse: boolean;
}

log("[LoginScreen] imported");

export class LoginScreen extends React.Component<Props, State> {

  constructor(props: any) {

    super(props);

    log("[LoginScreen] constructor");

  }

  public componentDidMount = () => {

    log("[LoginScreen] componentDidMount");

    loginPageLogic.init({ "email": this.props.email }, {
      "setEmail": email => this.emailInput!.setInputValue(email),
      "setJustRegistered": justRegistered => this.justRegistered = justRegistered,
      "setPassword": password => this.passwordInput!.setInputValue(password),
      "triggerClickLogin": () => this.onGetStartedClick()
    })
      ;

  };

  public componentWillUnmount = () => {

    log("[LoginScreen] componentWillUnmount");

  };

  public readonly state: Readonly<State> = {
    "isEmailInputHighlightedInRed": false,
    "isPasswordInputHighlightedInRed": false,
    "isAwaitingLoginResponse": false
  };

  private justRegistered: Parameters<Parameters<typeof loginPageLogic.init>[1]["setJustRegistered"]>[0] | undefined = undefined;


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

      dialogApi.create("alert", { "message": "Fill up all fields" });

      return;

    }

    loginPageLogic.login(
      email,
      password,
      `"<urn:uuid:${uuidv3(DeviceInfo.getUniqueId(), (new Array(16)).fill(0))}>"`,
      this.justRegistered,
      {
        "loginSuccess": async () => this.props.onLoggedIn(),
        "resetPassword": () => {
          this.passwordInput!.setInputValue("");

          this.setState({
            "isAwaitingLoginResponse": false,
            "isEmailInputHighlightedInRed": true,
            "isPasswordInputHighlightedInRed": true
          });


        }
      }
    );

  };


  public render() {

    return (


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
                  onPress={() => loginPageLogic.requestRenewPassword({
                    "getEmail": () => this.emailInput!.getInputValue(),
                    "redirectToRegister": () => this.props.goToRegister(),
                    "setEmail": email => this.emailInput!.setInputValue(email)
                  })}
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
}

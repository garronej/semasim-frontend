import * as React from "react";
import * as rn from "react-native";
import { LoginScreen } from "./LoginScreen/LoginScreen";
import { RegisterScreen } from './RegisterScreen';
import * as imageAssets from "../lib/imageAssets";
import { tryLoginFromStoredCredentials } from "frontend-shared/dist/lib/procedure/tryLoginFromStoredCredentials";

const log: typeof console.log = false ? console.log.bind(console) : () => { };

export type Props = {
  onLoggedIn: () => void;
} & typeof defaultProps;

const defaultProps = {
  backgroundImage: null as (rn.ImageSourcePropType | null)
};

export type State = {
  currentScreen: State.ScreenName;
  email: string | undefined;
};

export declare namespace State {
  export type ScreenName = "login" | "register" | "checking";
}

export class LoginRouter extends React.Component<Props, State> {

  static readonly defaultProps = defaultProps;

  public readonly state: Readonly<State> = {
    "currentScreen": "checking" as const,
    "email": undefined
  };


  public componentDidMount = () => {

    log("[LoginRouter] componentDidMount");

  };

  public componentWillUnmount = () => {

    log("[LoginRouter] componentWillUnmount");

  };

  constructor(props: any) {
    super(props);

    log("[LoginRouter] constructor");

    tryLoginFromStoredCredentials().then(loginResult => {
      switch (loginResult) {
        case "LOGGED IN": this.props.onLoggedIn(); break;
        case "NO VALID CREDENTIALS": this.setState({ "currentScreen": "login" }); break;
      }
    });

  }

  public render() {

    switch (this.state.currentScreen) {
      case "checking":
        return <rn.Image
          style={({ "width": "100%", "height": "100%" })}
          resizeMode="contain"
          source={imageAssets.semasimLogo}
        />
      case "login":
        return <LoginScreen
          email={this.state.email}
          goToRegister={() => this.setState({ "currentScreen": "register" })}
          onLoggedIn={this.props.onLoggedIn}
        />;
      case "register":
        return <RegisterScreen
          goToLogin={email => this.setState({ "currentScreen": "login", email })}
        />;
    }

  }

}

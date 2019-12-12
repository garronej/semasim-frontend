import * as React from "react";
import { LoginScreen } from "./LoginScreen/LoginScreen";
import { RegisterScreen } from './RegisterScreen';
import * as imageAssets from "../lib/imageAssets";
import { tryLoginFromStoredCredentials } from "frontend-shared/dist/lib/tryLoginFromStoredCredentials";
import { SplashImage } from "../genericComponents/SplashImage";


const log: typeof console.log = true ?
    ((...args: any[]) => console.log.apply(console, ["[LoginRouter]", ...args])) :
    (() => { });

export type Props = {
} & typeof defaultProps;

const defaultProps = {
  onLoggedIn: undefined as ((() => void) | undefined)
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

    log("componentDidMount");

  };

  public componentWillUnmount = () => {

    log("componentWillUnmount");

  };

  constructor(props: any) {
    super(props);

    log("constructor");

    tryLoginFromStoredCredentials().then(loginResult => {

      log({loginResult});

      switch (loginResult) {
        case "LOGGED IN": this.props.onLoggedIn?.(); break;
        case "NO VALID CREDENTIALS": this.setState({ "currentScreen": "login" }); break;
      }
    });

  }

  public render() {

    switch (this.state.currentScreen) {
      case "checking":
        return <SplashImage imageSource={imageAssets.semasimLogo3} />;
      case "login":
        return <LoginScreen
          email={this.state.email}
          goToRegister={() => this.setState({ "currentScreen": "register" })}
          onLoggedIn={this.props.onLoggedIn ?? (() => { })}
        />;
      case "register":
        return <RegisterScreen
          goToLogin={email => this.setState({ "currentScreen": "login", email })}
        />;
    }

  }

}

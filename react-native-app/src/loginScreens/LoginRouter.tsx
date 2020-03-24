import * as React from "react";
import { LoginScreen } from "./LoginScreen/LoginScreen";
import { RegisterScreen } from './RegisterScreen';
import * as imageAssets from "../lib/imageAssets";
import { SplashImage } from "../genericComponents/SplashImage";
import { assert } from "frontend-shared/dist/tools/typeSafety/assert";


const log: typeof console.log = true ?
    ((...args: any[]) => console.log.apply(console, ["[LoginRouter]", ...args])) :
    (() => { });

export type Props = {
    authenticationApi: Omit<
        import("frontend-shared/dist/lib/appLauncher/appLaunch")
        .appLaunch.AuthenticationStep.AuthenticationApi.NeedLogin,
        "needLogin"
    >;
    dialogApi: import("frontend-shared/dist/tools/modal/dialog").DialogApi;
};

export type State = {
    currentScreen: State.ScreenName;
    email: string | undefined;
};

export declare namespace State {
    export type ScreenName = "login" | "register" | "checking";
}

export class LoginRouter extends React.Component<Props, State> {


    public readonly state: Readonly<State> = {
        "currentScreen": "checking" as const,
        "email": undefined
    };

    constructor(props_: any) {
        super(props_);

        this.props.authenticationApi.tryLoginWithStoredCredentialIfNotAlreadyLogedIn()
            .then(loginResult => {

                log({ loginResult });

                switch (loginResult) {
                    case "LOGGED IN": return;
                    case "NO VALID CREDENTIALS":
                        this.setState({ "currentScreen": "login" });
                        return;
                }

                assert(false);

            })
            ;

    }

    public render() {

        switch (this.state.currentScreen) {
            case "checking":
                return <SplashImage imageSource={imageAssets.semasimLogo3} />;
            case "login":
                return <LoginScreen
                    dialogApi={this.props.dialogApi}
                    launchLogin={this.props.authenticationApi.launchLogin}
                    email={this.state.email}
                    goToRegister={() => this.setState({ "currentScreen": "register" })}
                />;
            case "register":
                return <RegisterScreen
                    dialogApi={this.props.dialogApi}
                    launchRegister={this.props.authenticationApi.launchRegister}
                    goToLogin={email => this.setState({ "currentScreen": "login", email })}
                />;
        }

    }

}

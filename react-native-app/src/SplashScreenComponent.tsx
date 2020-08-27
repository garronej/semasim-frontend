import * as React from "react";
import { Dialog, api as dialogBaseApi, setComponentIsVisibleStateToImutableFalse } from "./globalComponents/Dialog";
import { LoginRouter } from "./loginScreens/LoginRouter";
import { TestComponent } from "./TestComponent";
import { NoBackendConnectionBanner, notConnectedUserFeedback } from "./globalComponents/NoBackendConnectionBanner";
import { evtBackgroundPushNotification } from "./lib/evtBackgroundPushNotification";
import * as imageAssets from "./lib/imageAssets";
import { SplashImage } from "./genericComponents/SplashImage";
import { id } from "frontend-shared/dist/tools/typeSafety/id";
import { getPrEvtPushNotificationToken } from "./lib/trackPushNotificationToken";
import { Evt } from "frontend-shared/node_modules/evt";

import { phoneCallUiCreateFactory } from "./lib/phoneCallUiCreateFactory";
import { appLaunch } from "frontend-shared/dist/lib/appLauncher/appLaunch";

const log: typeof console.log = true ?
    ((...args) => console.log(...["[SplashScreenComponent]", ...args])) :
    (() => { });


evtBackgroundPushNotification.attach(
    notYetDefined => log("Backend push notification! ", notYetDefined)
);

log("imported");

type AppLaunchOut = Pick<
    appLaunch.Out,
    "dialogApi" | "restartApp"
> & {
    prAuthenticationStep: Promise<appLaunch.AuthenticationStep.AuthenticationApi>;
};


const { appLaunchOut, prAccountManagementAndWebphones } = (() => {

    const appLaunchOut = appLaunch({
        "assertJsRuntimeEnv": "react-native",
        notConnectedUserFeedback,
        "actionToPerformBeforeAppRestart": () => setComponentIsVisibleStateToImutableFalse(),
        dialogBaseApi,
        "prEvtPushNotificationToken": getPrEvtPushNotificationToken()
    });

    return {
        "appLaunchOut": id<AppLaunchOut>(appLaunchOut),
        "prAccountManagementAndWebphones": (async () => {

            const { getAccountManagementApiAndWebphoneLauncher } =
                await appLaunchOut.prAuthenticationStep;

            const { accountManagementApi, getWebphones } =
                await getAccountManagementApiAndWebphoneLauncher({
                    "prReadyToDisplayUnsolicitedDialogs": Promise.resolve()
                });

            return {
                accountManagementApi,
                "webphones": await getWebphones({ phoneCallUiCreateFactory })
            };


        })()
    };


})();

export type State =
    {
        type: "SPLASH SCREEN";
    } | {
        type: "LOGIN";
    } & Omit<import("./loginScreens/LoginRouter").Props, "dialogApi"> | {
        type: "MAIN";
    } & Omit<import("./TestComponent").Props, "dialogApi" | "restartApp">
    ;



export class SplashScreenComponent extends React.Component<{}, State> {

    public setState(
        state: State,
        callback?: () => void
    ): void {

        log({ state });

        super.setState(state, () => callback?.());

    }

    public readonly state: Readonly<State> = { "type": "SPLASH SCREEN" };

    private ctx = Evt.newCtx();

    componentDidMount = () =>
        Evt.from(appLaunchOut.prAuthenticationStep).attachOnce(
            this.ctx,
            authenticationApi =>
                this.setState(
                    authenticationApi.needLogin ?
                        { "type": "LOGIN", authenticationApi } :
                        { "type": "SPLASH SCREEN" },
                    () => Evt.from(prAccountManagementAndWebphones).attachOnce(
                        this.ctx,
                        ({ accountManagementApi, webphones }) => this.setState({
                            "type": "MAIN",
                            accountManagementApi,
                            webphones
                        })
                    )
                )
        );

    componentWillUnmount = () => this.ctx.done();

    public render = () => [
        <Dialog key={0} />,
        <NoBackendConnectionBanner key={1} />,
        (() => {

            const { state } = this;

            switch (state.type) {
                case "SPLASH SCREEN":
                    return <SplashImage
                        key={2}
                        imageSource={imageAssets.semasimLogo2}
                    />;
                case "LOGIN":
                    return <LoginRouter
                        key={2}
                        dialogApi={appLaunchOut.dialogApi}
                        authenticationApi={state.authenticationApi}
                    />;
                case "MAIN":
                    return <TestComponent
                        key={2}
                        dialogApi={appLaunchOut.dialogApi}
                        restartApp={appLaunchOut.restartApp}
                        webphones={state.webphones}
                        accountManagementApi={state.accountManagementApi}
                    />;
            }

        })()
    ];


}



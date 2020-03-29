import * as React from "react";
import { Dialog, api as dialogBaseApi, setComponentIsVisibleStateToImutableFalse } from "./globalComponents/Dialog";
import { LoginRouter } from "./loginScreens/LoginRouter";
import { MainComponent } from "./MainComponent";
import { NoBackendConnectionBanner, notConnectedUserFeedback } from "./globalComponents/NoBackendConnectionBanner";
import { evtBackgroundPushNotification } from "./lib/evtBackgroundPushNotification";
import * as imageAssets from "./lib/imageAssets";
import { SplashImage } from "./genericComponents/SplashImage";
import { id } from "frontend-shared/dist/tools/typeSafety/id";
import { getPrObsPushNotificationToken } from "./lib/trackPushNotificationToken";
import { Evt } from "frontend-shared/node_modules/evt";
import { evtFromPromise } from "frontend-shared/dist/tools/evtFromPromise";

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


    console.log("ok it's updated");

    const appLaunchOut = appLaunch({
        "assertJsRuntimeEnv": "react-native",
        notConnectedUserFeedback,
        "actionToPerformBeforeAppRestart": () => setComponentIsVisibleStateToImutableFalse(),
        dialogBaseApi,
        "prObsPushNotificationToken": getPrObsPushNotificationToken()
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
    } & Omit<import("./MainComponent").Props, "dialogApi" | "restartApp">
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

    private static ctx= Evt.newCtx();

    constructor(props: any) {
        super(props);

        log("constructor");

        const { ctx } = SplashScreenComponent;

        ctx.done();

        evtFromPromise(appLaunchOut.prAuthenticationStep).attachOnce(
            ctx,
            authenticationApi =>
                this.setState(
                    authenticationApi.needLogin ? {
                        "type": "LOGIN",
                        authenticationApi
                    } : {
                            "type": "SPLASH SCREEN"
                        }
                )
        );

        evtFromPromise(prAccountManagementAndWebphones).attachOnce(
            ctx,
            ({ accountManagementApi, webphones }) => this.setState({
                "type": "MAIN",
                accountManagementApi,
                webphones
            })
        );

    }

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
                    return <MainComponent
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



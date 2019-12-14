import * as React from "react";
import { Dialog, api as dialogBaseApi } from "./globalComponents/Dialog";
import { LoginRouter } from "./loginScreens/LoginRouter";
import { MainComponent } from "./MainComponent";
import { NoBackendConnectionBanner, notConnectedUserFeedback } from "./globalComponents/NoBackendConnectionBanner";
import { evtBackgroundPushNotification } from "./lib/evtBackgroundPushNotification";
import { appLauncher } from "frontend-shared/dist/lib/appLauncher";
import * as imageAssets from "./lib/imageAssets";
import { SplashImage } from "./genericComponents/SplashImage";
import { id } from "frontend-shared/dist/tools/id";
import { phoneCallUiCreateFactory } from "./lib/phoneCallUiCreateFactory";

type Webphone = import("frontend-shared/dist/lib/Webphone").Webphone;

const log: typeof console.log = true ?
    ((...args: any[]) => console.log.apply(console, ["[SplashScreenComponent]", ...args])) :
    (() => { });


evtBackgroundPushNotification.attach(notYetDefined => {

    log("Backend push notification! ", notYetDefined);

});

log("imported");

const prAppLaunch = appLauncher(id<appLauncher.Params.ReactNative>({
    "assertJsRuntimeEnv": "react-native",
    notConnectedUserFeedback,
    dialogBaseApi,
    phoneCallUiCreateFactory
}));

export type State =
    {
        type: "SPLASH SCREEN";
    } | {
        type: "LOGIN";
    } | {
        type: "MAIN";
        webphones: Webphone[]
    };

export class SplashScreenComponent extends React.Component<{}, State> {

    public setState(
        state: State,
        callback?: () => void
    ): void {

        log({ state });

        super.setState(state, () => callback?.());

    }

    public readonly state: Readonly<State> = { "type": "SPLASH SCREEN" };

    constructor(props: any) {
        super(props);

        log("constructor");

        prAppLaunch.then(appLaunch =>
            this.setState(
                { "type": appLaunch.needLogin ? "LOGIN" : "SPLASH SCREEN" },
                () => appLaunch.prWebphones.then(webphones =>
                    this.setState({ "type": "MAIN", webphones })
                )
            )
        );

    }

    public render = () => [
        <Dialog key={0} />,
        <NoBackendConnectionBanner key={1} />,
        (() => {

            const { state } = this;

            switch (state.type) {
                case "SPLASH SCREEN":
                    return <SplashImage key={2} imageSource={imageAssets.semasimLogo2} />;
                case "LOGIN":
                    return <LoginRouter key={2} />;
                case "MAIN":
                    return <MainComponent key={2} webphones={state.webphones} />;
            }

        })()
    ];


}



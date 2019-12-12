
import * as React from "react";
import * as rn from "react-native";
import { appLifeCycleEvents, addAppLifeCycleListeners } from "./lib/appLifeCycle";
import { redrawOnRotate } from "./lib/redrawOnRotate";
import { fixDimensions } from "./lib/dimensions";
import { restartAppIfPushNotificationTokenChange, testForegroundPushNotification } from "./lib/restartAppIfPushNotificationTokenChange";
import * as imageAssets from "./lib/imageAssets";
import { SplashImage } from "./genericComponents/SplashImage";

const log: typeof console.log = true ?
    ((...args: any[]) => console.log.apply(console, ["[RootComponent]", ...args])) :
    (() => { });

let SplashScreenComponent: typeof import("./SplashScreenComponent").SplashScreenComponent;

log("imported");

const prDoneImporting = (async () => {

    const start = Date.now();

    log("Start Importing app logic");

    await import("./lib/importPolyfills")
        .then(({ run }) => run())

    await Promise.all(
        [
            import("./lib/evalDependencies"),
            import("./lib/exposeNativeModules")
        ].map(pr => pr.then(({ run }) => run()))
    );

    log(`Done pre importing ${Date.now() - start} !`);

    SplashScreenComponent = (await import("./SplashScreenComponent")).SplashScreenComponent;

})();


addAppLifeCycleListeners([
    redrawOnRotate,
    fixDimensions,
    restartAppIfPushNotificationTokenChange,
    testForegroundPushNotification
]);

type State = { isDoneImporting: boolean; };

class RootComponent extends React.Component<{}, State> {

    public readonly state: Readonly<State> = { "isDoneImporting": false };

    constructor(props: any) {

        super(props);

        log("constructor");

        appLifeCycleEvents.evtConstructor.post(this);

        prDoneImporting.then(() => this.setState({ "isDoneImporting": true }));

    }

    public componentDidMount = () => {

        log("componentDidMount");

        appLifeCycleEvents.evtComponentDidMount.post(this);

    };

    public componentWillUnmount = () => {

        log("componentWillUnmount");

        appLifeCycleEvents.evtComponentWillUnmount.post(this);

    };

    public render = () => (
        <rn.View
            style={{ flex: 1 /*, backgroundColor: "#1c17ad"*/ }}
            onLayout={layoutChangeEvent => appLifeCycleEvents.evtRootViewOnLayout.post({ layoutChangeEvent, "component": this })}
        >
            {!this.state.isDoneImporting ?
                <SplashImage imageSource={imageAssets.semasimLogo1} /> :
                <SplashScreenComponent />}
        </rn.View>
    );

}


            //{/*this.state.isDoneImporting && <SplashScreenComponent />*/}

export const componentProvider: rn.ComponentProvider = () => () => <RootComponent />;


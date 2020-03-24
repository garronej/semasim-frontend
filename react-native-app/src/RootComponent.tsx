
import * as React from "react";
import * as rn from "react-native";
import { appLifeCycleEvents, addAppLifeCycleListeners } from "./lib/appLifeCycle";
import { redrawOnRotate } from "./lib/redrawOnRotate";
import { fixDimensions } from "./lib/dimensions";
import { restartAppIfPushNotificationTokenChangeFacotry, testForegroundPushNotification } from "./lib/restartAppIfPushNotificationTokenChange";
import * as imageAssets from "./lib/imageAssets";
import { SplashImage } from "./genericComponents/SplashImage";
import { Deferred } from "frontend-shared/dist/tools/Deferred";

declare const process: any;
declare const window: any;

const log: typeof console.log = true ?
    ((...args: any[]) => console.log(...["[RootComponent]", ...args])) :
    (() => { });

log("imported");

let SplashScreenComponent: typeof import("./SplashScreenComponent").SplashScreenComponent;

const prDoneImporting = (async () => {

    process["argv"] = [];

    //NOTE: pbkdf2 module compat
    process["browser"] = true;

    {

        const start = Date.now();

        log("Start Importing app logic");

        /*
         * Need to be imported:
        * -Apis that are made available by browserify.
        * -Apis that are only available on the web. 
        * ( And for which we do not implement a native module or a separate .native.ts implementation )
        */
        await Promise.all([
            import("buffer/").then(({ Buffer }) => ({ Buffer })),
            import("util" as any).then(util => ({ util }))
        ]).then(wraps => wraps.forEach(wrap => Object.assign(window, wrap)));

        await Promise.all([
            import("static_js_libs/jssip_compat/jssip" as any)
                .then(JsSIP => Object.assign(window, { JsSIP })),
            import("./lib/exposeNativeModules").then(({ run }) => run())
        ]);

        log(`Done pre importing ${Date.now() - start} !`);

    }

    SplashScreenComponent = (await import("./SplashScreenComponent")).SplashScreenComponent;

})();


const dRestartApp = new Deferred<import("frontend-shared/dist/lib/restartApp").RestartApp>();

addAppLifeCycleListeners([
    redrawOnRotate,
    fixDimensions,
    restartAppIfPushNotificationTokenChangeFacotry({
        "prRestartApp": dRestartApp.pr
    }),
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

    public componentDidMount = () => appLifeCycleEvents.evtComponentDidMount.post(this);

    public componentWillUnmount = () => appLifeCycleEvents.evtComponentWillUnmount.post(this);

    public render = () => (
        <rn.View
            style={{ flex: 1 /*, backgroundColor: "#1c17ad"*/ }}
            onLayout={layoutChangeEvent => appLifeCycleEvents.evtRootViewOnLayout.post({ layoutChangeEvent, "component": this })}
        >
            {!this.state.isDoneImporting ?
                <SplashImage imageSource={imageAssets.semasimLogo1} /> :
                <SplashScreenComponent resolvePrRestartApp={dRestartApp.resolve} />}
        </rn.View>
    );

}

export const componentProvider: rn.ComponentProvider = () => () => <RootComponent />;


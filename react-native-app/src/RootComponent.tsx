
import * as React from "react";
import * as rn from "react-native";
import { appLifeCycleEvents, addAppLifeCycleListeners } from "./lib/appLifeCycle";
import { redrawOnRotate } from "./lib/redrawOnRotate";
import { fixDimensions } from "./lib/dimensions";
import { trackPushNotificationToken, testForegroundPushNotification } from "./lib/trackPushNotificationToken";
import * as imageAssets from "./lib/imageAssets";
import { SplashImage } from "./genericComponents/SplashImage";
import { Evt } from "frontend-shared/node_modules/evt";
import { evtFromPromise } from "frontend-shared/dist/tools/evtFromPromise";

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



addAppLifeCycleListeners([
    redrawOnRotate,
    fixDimensions,
    trackPushNotificationToken,
    testForegroundPushNotification
]);

type State = { isDoneImporting: boolean; };

class RootComponent extends React.Component<{}, State> {

    public readonly state: Readonly<State> = { "isDoneImporting": false };

    private static ctx = Evt.newCtx();

    constructor(props: any) {

        super(props);

        log("constructor");

        const { ctx } = RootComponent;

        ctx.done();

        appLifeCycleEvents.evtConstructor.post(this);

        evtFromPromise(prDoneImporting).attachOnce(
            ctx,
            () => this.setState({ "isDoneImporting": true })
        );

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
                <SplashScreenComponent />}
        </rn.View>
    );

}

export const componentProvider: rn.ComponentProvider = () => () => <RootComponent />;


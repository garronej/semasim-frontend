
import * as React from "react";
import * as rn from "react-native";
import { appLifeCycleEvents, addAppLifeCycleListeners } from "./lib/appLifeCycle";
import { redrawOnRotate } from "./lib/redrawOnRotate";
import { fixDimensions } from "./lib/dimensions";
import { restartAppIfPushNotificationTockenChange, testForegroundPushNotification  } from "./lib/restartAppIfPushNotificationTockenChange";

let RootComponent: typeof import("./RootComponent").RootComponent;

const log: typeof console.log = true ? console.log.bind(console) : () => { };

log("[PreloadComponent] imported");

const prDoneImporting = (async () => {

  log("Waiting next tick");

  await new Promise(resolve => setTimeout(resolve, 0));

  const start = Date.now();

  log("Start Importing (with premature optimizations!)");

  await import("./lib/importPolyfills")
      .then(({ run }) => run())

  await Promise.all([
    import("./lib/evalDependencies")
      .then(({ run }) => run()),
    import("./lib/exposeNativeModules")
      .then(({ run }) => run())
  ]);

  /*
  for (const prLib of [
    import("./lib/importPolyfills"),
    import("./lib/evalDependencies"),
    import("./lib/bridgeWithNative")
  ]) {
    await prLib.then(({ run }) => run());
  }
  */

  log(`Done pre importing ${Date.now() - start} !`);

  RootComponent = (await import("./RootComponent")).RootComponent;

})();


addAppLifeCycleListeners([
  redrawOnRotate, 
  fixDimensions, 
  restartAppIfPushNotificationTockenChange,
  testForegroundPushNotification
]);

type State = { isDoneImporting: boolean; };

class PreloadComponent extends React.Component<{}, State> {

  public readonly state: Readonly<State> = { "isDoneImporting": false };

  constructor(props: any) {

    super(props);

    log("[PreloadComponent] constructor !!!");

    appLifeCycleEvents.evtConstructor.post(this);

    prDoneImporting.then(() => this.setState({ "isDoneImporting": true }));

  }

  public componentDidMount = () => {

    log("[PreloadComponent] componentDidMount");

    appLifeCycleEvents.evtComponentDidMount.post(this);

  };

  public componentWillUnmount = () => {

    log("[PreloadComponent] componentWillUnmount");

    appLifeCycleEvents.evtComponentWillUnmount.post(this);

  };

  //TODO: suppress the image that slow down the loading
  public render = () => (
    <rn.View
      style={{ flex: 1 /*, backgroundColor: "#1c17ad"*/ }}
      onLayout={layoutChangeEvent => appLifeCycleEvents.evtRootViewOnLayout.post({ layoutChangeEvent, "component": this })}
    >
      {this.state.isDoneImporting && <RootComponent />}
    </rn.View>
  );

}


export const componentProvider: rn.ComponentProvider = () => () => <PreloadComponent />;


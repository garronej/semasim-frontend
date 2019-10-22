
import * as React from "react";
import * as rn from "react-native";
import * as dimensions from "./lib/dimensions";

let RootComponent: typeof import("./RootComponent").RootComponent;

const log: typeof console.log = true ? console.log.bind(console) : () => { };

log("[PreloadComponent] imported");

declare const window: any;

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

  log(`Done pre importing ${Date.now() - start}`);

  RootComponent = (await import("./RootComponent")).RootComponent;


})();

type State = { isDoneImporting: boolean; };

class PreloadComponent extends React.Component<{}, State> {

  public readonly state: Readonly<State> = { "isDoneImporting": false };

  constructor(props: any) {

    super(props);

    log("[PreloadComponent] constructor");

    prDoneImporting.then(() => this.setState({ "isDoneImporting": true }));

  }

  private handleDimensionChange = () => this.forceUpdate();

  public componentDidMount = () => {

    log("[PreloadComponent] componentDidMount");

    rn.Dimensions.addEventListener("change", this.handleDimensionChange);

  };

  public componentWillUnmount = () => {

    log("[PreloadComponent] componentWillUnmount");

    rn.Dimensions.removeEventListener("change", this.handleDimensionChange);

  };

  public onLayout = ({ nativeEvent: { layout } }: rn.LayoutChangeEvent) => {

    const { width, height } = layout;

    const { wasCorrected } = dimensions.overrideWindowDimensions({ width, height });

    if (!wasCorrected) {
      return;
    }

    this.forceUpdate();

  };

  //TODO: suppress the image that slow down the loading
  public render = () => (
    <rn.View style={{ flex: 1 /*, backgroundColor: "#1c17ad"*/ }} onLayout={this.onLayout}>
      {this.state.isDoneImporting && <RootComponent />}
    </rn.View>
  );

}


export const componentProvider: rn.ComponentProvider = () => () => <PreloadComponent />;


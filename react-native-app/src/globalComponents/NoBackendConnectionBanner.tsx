
import * as React from "react";
import * as rn from "react-native";
import { h } from "../lib/dimensions";
import { ObservableImpl } from "frontend-shared/node_modules/ts-events-extended";
import { id } from "frontend-shared/dist/tools/id";

const log: typeof console.log = true ?
    ((...args) => console.log(...["[globalComponents/NoBackendConnectionBanner]", ...args])) :
    (() => { });


const obsRef = new ObservableImpl<NoBackendConnectionBanner | undefined>(undefined);


type NotConnectedUserFeedback = import("frontend-shared/dist/lib/appLauncher/appLaunch")
    .appLaunch
    .Params
    .ReactNative["notConnectedUserFeedback"]
    ;

export const notConnectedUserFeedback = (() => {

    let timer: number | undefined = undefined;

    return id<NotConnectedUserFeedback>(state => {

        if (timer !== undefined) {
            clearTimeout(timer);
        }

        const setState = () => Promise.resolve(
            obsRef.value ??
            obsRef.evtChange.waitFor((ref): ref is NonNullable<typeof ref> => !!ref)
        ).then(ref => ref.setState({
            "isVisible": state.isVisible,
            ...(state.isVisible ? ({ "message": state.message }) : ({}))
        }));

        if (state.isVisible) {

            timer = setTimeout(() => setState(), 1700);

        } else {

            setState();

        }

    });



})();



export type Props = {};

export type State = {
    isVisible: boolean;
    message: string;
};


log("[NoBackendConnectionBanner] imported");


export class NoBackendConnectionBanner extends React.Component<Props, State> {

    public readonly state: Readonly<State> = { "isVisible": false, "message": "" };

    public componentDidMount = () => obsRef.onPotentialChange(this);

    public componentWillUnmount = () => obsRef.onPotentialChange(undefined);

    public render = () => this.state.isVisible ? (
        <rn.View style={{
            height: h(3),
            backgroundColor: "orange",
            width: "100%",
            alignItems: "center",
            justifyContent: "center"
        }}>
            <rn.Text>{this.state.message}</rn.Text>
        </rn.View>
    ) : null;

}


import * as React from "react";
import * as rn from "react-native";
import { h } from "../lib/dimensions";
import { Evt } from "frontend-shared/node_modules/evt";
import { id } from "frontend-shared/dist/tools/typeSafety/id";

const log: typeof console.log = true ?
    ((...args) => console.log(...["[globalComponents/NoBackendConnectionBanner]", ...args])) :
    (() => { });


const evtRef = Evt.create<NoBackendConnectionBanner | undefined>(undefined);


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
            evtRef.state ??
            evtRef.evtChange.waitFor(ref => !ref ? null : [ref])
        ).then(ref => state.isVisible ?
            ref.setState(state) :
            ref.setState(state)
        ); //^ To cope with the type system 

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


log("imported");


export class NoBackendConnectionBanner extends React.Component<Props, State> {

    public readonly state: Readonly<State> = { "isVisible": false, "message": "" };

    public componentDidMount = () => evtRef.state= this;

    public componentWillUnmount = () => evtRef.state= undefined;

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

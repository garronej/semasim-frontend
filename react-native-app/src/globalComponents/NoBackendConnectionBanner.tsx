
import * as React from "react";
import * as rn from "react-native";
import { h } from "../lib/dimensions";
import { SyncEvent } from "frontend-shared/node_modules/ts-events-extended";

//import { notConnectedUserFeedback } from "frontend-shared/dist/lib/toBackend/connection";


const log: typeof console.log = false ? console.log.bind(console) : () => { };

const evtRef = new SyncEvent<NoBackendConnectionBanner | undefined>();

let ref: NoBackendConnectionBanner | undefined = undefined;

evtRef.attach(newRef => ref = newRef);

/*
notConnectedUserFeedback.provideCustomImplementation(state =>
    Promise.resolve(
        ref ||
        evtRef.waitFor((ref): ref is NoBackendConnectionBanner => !!ref)
    ).then(ref =>
        ref.setState({
            "isVisible": state.isVisible,
            ...(state.isVisible ? ({ "message": state.message }) : ({}))
        })
    )
);
*/

type NotConnectedUserFeedback = import("frontend-shared/dist/lib/toBackend/connection")
    .ConnectParams
    .ReactNative["notConnectedUserFeedback"]
    ;

export const notConnectedUserFeedback: NotConnectedUserFeedback = (()=>{

    let timer: NodeJS.Timer | undefined = undefined;

    return (state: Parameters<NotConnectedUserFeedback>[0])=>{

        if (timer !== undefined) {
            clearTimeout(timer);
        }

        const setState = () => Promise.resolve(
            ref ||
            evtRef.waitFor((ref): ref is NonNullable<typeof ref> => !!ref)
        ).then(ref =>
            ref.setState({
                "isVisible": state.isVisible,
                ...(state.isVisible ? ({ "message": state.message }) : ({}))
            })
        );


        if (state.isVisible) {

            timer = setTimeout(() => setState(), 1700);

        } else {

            setState();

        }

    };


})();


export type Props = {};

export type State = {
    isVisible: boolean;
    message: string;
};


log("[NoBackendConnectionBanner] imported");


export class NoBackendConnectionBanner extends React.Component<Props, State> {


    public readonly state: Readonly<State> = { "isVisible": false, "message": "" };

    constructor(props: any) {
        super(props);

        log("[NoBackendConnectionBanner] constructor");

    }

    public componentDidMount = () => {

        log("[NoBackendConnectionBanner] componentDidMount");

        evtRef.post(this);

    };

    public componentWillUnmount = () => {

        log("[NoBackendConnectionBanner] componentWillUnmount");

        evtRef.post(undefined);


    };

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

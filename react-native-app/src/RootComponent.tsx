import * as React from "react";
import { Dialog } from "./globalComponents/Dialog";
import { LoginRouter } from "./loginScreens/LoginRouter";
import { PhoneScreen } from "./PhoneScreen";
import * as backendConnection from "frontend-shared/dist/lib/toBackend/connection";
import * as webApiCaller from "frontend-shared/dist/lib/webApiCaller";
import { VoidSyncEvent } from "frontend-shared/node_modules/ts-events-extended";
import { NoBackendConnectionBanner } from "./globalComponents/NoBackendConnectionBanner";

const log: typeof console.log = false ? console.log.bind(console) : () => { };


log("[RootComponent] imported");

const evtNeedLogin = new VoidSyncEvent();
const evtLoggedIn= new VoidSyncEvent();

backendConnection.connect(
    "REQUEST TURN CRED",
    () => {

        evtNeedLogin.post();

        return evtLoggedIn.waitFor();

    }
);

export type State = { isLoggedIn: boolean; };

export class RootComponent extends React.Component<{}, State> {

    public readonly state: Readonly<State> = { "isLoggedIn": false };

    public setState<K extends keyof State>(
        state: Pick<State, K>,
        callback?: () => void
    ): void {

        super.setState(state, () => {

            if (this.state.isLoggedIn) {
                evtLoggedIn.post();
            }

            if (!!callback) {
                callback();
            }

        });

    }


    constructor(props: any) {
        super(props);

        log("[RootComponent] constructor");

    }

    public componentDidMount = () => {

        log("[RootComponent] componentDidMount");

        evtNeedLogin.attach(this, () => this.setState({ "isLoggedIn": false }));

    };

    public componentWillUnmount = () => {

        log("[RootComponent] componentWillUnmount");

        evtNeedLogin.detach(this);

    };

    public render = () => [
        <Dialog key={0}/>,
        <NoBackendConnectionBanner key={1}/>,
        this.state.isLoggedIn ?
            <PhoneScreen key={2}/>
            :
            <LoginRouter key={2} onLoggedIn={() => this.setState({ "isLoggedIn": true })} />
    ];

}



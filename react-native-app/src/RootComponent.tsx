import * as React from "react";
import { Dialog } from "./globalComponents/Dialog";
import { LoginRouter } from "./loginScreens/LoginRouter";
import { PhoneScreen } from "./PhoneScreen";
import * as backendConnection from "frontend-shared/dist/lib/toBackend/connection";
import { VoidSyncEvent } from "frontend-shared/node_modules/ts-events-extended";
import { NoBackendConnectionBanner } from "./globalComponents/NoBackendConnectionBanner";
import { evtBackgroundPushNotification } from "./lib/evtBackgroundPushNotification";


const log: typeof console.log = true ?
    ((...args: any[]) => console.log.apply(console, ["[RootComponent]", ...args])) :
    (() => { });


log("[RootComponent] imported");

const evtNeedLogin = new VoidSyncEvent();
const evtLoggedIn= new VoidSyncEvent();

backendConnection.connect({
    "requestTurnCred": true,
    "login": () => {

        (async () => {

            if (evtLoggedIn.getHandlers().length === 0) {
                await evtNeedLogin.evtAttach.waitFor();
            }

            evtNeedLogin.post();

        })();

        return evtLoggedIn.waitFor();

    }
});

evtBackgroundPushNotification.attach(notYetDefined => {

    log("Backend push notification! ", notYetDefined);

});

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
        <Dialog key={0} />,
        <NoBackendConnectionBanner key={1} />,
        this.state.isLoggedIn ?
            <PhoneScreen key={2} />
            :
            <LoginRouter key={2} onLoggedIn={() => this.setState({ "isLoggedIn": true })} />
    ];

}



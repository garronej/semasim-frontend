
import { firebase } from '@react-native-firebase/messaging';
import * as rn from "react-native";
import { Deferred } from "frontend-shared/dist/tools/Deferred";
import { getApi as getNetworkStateMonitoringApi } from "frontend-shared/dist/lib/networkStateMonitoring";
import { backOff } from 'exponential-backoff';
import { Evt, StatefulReadonlyEvt, StatefulEvt } from "frontend-shared/node_modules/evt";

type AppLifeCycleListener = import("./appLifeCycle").AppLifeCycleListener;


export const testForegroundPushNotification: AppLifeCycleListener = ({ evtComponentDidMount, evtComponentWillUnmount }) => {

    evtComponentDidMount.attach(() => {

        const unsubscribe = firebase.messaging().onMessage(message => {
            // Process your message as required

            console.log("Push notification when the app was in foreground", message);

        });

        evtComponentWillUnmount.attachOnce(() => unsubscribe());

    });

};

let evtPushNotificationToken: StatefulEvt<string> | undefined = undefined;

const dEvtPushNotificationToken = new Deferred<StatefulReadonlyEvt<string>>();

export function getPrEvtPushNotificationToken() {
    return dEvtPushNotificationToken.pr;
}

export const trackPushNotificationToken: AppLifeCycleListener = ({ evtComponentDidMount, evtComponentWillUnmount }) => {

    if (rn.Platform.OS === "ios") {
        return;
    }

    const onToken = (token: string) => {

        console.log("Got token: ", token);

        if (evtPushNotificationToken === undefined) {

            dEvtPushNotificationToken.resolve(
                evtPushNotificationToken = new StatefulEvt(token)
            );

            return;

        }

        evtPushNotificationToken.state= token;

    };

    const firebaseCloudMessaging = firebase.messaging();

    getNetworkStateMonitoringApi().then(async connectivity => {

        const ctxToken = Evt.newCtx<string>();

        ctxToken.waitFor().then(token => onToken(token));

        const getToken = () => backOff(
            () => firebaseCloudMessaging.getToken(),
            {
                "retry": () => connectivity.getIsOnline(),
                "startingDelay": 0
            }
        )
            .then(tokenObj => ctxToken.done(tokenObj.toString()))
            .catch(() => { })
            ;

        connectivity.evtStateChange.attach(
            () => connectivity.getIsOnline(),
            ctxToken,
            () => getToken()
        );

        getToken();

    });

    evtComponentDidMount.attach(() => {

        const unsubscribe = firebaseCloudMessaging.onTokenRefresh(
            tokenObj => onToken(tokenObj.toString())
        );

        evtComponentWillUnmount.attachOnce(() => unsubscribe());

    });

};




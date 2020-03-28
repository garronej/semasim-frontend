
import { firebase } from '@react-native-firebase/messaging';
import * as rn from "react-native";
import { Deferred } from "frontend-shared/dist/tools/Deferred";
import { IObservable, Observable } from "frontend-shared/node_modules/evt";

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

let obsPushNotificationToken: Observable<string> | undefined = undefined;

const dObsPushNotificationToken = new Deferred<IObservable<string>>();

export function getPrObsPushNotificationToken() {
    return dObsPushNotificationToken.pr;
}

export const trackPushNotificationToken: AppLifeCycleListener = ({ evtComponentDidMount, evtComponentWillUnmount }) => {

    if (rn.Platform.OS === "ios") {
        return;
    }

    const firebaseCloudMessaging = firebase.messaging();


    evtComponentDidMount.attach(() => {

        const unsubscribe = firebaseCloudMessaging.onTokenRefresh(async token => {

            token= `${token}`;

            console.log("Got token: ", token);

            if (obsPushNotificationToken === undefined) {

                dObsPushNotificationToken.resolve(
                    obsPushNotificationToken = new Observable(token)
                );

                return;

            }

            obsPushNotificationToken.onPotentialChange(token);

        })

        evtComponentWillUnmount.attachOnce(() => unsubscribe());

    });

};




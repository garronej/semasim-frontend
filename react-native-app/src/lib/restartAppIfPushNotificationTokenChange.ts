
import { firebase } from '@react-native-firebase/messaging';
import * as rn from "react-native";
import { id } from "frontend-shared/dist/tools/typeSafety/id";

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

export function restartAppIfPushNotificationTokenChangeFacotry(
    params: {
        prRestartApp: Promise<import("frontend-shared/dist/lib/restartApp").RestartApp>
    }
) {

    const { prRestartApp } = params;

    return id<AppLifeCycleListener>(function restartAppIfPushNotificationTokenChange({ evtComponentDidMount, evtComponentWillUnmount }) {

        if (rn.Platform.OS === "ios") {
            return;
        }

        const firebaseCloudMessaging = firebase.messaging();

        const prToken = firebaseCloudMessaging.getToken();

        evtComponentDidMount.attach(() => {

            const unsubscribe = firebaseCloudMessaging.onTokenRefresh(async ({ token }: any) => {

                const previousToken = await prToken;

                if (token === previousToken) {
                    return;
                }

                (await prRestartApp)(
                    `Push notification token changed: new token: ${token}, previous token: ${previousToken}`
                );

            });

            evtComponentWillUnmount.attachOnce(() => unsubscribe());

        });

    });
}


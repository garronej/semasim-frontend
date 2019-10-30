
import { firebase } from '@react-native-firebase/messaging';
import { AppLifeCycleListener } from "./appLifeCycle";
import * as rn from "react-native";

import { restartApp } from "frontend-shared/dist/lib/restartApp";

export const testForegroundPushNotification: AppLifeCycleListener = ({ evtComponentDidMount, evtComponentWillUnmount })=> {

    evtComponentDidMount.attach(()=>{

        const unsubscribe = firebase.messaging().onMessage(message => {
            // Process your message as required

            console.log("Push notification when the app was in foreground", message);

        });

        evtComponentWillUnmount.attachOnce(()=> unsubscribe());

    });



};

export const restartAppIfPushNotificationTockenChange: AppLifeCycleListener = ({ evtComponentDidMount, evtComponentWillUnmount })=>{

    if( rn.Platform.OS === "ios") {
        return;
    }

    const firebaseCloudMessaging = firebase.messaging();

    const prToken = firebaseCloudMessaging.getToken();

    evtComponentDidMount.attach(()=>{

        const unsubscribe= firebaseCloudMessaging.onTokenRefresh(async token => {

            if( token === await prToken ){
                return;
            }

            //TODO: restart app
            restartApp();

        });

        evtComponentWillUnmount.attachOnce(()=> unsubscribe());

    });



}

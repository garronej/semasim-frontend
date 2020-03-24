
import * as rn from "react-native";

import { firebase } from '@react-native-firebase/messaging';
import { evtBackgroundPushNotification } from "../evtBackgroundPushNotification";
import * as hostKeepAlive from "../nativeModules/hostKeepAlive";
import * as exposeNativeModules  from "../exposeNativeModules";

const log: typeof console.log = true ?
    ((...args: any[]) => console.log.apply(console, ["[appEntryPoint.android]", ...args])) :
    (() => { });

log("Eval");

firebase.messaging().setBackgroundMessageHandler(async message => {

    log("Firebase Cloud Message received while app was in the background");

    if (evtBackgroundPushNotification.getHandlers().length === 0) {

        log("Waiting for an handler to be attached to evt");

        await evtBackgroundPushNotification.getEvtAttach().waitFor();

    }

    evtBackgroundPushNotification.post(message);

});

[exposeNativeModules, hostKeepAlive].forEach(
    ({ doHeadlessTaskRegistering }) => doHeadlessTaskRegistering(
        (...args) => rn.AppRegistry.registerHeadlessTask(...args)
    )
);

/*
AppRegistry.registerHeadlessTask("RNCallKeepBackgroundMessage", () => ({ name, callUUID, handle }) => {
    // Make your call here

    log("User wanted to make a call with semasim", { name, callUUID, handle });

    return Promise.resolve();

});


//AppRegistry.registerHeadlessTask("EndlessPhonyTask", () => () => new Promise<never>(() => { }));

AppRegistry.registerHeadlessTask("EndlessPhonyTask", () => () => {

    log("========> start keeping app alive");

    return new Promise<never>(() => { })

});
*/





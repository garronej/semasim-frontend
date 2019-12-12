
import { AppRegistry } from "react-native";

import { firebase } from '@react-native-firebase/messaging';
import { evtBackgroundPushNotification } from "../evtBackgroundPushNotification";

const log: typeof console.log = true ?
    ((...args: any[]) => console.log.apply(console, ["[appEntryPoint.android]", ...args])) :
    (() => { });

log("Eval");

firebase.messaging().setBackgroundMessageHandler(async message => {

  log("Firebase Cloud Message received while app was in the background");

  if( evtBackgroundPushNotification.getHandlers().length === 0 ){

    log("Waiting for an handler to be attached to evt");

    await evtBackgroundPushNotification.evtAttach.waitFor();

  }

  evtBackgroundPushNotification.post(message);

});


AppRegistry.registerHeadlessTask("RNCallKeepBackgroundMessage", () => ({ name, callUUID, handle }) => {
  // Make your call here

  log("User wanted to make a call with semasim", { name, callUUID, handle });

  return Promise.resolve();

});


AppRegistry.registerHeadlessTask("EndlessPhonyTask", () => () => new Promise<never>(() => { }));


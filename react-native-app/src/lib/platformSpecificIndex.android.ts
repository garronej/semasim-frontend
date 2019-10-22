
import { AppRegistry } from "react-native";

console.log("Eval platformSpecificIndex.android");

AppRegistry.registerHeadlessTask("RNCallKeepBackgroundMessage", () => ({ name, callUUID, handle }) => {
  // Make your call here

  console.log("User wanted to make a call with semasim", { name, callUUID, handle });

  return Promise.resolve();

});

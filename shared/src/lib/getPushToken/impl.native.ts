


declare const require: any;

//const { firebase }: typeof import("../../../../react-native-app/node_modules/@react-native-firebase/messaging/lib/index") = require("@react-native-firebase/messaging");
const { firebase }: any = require("@react-native-firebase/messaging");

const default_: import("./index").Default = ()=> firebase.messaging().getToken();

export default default_;



declare const require: any;

const { default: RNRestart }: typeof import("../../../../react-native-app/node_modules/@types/react-native-restart") = require("react-native-restart");

const default_: import("./index").Default = ()=> { 

    console.log("Restarting app");

    RNRestart.Restart();

};

export default default_;


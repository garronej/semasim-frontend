
declare const require: any;

const { default: RNRestart }: typeof import("../../../../react-native-app/node_modules/@types/react-native-restart") = require("react-native-restart");

const default_: import("./index").Default = reason=> { 

    console.log(`Restarting app, reason: ${reason}`);

    RNRestart.Restart();

    return new Promise<never>(()=>{});

};

export default default_;


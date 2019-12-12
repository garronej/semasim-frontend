
declare const require: any;

//const rn: typeof import("../../../../react-native-app/node_modules/@types/react-native") = require("react-native");
const rn: any = require("react-native");

const OS: 'ios' | 'android' | 'macos' | 'windows' | 'web' = rn.Platform.OS;

const isDevEnv= true;

const default_: import("./index").Env= {
    "assetsRoot": "https://static.semasim.com/",
    isDevEnv,
    "baseDomain": isDevEnv ? "dev.semasim.com" : "semasim.com",
    "jsRuntimeEnv": "react-native",
    "hostOs": (()=>{
        switch(OS){
            case "android": return "android";
            case "ios": return "ios";
            default: throw new Error("never");
        }
    })()
};

export default default_;

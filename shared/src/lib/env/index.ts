

/*
import { jsRuntimeEnv } from "./jsRuntimeEnv";

export { jsRuntimeEnv };

//NOTE: For web Defined at ejs building in templates/head_common.ejs, must be defined for react-native.
export const assetsRoot: string = jsRuntimeEnv === "react-native" ? "https://static.semasim.com/" : window["assets_root"];
export const isDevEnv: boolean = jsRuntimeEnv === "react-native" ? true : window["isDevEnv"];

export const baseDomain: "semasim.com" | "dev.semasim.com" = jsRuntimeEnv === "react-native" ?
    (isDevEnv ? "dev.semasim.com" : "semasim.com") :
    window.location.href.match(/^https:\/\/web\.([^\/]+)/)![1] as any
    ;
    */


export type Env = Env.Browser | Env.ReactNative;

export namespace Env {

    type _Common = {
        assetsRoot: string;
        isDevEnv: boolean;
        baseDomain: "semasim.com" | "dev.semasim.com";
    }

    export type Browser = _Common & {
        jsRuntimeEnv: "browser";
        hostOs: undefined;
    };

    export type ReactNative = _Common & {
        jsRuntimeEnv: "react-native";
        hostOs: "android" | "iOS"
    };

}

import env from "./impl";

export { env };









import { jsRuntimeEnv } from "./jsRuntimeEnv";

export { jsRuntimeEnv };

//NOTE: For web Defined at ejs building in templates/head_common.ejs, must be defined for react-native.
export const assetsRoot: string = jsRuntimeEnv === "react-native" ? "https://static.semasim.com/" : window["assets_root"];
export const isDevEnv: boolean = jsRuntimeEnv === "react-native" ? true : window["isDevEnv"];

export const baseDomain: "semasim.com" | "dev.semasim.com" = jsRuntimeEnv === "react-native" ?
    (isDevEnv ? "dev.semasim.com" : "semasim.com") :
    window.location.href.match(/^https:\/\/web\.([^\/]+)/)![1] as any
    ;

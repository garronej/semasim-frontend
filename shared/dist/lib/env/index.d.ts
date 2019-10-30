export declare type Env = Env.Browser | Env.ReactNative;
export declare namespace Env {
    type _Common = {
        assetsRoot: string;
        isDevEnv: boolean;
        baseDomain: "semasim.com" | "dev.semasim.com";
    };
    export type Browser = _Common & {
        jsRuntimeEnv: "browser";
        hostOs: undefined;
    };
    export type ReactNative = _Common & {
        jsRuntimeEnv: "react-native";
        hostOs: "android" | "iOS";
    };
    export {};
}
import env from "./impl";
export { env };

import { Webphone } from "./Webphone";
import * as connection from "./toBackend/connection";
import { baseTypes as dialogBaseTypes } from "../tools/modal/dialog";
export declare type Params = Params.Browser | Params.ReactNative;
export declare namespace Params {
    type Browser = {
        assertJsRuntimeEnv: "browser";
    };
    type ReactNative = {
        assertJsRuntimeEnv: "react-native";
        prPushNotificationToken: Promise<string>;
        notConnectedUserFeedback: connection.ConnectParams.ReactNative["notConnectedUserFeedback"];
        dialogBaseApi: dialogBaseTypes.Api;
    };
}
export declare function appLauncher(params: Params): Promise<{
    needLogin: boolean;
    prWebphones: Promise<Webphone[]>;
}>;

import { Webphone } from "./Webphone";
import * as connection from "./toBackend/connection";
import { baseTypes as dialogBaseTypes } from "../tools/modal/dialog";
import * as types from "./types/userSimAndPhoneCallUi";
export declare function appLauncher(params: appLauncher.Params): Promise<{
    needLogin: boolean;
    prWebphones: Promise<Webphone[]>;
}>;
export declare namespace appLauncher {
    type Params = Params.Browser | Params.ReactNative;
    namespace Params {
        type Base_ = {
            phoneCallUiCreateFactory: types.PhoneCallUi.CreateFactory;
        };
        export type Browser = Base_ & {
            assertJsRuntimeEnv: "browser";
        };
        export type ReactNative = Base_ & {
            assertJsRuntimeEnv: "react-native";
            notConnectedUserFeedback: connection.ConnectParams.ReactNative["notConnectedUserFeedback"];
            dialogBaseApi: dialogBaseTypes.Api;
        };
        export {};
    }
}

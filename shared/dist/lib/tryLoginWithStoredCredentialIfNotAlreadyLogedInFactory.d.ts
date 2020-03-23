export declare type Result = "LOGGED IN" | "NO VALID CREDENTIALS";
export declare type TryLoginWithStoredCredentialIfNotAlreadyLogedIn = ReturnType<typeof tryLoginWithStoredCredentialIfNotAlreadyLogedInFactory>;
export declare namespace tryLoginWithStoredCredentialIfNotAlreadyLogedInFactory {
    type Params = Params.Browser | Params.ReactNative;
    namespace Params {
        type Browser = {
            assertJsRuntimeEnv: "browser";
            webApi: Pick<import("./webApiCaller").WebApi, "WebApiError" | "isUserLoggedIn">;
        };
        type ReactNative = {
            assertJsRuntimeEnv: "react-native";
            Credentials: typeof import("./localStorage/Credentials").Credentials;
            webApi: Pick<import("./webApiCaller").WebApi, "WebApiError" | "isUserLoggedIn" | "loginUser">;
        };
    }
}
export declare function tryLoginWithStoredCredentialIfNotAlreadyLogedInFactory(params: tryLoginWithStoredCredentialIfNotAlreadyLogedInFactory.Params): () => Promise<Result>;

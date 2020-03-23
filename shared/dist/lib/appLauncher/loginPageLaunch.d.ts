import * as loginPageLogic from "../pageLogic/login";
export declare type Api = loginPageLogic.LaunchLogin.Api;
export declare function loginPageLaunch(params: {
    assertJsRuntimeEnv: "browser";
} & loginPageLogic.LaunchLogin.Params): Promise<Api>;

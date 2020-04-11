import * as registerPageLogic from "../pageLogic/register";
export declare type Api = registerPageLogic.LaunchRegister.Api;
export declare function registerPageLaunch(params: {
    assertJsRuntimeEnv: "browser";
} & registerPageLogic.LaunchRegister.Params): Promise<Api>;

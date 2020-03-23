import { AsyncReturnType } from "../../tools/typeSafety/AsyncReturnType";
export declare type LaunchRegister = ReturnType<typeof factory>;
export declare namespace LaunchRegister {
    type Api = AsyncReturnType<LaunchRegister>;
    type Params = {
        email: string | undefined;
        uiApi: {
            emailInput: {
                setValue(params: {
                    value: string;
                    readonly: boolean;
                }): void;
                getValue(): string;
            };
            passwordInput: {
                getValue(): string;
            };
            redirectToLogin(params: {
                email: string;
            }): void;
        };
    };
}
export declare function factory(params: {
    webApi: Pick<import("../webApiCaller").WebApi, "registerUser">;
    dialogApi: import("../../tools/modal/dialog").DialogApi;
    JustRegistered: typeof import("../localStorage/JustRegistered").JustRegistered;
}): (params: LaunchRegister.Params) => Promise<{
    register: () => Promise<void>;
}>;

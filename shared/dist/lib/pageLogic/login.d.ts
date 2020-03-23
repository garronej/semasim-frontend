import { AsyncReturnType } from "../../tools/typeSafety/AsyncReturnType";
export declare type LaunchLogin = ReturnType<typeof factory>;
export declare namespace LaunchLogin {
    type Api = AsyncReturnType<LaunchLogin>;
    type Params = {
        intent: {
            action: "VALIDATE EMAIL";
            email: string;
            code: string;
        } | {
            action: "RENEW PASSWORD";
            email: string;
            token: string;
        } | {
            action: "LOGIN";
            email: string | undefined;
        };
        uiApi: {
            emailInput: {
                getValue(): string;
                setValue(email: string): void;
            };
            passwordInput: {
                getValue(): string;
                setValue(password: string): void;
            };
            triggerClickButtonLogin(): void;
            redirectToRegister(): void;
            onLoginSuccess(params: {
                email: string;
                secret: string;
                towardUserEncryptKeyStr: string;
                towardUserDecryptKeyStr: string;
            }): void;
        };
    };
}
export declare function factory(params: {
    webApi: Pick<import("../webApiCaller").WebApi, "loginUser" | "validateEmail" | "renewPassword" | "sendRenewPasswordEmail">;
    dialogApi: import("../../tools/modal/dialog").DialogApi;
    JustRegistered: typeof import("../localStorage/JustRegistered").JustRegistered;
    TowardUserKeys: typeof import("../localStorage/TowardUserKeys").TowardUserKeys;
}): (params: LaunchLogin.Params) => Promise<{
    /**
     * Assert email and password fields have been validated,
     * Resolves when no more action ongoing.
     * */
    login: (params: {
        assertJsRuntimeEnv: "browser";
    } | {
        assertJsRuntimeEnv: "react-native";
        getDeviceUniqIdentifier: () => string;
    }) => Promise<void>;
    requestRenewPassword: () => Promise<void>;
}>;

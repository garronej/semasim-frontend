import * as availablePages from "../availablePages";
import { JustRegistered } from "../localStorage/JustRegistered";
/** uaInstanceId to provide only in react native */
export declare function login(email: string, password: string, uaInstanceId: string | undefined, justRegistered: JustRegistered | undefined, uiApi: {
    resetPassword: () => void;
    loginSuccess: (secret: string) => void;
}): Promise<void>;
export declare function init(params: availablePages.urlParams.Login, uiApi: {
    setEmail: (email: string) => void;
    setPassword: (password: string) => void;
    triggerClickLogin: () => void;
    setJustRegistered: (justRegistered: JustRegistered) => void;
}): Promise<void>;
export declare function requestRenewPassword(uiApi: {
    getEmail: () => string;
    setEmail: (email: string) => void;
    redirectToRegister: () => void;
}): Promise<void>;

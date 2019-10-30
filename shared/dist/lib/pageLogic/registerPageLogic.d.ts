import * as availablePages from "../availablePages";
export declare function init(params: availablePages.urlParams.Register, uiApi: {
    setEmailReadonly: (email: string) => void;
}): Promise<void>;
export declare function register(email: string, password: string, uiApi: {
    resetEmail: () => void;
    redirectToLogin: () => void;
}): Promise<void>;

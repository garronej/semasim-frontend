declare type ReadonlyArrayType<T> = T extends ReadonlyArray<infer R> ? R : never;
export declare type PageName = ReadonlyArrayType<typeof PageName.pagesNames>;
export declare namespace PageName {
    const pagesNames: readonly ["login", "register", "manager", "webphone", "subscription", "shop", "webviewphone"];
    const login: "login", register: "register", manager: "manager", webphone: "webphone", subscription: "subscription", shop: "shop", webviewphone: "webviewphone";
}
export declare namespace urlParams {
    type Common = {
        webview?: "true";
    };
    type Login = Common & {
        email?: string;
        email_confirmation_code?: string;
        renew_password_token?: string;
    };
    type Register = Common & {
        email?: string;
    };
}
export {};

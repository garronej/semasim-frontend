
type ReadonlyArrayType<T> = T extends ReadonlyArray<infer R> ? R : never;

export type PageName = ReadonlyArrayType<typeof PageName.pagesNames>;

export namespace PageName {

    export const pagesNames = [
        "login",
        "register",
        "manager",
        "webphone",
        "subscription",
        "shop"
    ] as const;

    export const [
        login,
        register,
        manager,
        webphone,
        subscription,
        shop
    ] = pagesNames;

}

export namespace urlParams {

    export type Common= {
        webview?: "true";
    };

    export type Login = Common & {
        email?: string;
        email_confirmation_code?: string;
        renew_password_token?: string;
    };

    export type Register = Common & {
        email?: string;
    };

}


export const apiPath = "api";

export namespace registerUser {

    export const methodName = "register-user";

    export type Params = {
        email: string;
        password: string;
    };

    export type Response = "CREATED" | "EMAIL NOT AVAILABLE";

}

export namespace loginUser {

    export const methodName = "login-user";

    export type Params = {
        email: string;
        password: string;
    };

    /** isGranted */
    export type Response = boolean;

}

export namespace logoutUser {

    export const methodName = "logout-user";

    export type Params = undefined;

    export type Response = undefined;

}

export namespace sendRenewPasswordEmail {

    export const methodName = "send-renew-password-email";

    export type Params = {
        email: string;
    };

    /** true if email exist */
    export type Response = boolean;

}


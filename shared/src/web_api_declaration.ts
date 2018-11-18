
export const apiPath = "api";

export namespace registerUser {

    export const methodName = "register-user";

    export type Params = {
        email: string;
        password: string;
    };

    export type Response = "CREATED" | "CREATED NO ACTIVATION REQUIRED" | "EMAIL NOT AVAILABLE";

}

export namespace validateEmail {

    export const methodName= "validate-email";

    export type Params = {
        email: string;
        activationCode: string;
    };

    export type Response = boolean;

}

export namespace loginUser {

    export const methodName = "login-user";

    export type Params = {
        email: string;
        password: string;
    };

    /** isGranted */
    export type Response = {
        status: "SUCCESS";
        user: number;
    } | {
        status: "NO SUCH ACCOUNT";
    } | {
        status: "WRONG PASSWORD";
        retryDelay: number;
    } | {
        status: "RETRY STILL FORBIDDEN"
        retryDelayLeft: number;
    } | {
        status: "NOT VALIDATED YET"
    };

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

export namespace renewPassword {

    export const methodName= "renew-password";

    export type Params= {
        email: string;
        newPassword: string;
        token: string;
    };

    /** return false if the token have expired */
    export type Response= boolean;

}

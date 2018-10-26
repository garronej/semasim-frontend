export declare const apiPath = "api";
export declare namespace registerUser {
    const methodName = "register-user";
    type Params = {
        email: string;
        password: string;
    };
    type Response = "CREATED" | "CREATED NO ACTIVATION REQUIRED" | "EMAIL NOT AVAILABLE";
}
export declare namespace validateEmail {
    const methodName = "validate-email";
    type Params = {
        email: string;
        activationCode: string;
    };
    type Response = boolean;
}
export declare namespace loginUser {
    const methodName = "login-user";
    type Params = {
        email: string;
        password: string;
    };
    /** isGranted */
    type Response = {
        status: "SUCCESS";
        user: number;
    } | {
        status: "NO SUCH ACCOUNT";
    } | {
        status: "WRONG PASSWORD";
        retryDelay: number;
    } | {
        status: "RETRY STILL FORBIDDEN";
        retryDelayLeft: number;
    } | {
        status: "NOT VALIDATED YET";
    };
}
export declare namespace logoutUser {
    const methodName = "logout-user";
    type Params = undefined;
    type Response = undefined;
}
export declare namespace sendRenewPasswordEmail {
    const methodName = "send-renew-password-email";
    type Params = {
        email: string;
    };
    /** true if email exist */
    type Response = boolean;
}
export declare namespace renewPassword {
    const methodName = "renew-password";
    type Params = {
        email: string;
        newPassword: string;
        token: string;
    };
    /** return false if the token have expired */
    type Response = boolean;
}

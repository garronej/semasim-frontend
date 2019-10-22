export declare type Result = "LOGGED IN" | "NO VALID CREDENTIALS";
export declare function tryLoginFromStoredCredentials(): Promise<Result>;

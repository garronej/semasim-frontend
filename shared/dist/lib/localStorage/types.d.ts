export declare const cookieKeys: {
    "JustRegistered": string;
    "TowardUserKeys": string;
};
export declare type TowardUserKeys = {
    encryptKey: import("crypto-lib").RsaKey.Public;
    decryptKey: import("crypto-lib").RsaKey.Private;
};
export declare type JustRegistered = {
    password: string;
    secret: string;
    towardUserKeys: TowardUserKeys;
    promptEmailValidationCode: boolean;
};

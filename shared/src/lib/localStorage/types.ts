
export const cookieKeys = {
    "JustRegistered": "just-registered",
    "TowardUserKeys": "toward-user-keys"
};

export type TowardUserKeys = {
    encryptKey: import("crypto-lib").RsaKey.Public;
    decryptKey: import("crypto-lib").RsaKey.Private;
};

export type JustRegistered = {
    password: string;
    secret: string;
    towardUserKeys:TowardUserKeys;
    promptEmailValidationCode: boolean;
};



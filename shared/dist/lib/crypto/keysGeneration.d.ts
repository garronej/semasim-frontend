import * as cryptoLib from "./cryptoLibProxy";
/** Must be called before using the async function */
export declare function preSpawnIfNotAlreadyDone(): void;
export declare namespace preSpawnIfNotAlreadyDone {
    var hasBeenCalled: boolean;
}
export declare function computeLoginSecretAndTowardUserKeys(params: {
    password: string;
    uniqUserIdentification: string;
}): Promise<{
    secret: string;
    towardUserKeys: import("../localStorage/TowardUserKeys").TowardUserKeys;
}>;
export declare namespace symmetricKey {
    function createThenEncryptKey(towardUserEncryptKey: cryptoLib.RsaKey.Public): Promise<string>;
    function decryptKey(towardUserDecryptor: cryptoLib.Decryptor, encryptedSymmetricKey: string): Promise<Uint8Array>;
}

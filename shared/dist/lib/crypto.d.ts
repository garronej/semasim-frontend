import * as cryptoLib from "crypto-lib";
import { TowardUserKeys } from "./localStorage/types";
/** Must be called before using the async function */
export declare function preSpawn(): void;
export declare function computeLoginSecretAndTowardUserKeys(password: string, uniqUserIdentification: string, kfdHostImplementation?: computeLoginSecretAndTowardUserKeys.Kfd): Promise<{
    "secret": string;
    towardUserKeys: TowardUserKeys;
}>;
export declare namespace computeLoginSecretAndTowardUserKeys {
    const kfdIterations = 500000;
    type Kfd = (password: string, salt: Uint8Array) => Promise<Uint8Array>;
    const kfdBrowserImplementation: (password: any, salt: any) => Promise<Uint8Array>;
}
export declare namespace symmetricKey {
    function createThenEncryptKey(towardUserEncryptKey: cryptoLib.RsaKey.Public): Promise<string>;
    function decryptKey(towardUserDecryptor: cryptoLib.Decryptor, encryptedSymmetricKey: string): Promise<Uint8Array>;
}

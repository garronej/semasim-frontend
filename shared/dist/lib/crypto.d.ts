declare type Param4<T> = T extends (p1: any, p2: any, p3: any, p4: infer R) => any ? NonNullable<R> : never;
import * as cryptoLib from "crypto-lib";
import { TowardUserKeys } from "./localStorage/types";
/** Must be called before using the async function */
export declare function preSpawn(): void;
export declare function computeLoginSecretAndTowardUserKeys(password: string, salt: string): Promise<{
    "secret": string;
    towardUserKeys: TowardUserKeys;
}>;
export declare namespace computeLoginSecretAndTowardUserKeys {
    function kdf(password: string, salt: string, progress: Param4<typeof cryptoLib.scrypt.hash>): Promise<Record<"digestP1" | "digestP2" | "digestP3" | "digestP4", Uint8Array>>;
    function buildLoginSecret(digests: Record<"digestP1" | "digestP2", Uint8Array>): string;
    function computeTowardUserKeys(digests: Record<"digestP3" | "digestP4", Uint8Array>): Promise<TowardUserKeys>;
}
export declare namespace symmetricKey {
    function createThenEncryptKey(towardUserEncryptKey: cryptoLib.RsaKey.Public): Promise<string>;
    function decryptKey(towardUserDecryptor: cryptoLib.Decryptor, encryptedSymmetricKey: string): Promise<Uint8Array>;
}
export {};

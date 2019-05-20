export * from "./types";
import * as types from "./types";
export declare function encryptorDecryptorFactory(key: Uint8Array): types.EncryptorDecryptor;
export declare function generateKey(): Promise<Uint8Array>;
export declare function generateTestKey(): Promise<Uint8Array>;

export * from "./types";
import * as types from "./types";
export declare function toBuffer(uint8Array: Uint8Array): {
    toString(encoding: "utf8" | "hex" | "base64" | "binary"): string;
};
export declare function stringifyThenEncryptFactory(encryptor: types.Encryptor): <T>(value: T) => string;
export declare namespace stringifyThenEncryptFactory {
    var stringRepresentationEncoding: "hex" | "base64" | "binary";
}
export declare function decryptThenParseFactory(decryptor: types.Decryptor): <T>(encryptedValue: string) => T;

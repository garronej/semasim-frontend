declare type ApiExposedToHost = {
    onAesEncryptOrDecryptResult(callRef: number, outputDataB64: string): void;
    onRsaEncryptOrDecryptResult(callRef: number, outputDataB64: string): void;
    onRsaGenerateKeysResult(callRef: number, publicKeyStr: string, privateKeyStr: string): void;
};
export declare const apiExposedToHost: ApiExposedToHost;
export declare function aesEncryptOrDecrypt(action: "ENCRYPT" | "DECRYPT", keyB64: string, inputDataB64: string): Promise<{
    outputDataB64: string;
}>;
export declare function rsaEncryptOrDecrypt(action: "ENCRYPT" | "DECRYPT", keyStr: string, inputDataB64: string): Promise<{
    outputDataB64: string;
}>;
export declare function rsaGenerateKeys(seedB64: string, keysLengthBytes: number): Promise<{
    publicKeyStr: string;
    privateKeyStr: string;
}>;
export {};

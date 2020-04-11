import * as cryptoLib from "crypto-lib";
export { Encryptor, Decryptor, EncryptorDecryptor, WorkerThreadId, RsaKey, scrypt, toBuffer, workerThreadPool, stringifyThenEncryptFactory, decryptThenParseFactory } from "crypto-lib";
export declare namespace aes {
    const generateKey: () => Promise<Uint8Array>;
    const encryptorDecryptorFactory: typeof cryptoLib.aes.encryptorDecryptorFactory;
}
export declare namespace rsa {
    const generateKeys: (seed: Uint8Array, keysLengthBytes: number, workerThreadId: cryptoLib.WorkerThreadId) => ReturnType<typeof cryptoLib.rsa.generateKeys>;
    const encryptorFactory: typeof cryptoLib.rsa.encryptorFactory;
    const decryptorFactory: typeof cryptoLib.rsa.decryptorFactory;
}

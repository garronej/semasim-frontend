import * as cryptoLib from "crypto-lib";
export { Decryptor, WorkerThreadId, RsaKey, scrypt, aes, toBuffer, workerThreadPool } from "crypto-lib";
export declare namespace rsa {
    const generateKeys: (seed: Uint8Array, keysLengthBytes: number, workerThreadId: cryptoLib.WorkerThreadId) => ReturnType<typeof cryptoLib.rsa.generateKeys>;
    const encryptorFactory: typeof cryptoLib.rsa.encryptorFactory;
    const decryptorFactory: typeof cryptoLib.rsa.decryptorFactory;
}

import * as cryptoLib from "crypto-lib";
import * as hostCrypto from "../nativeModules/hostCryptoLib";
import { env } from "../env";

export { Encryptor, Decryptor, WorkerThreadId, RsaKey, scrypt, aes, toBuffer, workerThreadPool } from "crypto-lib";


declare const Buffer: any;

if( env.jsRuntimeEnv === "react-native" ){

    cryptoLib.disableMultithreading();

}

export namespace rsa {

    export const generateKeys: (
        seed: Uint8Array,
        keysLengthBytes: number,
        workerThreadId: cryptoLib.WorkerThreadId
    ) => ReturnType<typeof cryptoLib.rsa.generateKeys> =
        env.jsRuntimeEnv === "browser" ?
            (...args) => cryptoLib.rsa.generateKeys(...args)
            :
            (seed, keysLengthBytes) => hostCrypto.rsaGenerateKeys(
                cryptoLib.toBuffer(seed).toString("base64"),
                keysLengthBytes
            ).then(keys => ({
                "publicKey": cryptoLib.RsaKey.parse(keys.publicKeyStr) as cryptoLib.RsaKey.Public,
                "privateKey": cryptoLib.RsaKey.parse(keys.privateKeyStr) as cryptoLib.RsaKey.Private
            }))
        ;

    export const encryptorFactory: typeof cryptoLib.rsa.encryptorFactory =
        env.jsRuntimeEnv === "browser" ?
            (...args) => cryptoLib.rsa.encryptorFactory(...args)
            :
            encryptKey => ({
                "encrypt": plainData => hostCrypto.rsaEncryptOrDecrypt(
                    "ENCRYPT",
                    cryptoLib.RsaKey.stringify(encryptKey),
                    cryptoLib.toBuffer(plainData).toString("base64")
                ).then(({ outputDataB64 }) => Buffer.from(outputDataB64, "base64") as Uint8Array)
            })
        ;


    export const decryptorFactory: typeof cryptoLib.rsa.decryptorFactory =
        env.jsRuntimeEnv === "browser" ?
            (...args) => cryptoLib.rsa.decryptorFactory(...args)
            :
            decryptKey => ({
                "decrypt": async encryptedData => 
                    hostCrypto.rsaEncryptOrDecrypt(
                        "DECRYPT",
                        cryptoLib.RsaKey.stringify(decryptKey),
                        cryptoLib.toBuffer(encryptedData).toString("base64")
                    ).then(({ outputDataB64 }) =>  Buffer.from(outputDataB64, "base64") as Uint8Array)
            });

}


type Param4<T> = T extends (p1, p2, p3, p4: infer R) => any ? NonNullable<R> : never;

import * as cryptoLib from "crypto-lib";
import { TowardUserKeys } from "./localStorage/types";
import * as bootbox_custom from "../tools/bootbox_custom";

declare const Buffer: any;

const workerThreadPoolId = cryptoLib.workerThreadPool.Id.generate();

let workerThreadIds: [
    cryptoLib.WorkerThreadId, 
    cryptoLib.WorkerThreadId, 
    cryptoLib.WorkerThreadId, 
    cryptoLib.WorkerThreadId
];

/** Must be called before using the async function */
export function preSpawn() {

    cryptoLib.workerThreadPool.preSpawn(workerThreadPoolId, 4);

    workerThreadIds = cryptoLib.workerThreadPool.listIds(workerThreadPoolId) as any;

}

export async function computeLoginSecretAndTowardUserKeys(password: string, salt: string) {

    const { kdf, buildLoginSecret, computeTowardUserKeys } = computeLoginSecretAndTowardUserKeys;

    const getMessage= (percent: number)=> `Generating cryptographic digest from password 🔐 ${percent.toFixed(0)}%`;

    bootbox_custom.loading(getMessage(0));

    const progress = (percent: number) =>
        $(`.${bootbox_custom.loading.spanClass}`)
            .html(getMessage(percent))
        ;

    const digests = await kdf(
        password,
        salt,
        percent => progress(percent)
    );

    bootbox_custom.loading(`Computing RSA keys using digest as seed 🔐`);

    const towardUserKeys = await computeTowardUserKeys(digests);

    bootbox_custom.dismissLoading();

    return {
        "secret": buildLoginSecret(digests),
        towardUserKeys
    };

}

export namespace computeLoginSecretAndTowardUserKeys {

    export async function kdf(
        password: string,
        salt: string,
        progress: Param4<typeof cryptoLib.scrypt.hash>
    ): Promise<Record<"digestP1" | "digestP2" | "digestP3" | "digestP4", Uint8Array>> {

        const percentages = workerThreadIds.map(() => 0);

        const digests = await Promise.all(
            workerThreadIds
                .map((_, i) => `${password}${i}`)
                .map((text, i) => cryptoLib.scrypt.hash(
                    text,
                    salt,
                    {
                        "n": 11,
                        "r": 12,
                        "p": 1,
                        "digestLengthBytes": 64
                    },
                    percent => {

                        percentages[i] = percent;

                        progress(
                            Math.floor(
                                percentages.reduce((prev, curr) => prev + curr, 0) / 4
                            )
                        );

                    },
                    workerThreadIds[i]
                ))
        );

        const out: any = {};

        digests.forEach((digest, i) => out[`digestP${i + 1}`] = digest);

        return out;

    }

    export function buildLoginSecret(digests: Record<"digestP1" | "digestP2", Uint8Array>): string {

        const { digestP1, digestP2 } = digests;

        return [digestP1, digestP2]
            .map(digest => cryptoLib.toBuffer(digest).toString("hex"))
            .join("")
            ;

    }

    export async function computeTowardUserKeys(digests: Record<"digestP3" | "digestP4", Uint8Array>): Promise<TowardUserKeys> {

        const { digestP3, digestP4 } = digests;

        const seed = new Uint8Array(digestP3.length + digestP4.length);
        seed.set(digestP3);
        seed.set(digestP4, digestP3.length);

        const { publicKey, privateKey } = await cryptoLib.rsa.generateKeys(
            seed,
            160,
            workerThreadIds[0]
        );

        return {
            "encryptKey": publicKey,
            "decryptKey": privateKey
        };

    };

}

export namespace symmetricKey {

    export async function createThenEncryptKey(
        towardUserEncryptKey: cryptoLib.RsaKey.Public
    ): Promise<string> {

        return cryptoLib.toBuffer(
            await cryptoLib.rsa.encryptorFactory(
                towardUserEncryptKey,
                workerThreadPoolId
            ).encrypt(
                await cryptoLib.aes.generateKey()
            )
        ).toString("base64");

    }

    export function decryptKey(
        towardUserDecryptor: cryptoLib.Decryptor,
        encryptedSymmetricKey: string
    ): Promise<Uint8Array> {

        return towardUserDecryptor.decrypt(
            Buffer.from(
                encryptedSymmetricKey,
                "base64"
            )
        );

    }

}





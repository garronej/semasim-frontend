
import * as cryptoLib from "crypto-lib";
import { TowardUserKeys } from "./localStorage/types";
import * as bootbox_custom from "../tools/bootbox_custom";
import { concatUint8Array, addPadding } from "crypto-lib/dist/sync/utils/binaryDataManipulations";

declare const Buffer: any;


const workerThreadPoolId = cryptoLib.workerThreadPool.Id.generate();
let workerThreadId: cryptoLib.WorkerThreadId;


/** Must be called before using the async function */
export function preSpawn() {

    cryptoLib.workerThreadPool.preSpawn(workerThreadPoolId, 1);

    workerThreadId = cryptoLib.workerThreadPool.listIds(workerThreadPoolId)[0];

}

export async function computeLoginSecretAndTowardUserKeys(
    password: string,
    uniqUserIdentification: string,
    kfdHostImplementation?: computeLoginSecretAndTowardUserKeys.Kfd
) {

    const { kfdBrowserImplementation } = computeLoginSecretAndTowardUserKeys;
    type Kfd = computeLoginSecretAndTowardUserKeys.Kfd;


    bootbox_custom.loading(`Generating cryptographic digest from password 🔐`);


    const [digest1, digest2] = await (async () => {

        //NOTE: scrypt("semasim.com"|| Padding to 100 || uniqUserId ) => 16 bytes
        const salt = await cryptoLib.scrypt.hash(
            (() => {

                const realm = Buffer.from("semasim.com", "utf8") as Uint8Array;

                return cryptoLib.toBuffer(
                    concatUint8Array(
                        realm,
                        addPadding(
                            "LEFT",
                            Buffer.from(uniqUserIdentification, "utf8"),
                            100 - realm.length
                        )
                    )
                ).toString("utf8");


            })(),
            "",
            {
                "n": 3,
                "digestLengthBytes": 16
            },
            undefined,
            workerThreadId
        );

        return Promise.all(
            [1, 2].map(async i => {

                //NOTE: We convert password to hex so we are sure to have a password
                //charset in ASCII. ( Java Modified UTF8 might cause problems ).
                const callKfd = (kfd: Kfd) => kfd(
                    Buffer.from(`${password}${i}`,"utf8").toString("hex"), 
                    salt
                );

                try {

                    return await callKfd(kfdBrowserImplementation);

                } catch (error) {


                    if (kfdHostImplementation === undefined) {

                        if( i === 1 ){
                            alert("Please use a different web browser");
                        }

                        throw error;

                    }

                    if( i === 1 ){

                        bootbox_custom.loading( `Please be patient this could take a while 🔐`);

                    }

                    return callKfd(kfdHostImplementation);

                }


            })
        );


    })();


    bootbox_custom.loading(`Computing RSA keys using digest as seed 🔐`);

    const towardUserKeys: TowardUserKeys = await (async (seed: Uint8Array) => {

        const { publicKey, privateKey } = await cryptoLib.rsa.generateKeys(
            seed,
            160,
            workerThreadId
        );

        return {
            "encryptKey": publicKey,
            "decryptKey": privateKey
        };

    })(digest2);

    bootbox_custom.dismissLoading();

    return {
        "secret": cryptoLib.toBuffer(digest1).toString("hex"),
        towardUserKeys
    };

}

export namespace computeLoginSecretAndTowardUserKeys {

    export const kfdIterations= 500000;

    export type Kfd = (password: string, salt: Uint8Array) => Promise<Uint8Array>;

    export const kfdBrowserImplementation = async (password, salt) => new Uint8Array(
        await window.crypto.subtle.deriveBits(
            {
                "name": "PBKDF2",
                salt,
                "iterations": kfdIterations,
                "hash": "SHA-1"
            },
            await window.crypto.subtle.importKey(
                "raw",
                Buffer.from(password, "utf8"),
                { "name": "PBKDF2" } as any,
                false,
                ["deriveBits"]
            ),
            256,
        )
    );


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





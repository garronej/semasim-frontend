
//import * as cryptoLib from "crypto-lib";
import * as cryptoLib from "./cryptoLibProxy";
type TowardUserKeys= import("../localStorage/TowardUserKeys").TowardUserKeys;
import { dialogApi } from "../../tools/modal/dialog";
import { concatUint8Array, addPadding } from "crypto-lib/dist/sync/utils/binaryDataManipulations";
import { kfd } from "./kfd";

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
) {

    dialogApi.loading(`Generating cryptographic digest from password 🔐`, 0);

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

                try {

                    //NOTE: We convert password to hex so we are sure to have a password
                    //charset in ASCII. ( Java Modified UTF8 might cause problems ).
                    return await kfd(
                        Buffer.from(`${password}${i}`, "utf8").toString("hex"),
                        salt,
                        100000
                    );

                } catch (error) {

                    if (i === 1) {
                        alert("Please use a different web browser");
                    }

                    throw error;

                }


            })
        );


    })();

    dialogApi.loading(`Computing RSA keys using digest as seed 🔐`);

    await new Promise(resolve => setTimeout(resolve, 100));

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

    dialogApi.dismissLoading();

    return {
        "secret": cryptoLib.toBuffer(digest1).toString("hex"),
        towardUserKeys
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





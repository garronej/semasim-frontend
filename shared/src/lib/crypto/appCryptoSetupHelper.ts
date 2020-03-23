
import * as cryptoLib from "./cryptoLibProxy";
import * as crypto from "./keysGeneration";

type TowardUserKeys= import("../localStorage/TowardUserKeys").TowardUserKeys;

/** When creating a new Ua instance an encryptor must be provided
 * so we expose the reference of the rsa thread */
const rsaWorkerThreadPoolId = cryptoLib.workerThreadPool.Id.generate();

/** 
 * ASSERT: User logged.
 * */
export async function appCryptoSetupHelper(
    params: {
        towardUserKeys: TowardUserKeys;
        encryptedSymmetricKey: string;
    }
): Promise<{
    paramsNeededToInstantiateUa: {
        towardUserEncryptKeyStr: string;
        towardUserDecryptor: cryptoLib.Decryptor;
        getTowardSimEncryptor: (userSim: { towardSimEncryptKeyStr: string; }) => { towardSimEncryptor: cryptoLib.Encryptor; }
    };
    paramsNeededToEncryptDecryptWebphoneData: {
        encryptorDecryptor: cryptoLib.EncryptorDecryptor;
    }
}> {

    const { towardUserKeys, encryptedSymmetricKey } = params;


    //NOTE: Only one thread as for rsa we need the encrypt function to be run exclusive.
    cryptoLib.workerThreadPool.preSpawn(rsaWorkerThreadPoolId, 1);



    const towardUserDecryptor = cryptoLib.rsa.decryptorFactory(
        towardUserKeys.decryptKey,
        rsaWorkerThreadPoolId
    );


    return {
        "paramsNeededToEncryptDecryptWebphoneData": await (async () => {

            const aesWorkerThreadPoolId = cryptoLib.workerThreadPool.Id.generate();

            cryptoLib.workerThreadPool.preSpawn(aesWorkerThreadPoolId, 3);

            const symmetricKey = await crypto.symmetricKey.decryptKey(
                towardUserDecryptor,
                encryptedSymmetricKey
            );

            return {
                "encryptorDecryptor": cryptoLib.aes.encryptorDecryptorFactory(
                    symmetricKey,
                    aesWorkerThreadPoolId
                )
            };

        })(),
        "paramsNeededToInstantiateUa": {
            "towardUserEncryptKeyStr": cryptoLib.RsaKey.stringify(
                towardUserKeys.encryptKey
            ),
            towardUserDecryptor,
            "getTowardSimEncryptor": ({ towardSimEncryptKeyStr }) => ({
                "towardSimEncryptor": cryptoLib.rsa.encryptorFactory(
                    cryptoLib.RsaKey.parse(towardSimEncryptKeyStr),
                    rsaWorkerThreadPoolId
                )
            })
        }

    };

}








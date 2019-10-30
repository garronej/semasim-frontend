
import * as cryptoLib from "./cryptoLibProxy";
import * as crypto from "./keysGeneration";
import { AuthenticatedSessionDescriptorSharedData } from "../localStorage/AuthenticatedSessionDescriptorSharedData";
import { TowardUserKeys } from "../localStorage/TowardUserKeys";
import * as remoteApiCaller from "../toBackend/remoteApiCaller";

/** When creating a new Ua instance an encryptor must be provided
 * so we expose the reference of the rsa thread */
const rsaWorkerThreadPoolId = cryptoLib.workerThreadPool.Id.generate();

/** 
 * ASSERT: User logged.
 * */
export async function setWebDataEncryptorDecryptorAndGetCryptoRelatedParamsNeededToInstantiateUa(): Promise<{
    towardUserEncryptKeyStr: string;
    towardUserDecryptor: cryptoLib.Decryptor;
    getTowardSimEncryptor: (usableUserSim: { towardSimEncryptKeyStr: string; })=> { towardSimEncryptor: cryptoLib.Encryptor; }
}> {

    const { encryptedSymmetricKey } =
        await AuthenticatedSessionDescriptorSharedData.get();

    //NOTE: Only one thread as for rsa we need the encrypt function to be run exclusive.
    cryptoLib.workerThreadPool.preSpawn(rsaWorkerThreadPoolId, 1);

    const towardUserKeys = await TowardUserKeys.retrieve();


    const towardUserDecryptor = cryptoLib.rsa.decryptorFactory(
        towardUserKeys.decryptKey,
        rsaWorkerThreadPoolId
    );

    {

        const aesWorkerThreadPoolId = cryptoLib.workerThreadPool.Id.generate();

        cryptoLib.workerThreadPool.preSpawn(aesWorkerThreadPoolId, 3);

        remoteApiCaller.setWebDataEncryptorDescriptor(
            cryptoLib.aes.encryptorDecryptorFactory(
                await crypto.symmetricKey.decryptKey(
                    towardUserDecryptor,
                    encryptedSymmetricKey
                ),
                aesWorkerThreadPoolId
            )
        );

    }

    return {
        "towardUserEncryptKeyStr": cryptoLib.RsaKey.stringify(
            towardUserKeys.encryptKey
        ),
        towardUserDecryptor,
        "getTowardSimEncryptor": ({ towardSimEncryptKeyStr }) => ({
            "towardSimEncryptor": cryptoLib.rsa.encryptorFactory(
                cryptoLib.RsaKey.parse( towardSimEncryptKeyStr),
                rsaWorkerThreadPoolId
            )
        })
    };

}








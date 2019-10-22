import * as cryptoLib from "./cryptoLibProxy";
import * as crypto from "./keysGeneration";
import { AuthenticatedSessionDescriptorSharedData } from "../localStorage/AuthenticatedSessionDescriptorSharedData";
import { TowardUserKeys } from "../localStorage/TowardUserKeys";
import * as remoteApiCaller from "../toBackend/remoteApiCaller";
import { Ua } from "../Ua";
import * as types from "../types/userSim";

/** When creating a new Ua instance an encryptor must be provided
 * so we expose the reference of the rsa thread */
const rsaWorkerThreadPoolId = cryptoLib.workerThreadPool.Id.generate();


/** 
 * ASSERT: User logged.
 * 
 * -Pre spawn the crypto workers ( aes and rsa )
 * -Provide an aes encryptor/decryptor to remoteApiCaller so that 
 *  the webData api can be used.
 * -Statically provide a rsa decryptor to Ua class ( so that incoming 
 * message can be decrypted ) */
export async function globalSetup() {

    const { email, uaInstanceId, encryptedSymmetricKey } =
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

    Ua.session = {
        email,
        "instanceId": uaInstanceId,
        "towardUserEncryptKeyStr": cryptoLib.RsaKey.stringify(
            towardUserKeys.encryptKey
        ),
        towardUserDecryptor
    };

}


export const getTowardSimEncryptor = (userSim: types.UserSim.Usable) =>
    cryptoLib.rsa.encryptorFactory(
        cryptoLib.RsaKey.parse(
            userSim.towardSimEncryptKeyStr
        ),
        rsaWorkerThreadPoolId
    );

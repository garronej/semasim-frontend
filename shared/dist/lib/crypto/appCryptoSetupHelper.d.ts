import * as cryptoLib from "./cryptoLibProxy";
declare type TowardUserKeys = import("../localStorage/TowardUserKeys").TowardUserKeys;
/**
 * ASSERT: User logged.
 * */
export declare function appCryptoSetupHelper(params: {
    towardUserKeys: TowardUserKeys;
    encryptedSymmetricKey: string;
}): Promise<{
    paramsNeededToInstantiateUa: {
        towardUserEncryptKeyStr: string;
        towardUserDecryptor: cryptoLib.Decryptor;
        getTowardSimEncryptor: (userSim: {
            towardSimEncryptKeyStr: string;
        }) => {
            towardSimEncryptor: cryptoLib.Encryptor;
        };
    };
    paramsNeededToEncryptDecryptWebphoneData: {
        encryptorDecryptor: cryptoLib.EncryptorDecryptor;
    };
}>;
export {};

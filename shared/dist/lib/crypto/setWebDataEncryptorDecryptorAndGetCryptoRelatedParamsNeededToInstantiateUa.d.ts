import * as cryptoLib from "./cryptoLibProxy";
/**
 * ASSERT: User logged.
 * */
export declare function setWebDataEncryptorDecryptorAndGetCryptoRelatedParamsNeededToInstantiateUa(): Promise<{
    towardUserEncryptKeyStr: string;
    towardUserDecryptor: cryptoLib.Decryptor;
    getTowardSimEncryptor: (usableUserSim: {
        towardSimEncryptKeyStr: string;
    }) => {
        towardSimEncryptor: cryptoLib.Encryptor;
    };
}>;

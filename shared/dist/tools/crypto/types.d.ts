export declare type Encryptor = {
    /** return encryptedData */
    encrypt(plainData: Uint8Array): Uint8Array;
};
export declare type Decryptor = {
    /** return plainData */
    decrypt(encryptedData: Uint8Array): Uint8Array;
};
export declare type EncryptorDecryptor = Encryptor & Decryptor;

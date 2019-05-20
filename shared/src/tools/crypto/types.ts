
export type Encryptor = {
    /** return encryptedData */
    encrypt(plainData: Uint8Array): Uint8Array;
};

export type Decryptor = {
    /** return plainData */
    decrypt(encryptedData: Uint8Array): Uint8Array;
};

export type EncryptorDecryptor = Encryptor & Decryptor;

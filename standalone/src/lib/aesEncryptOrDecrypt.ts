
import * as cryptoLib from "crypto-lib";


const encryptorDecryptorMap = new Map<
    string,
    cryptoLib.Sync<cryptoLib.EncryptorDecryptor>
>();

function getAesEncryptorDecryptorStatic(keyB64: string): cryptoLib.Sync<cryptoLib.EncryptorDecryptor> {

    let encryptorDecryptor = encryptorDecryptorMap.get(keyB64);

    if (encryptorDecryptor === undefined) {

        encryptorDecryptor = cryptoLib.aes.syncEncryptorDecryptorFactory(
            Buffer.from(keyB64, "base64")
        );

        encryptorDecryptorMap.set(keyB64, encryptorDecryptor);

    }

    return encryptorDecryptor;

}

/** Return  outputDataB64 */
export const aesEncryptOrDecrypt = (
    action: "ENCRYPT" | "DECRYPT",
    keyB64: string,
    inputDataB64: string
) => cryptoLib.toBuffer(
    getAesEncryptorDecryptorStatic(keyB64)[(() => {
        switch (action) {
            case "ENCRYPT": return "encrypt";
            case "DECRYPT": return "decrypt";
        }
    })()](Buffer.from(inputDataB64, "base64"))
).toString("base64");

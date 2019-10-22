
import * as cryptoLib from "crypto-lib";


const encryptorMap = new Map<
    string,
    cryptoLib.Sync<cryptoLib.Encryptor>
>();

function getRsaEncryptorStatic(encryptKeyStr: string): cryptoLib.Sync<cryptoLib.Encryptor> {

    let encryptor = encryptorMap.get(encryptKeyStr);

    if (encryptor === undefined) {

        encryptor = cryptoLib.rsa.syncEncryptorFactory(
            cryptoLib.RsaKey.parse(
                encryptKeyStr
            )
        );

        encryptorMap.set(encryptKeyStr, encryptor);

    }

    return encryptor;

}

const decryptorMap = new Map<
    string,
    cryptoLib.Sync<cryptoLib.Decryptor>
>();

function getRsaDecryptorStatic(decryptKeyStr: string): cryptoLib.Sync<cryptoLib.Decryptor> {

    let decryptor = decryptorMap.get(decryptKeyStr);

    if (decryptor === undefined) {

        decryptor = cryptoLib.rsa.syncDecryptorFactory(
            cryptoLib.RsaKey.parse(
                decryptKeyStr
            )
        );

        decryptorMap.set(decryptKeyStr, decryptor);

    }

    return decryptor;

}

/** Return  outputDataB64 */
export const rsaEncryptOrDecrypt = (
    action: "ENCRYPT" | "DECRYPT",
    keyStr: string,
    inputDataB64: string
) => cryptoLib.toBuffer(
    ((inputData: Uint8Array) => {
        switch (action) {
            case "ENCRYPT": return getRsaEncryptorStatic(keyStr).encrypt(inputData);
            case "DECRYPT": return getRsaDecryptorStatic(keyStr).decrypt(inputData);
        }
    })(Buffer.from(inputDataB64, "base64"))
).toString("base64");

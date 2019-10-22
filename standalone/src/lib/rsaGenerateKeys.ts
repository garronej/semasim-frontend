
import * as cryptoLib from "crypto-lib";

/** Return [publicKeyStr, privateKeyStr] */
export const rsaGenerateKeys = (
    seedB64: string,
    keysLengthBytes: number
): string[] => {

    const { publicKey, privateKey } = cryptoLib.rsa.syncGenerateKeys(
        Buffer.from(seedB64, "base64"),
        keysLengthBytes
    );

    return [publicKey, privateKey]
        .map(rsaKey => cryptoLib.RsaKey.stringify(rsaKey))
        ;

};


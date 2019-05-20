import * as lib from "../tools/crypto/library";
import * as aes from "../tools/crypto/aes";
import * as ttTesting from "transfer-tools/dist/lib/testing";


(async () => {



    const aesKey = await aes.generateTestKey();

    {

        let encrypt: lib.Encryptor["encrypt"] | undefined = undefined;
        let decrypt: lib.Decryptor["decrypt"] | undefined = undefined;

        //const text = '[" mais alors quoi ? "]                                         ';

        const text = ttTesting.genUtf8Str(60);

        for (let i = 1; i < 5000; i++) {

            if (i % 5 === 0) {
                encrypt = undefined;
            }

            if (i % 7 === 0) {
                decrypt = undefined;
            }

            if (encrypt === undefined) {

                encrypt = aes.encryptorDecryptorFactory(aesKey).encrypt;

            }

            if (decrypt === undefined) {

                decrypt = aes.encryptorDecryptorFactory(aesKey).decrypt;

            }


            if (
                lib.toBuffer(decrypt(
                    encrypt(
                        Buffer.from(text, "utf8")
                    )
                )).toString("utf8") !== text
            ) {

                throw new Error(`failed with ${JSON.stringify(text)}`);

            }

        }

        console.log("PASS 0");

    }

    {

        const plainEncryptorDecryptor: lib.EncryptorDecryptor = {
            "encrypt": data => data,
            "decrypt": data => data
        };

        const aesEncryptorDecryptor = aes.encryptorDecryptorFactory(
            aesKey
        );

        for (const encoding of ["hex", "base64", "binary"] as const) {

            lib.stringifyThenEncryptFactory.stringRepresentationEncoding = encoding;

            for (const encryptorDecryptor of [plainEncryptorDecryptor, aesEncryptorDecryptor]) {

                const stringifyThenEncrypt = lib.stringifyThenEncryptFactory(encryptorDecryptor);
                const decryptThenParse = lib.decryptThenParseFactory(encryptorDecryptor);

                for (let i = 1; i < 1000; i++) {

                    const text = ttTesting.genUtf8Str(60);

                    if (decryptThenParse<string>(stringifyThenEncrypt<string>(text)) !== text) {

                        throw new Error(`failed with ${JSON.stringify(text)}`);

                    }


                }


            }

            console.log(`PASS ${encoding}`);

        }

        console.log("PASS 1");

    }

    console.log("DONE");


})();


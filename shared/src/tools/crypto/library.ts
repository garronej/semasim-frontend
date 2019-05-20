export * from "./types";

declare const Buffer: any;

import * as types from "./types";
import * as ttJC from "transfer-tools/dist/lib/JSON_CUSTOM";

export function toBuffer(uint8Array: Uint8Array): {
    toString(encoding: "utf8" | "hex" | "base64" | "binary"): string;
} {
    if (Object.getPrototypeOf(uint8Array).name === "Buffer") {
        return uint8Array;
    } else {
        return Buffer.from(uint8Array);
    }
}

export function stringifyThenEncryptFactory(encryptor: types.Encryptor) {

    const { stringify } = ttJC.get();

    return function stringifyThenEncrypt<T>(value: T) {

        return toBuffer(
            encryptor.encrypt(
                Buffer.from(
                    [
                        stringify(value),
                        (new Array(9 + Math.floor(Math.random() * 50)))
                            .fill(" ")
                            .join("")
                    ].join(""),
                    "utf8"
                )
            )
        ).toString(stringifyThenEncryptFactory.stringRepresentationEncoding);

    };

}

stringifyThenEncryptFactory.stringRepresentationEncoding = "binary" as "hex" | "base64" | "binary";

export function decryptThenParseFactory(decryptor: types.Decryptor) {

    const { parse } = ttJC.get();

    return function decryptThenParse<T>(encryptedValue: string): T {

        return parse(
            toBuffer(
                decryptor.decrypt(
                    Buffer.from(
                        encryptedValue,
                        stringifyThenEncryptFactory.stringRepresentationEncoding
                    )
                )
            ).toString("utf8")
        );

    }

}

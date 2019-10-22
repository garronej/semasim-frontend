

//export const kfdIterations = 100000;

import * as env from "../env";
import * as hostKfd from "../nativeModules/hostKfd";
import { toBuffer } from "./cryptoLibProxy";
declare const Buffer: any;

export type KfdFn = (password: string, salt: Uint8Array, iterations: number) => Promise<Uint8Array>;

export const kfd: KfdFn =
    env.jsRuntimeEnv === "browser" ?
        (async (password, salt, iterations) => new Uint8Array(
            await window.crypto.subtle.deriveBits(
                {
                    "name": "PBKDF2",
                    salt,
                    iterations,
                    "hash": "SHA-1"
                },
                await window.crypto.subtle.importKey(
                    "raw",
                    (function Uint8ArrayToArrayBuffer(uint8Array: Uint8Array): ArrayBuffer {
                        return uint8Array.buffer.slice(
                            uint8Array.byteOffset,
                            uint8Array.byteLength + uint8Array.byteOffset
                        );
                    })(Buffer.from(password, "utf8")),
                    { "name": "PBKDF2" } as any,
                    false,
                    ["deriveBits"]
                ),
                256
            )
        ))
        : (password, salt, iterations) => hostKfd.kfd(
            password,
            toBuffer(salt).toString("hex"),
            iterations
        ).then(({ resultHex }) => Buffer.from(resultHex, "hex"))
    ;







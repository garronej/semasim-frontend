
import { toBuffer } from "crypto-lib/dist/sync/utils/toBuffer";
import { SyncEvent } from "ts-events-extended";

declare const Buffer: any;


export type ApiExposedByHost = {
    encryptOrDecrypt(action: "ENCRYPT" | "DECRYPT", keyStr: string, inputDataB64: string, callRef: number): void;
};

declare const apiExposedByHost: ApiExposedByHost;

export type ApiExposedToHost = {
    onEncryptedOrDecrypted(outputDataB64: string, callRef: number): void;
};

const evtEncryptedOrDecrypted = new SyncEvent<{
    callRef: number,
    outputDataB64: string;
}>();

export const apiExposedToHost: ApiExposedToHost = {
    "onEncryptedOrDecrypted": (outputDataB64, callRef) => evtEncryptedOrDecrypted.post( { callRef, outputDataB64 })
};

const getCounter = (() => {

	let counter = 0;

	return () => counter++;

})();

export async function encryptOrDecrypt(
    action: "ENCRYPT" | "DECRYPT",
    keyStr: string,
    inputData: Uint8Array
): Promise<Uint8Array> {

    const callRef= getCounter();

    const inputDataB64 = toBuffer(inputData).toString("base64");

    apiExposedByHost.encryptOrDecrypt(
        action,
        keyStr,
        inputDataB64,
        callRef
    );

    const { outputDataB64 } = await evtEncryptedOrDecrypted.waitFor(
        ({ callRef: callRef_ }) => callRef_ === callRef
    );

    return Buffer.from(outputDataB64, "base64") as Uint8Array;

}
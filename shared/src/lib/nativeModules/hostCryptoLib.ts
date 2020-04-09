
import { Evt } from "evt";

type ApiExposedByHost = {
    aesEncryptOrDecrypt(action: "ENCRYPT" | "DECRYPT", keyB64: string, inputDataB64: string, callRef: number): void;
    rsaEncryptOrDecrypt(action: "ENCRYPT" | "DECRYPT", keyStr: string, inputDataB64: string, callRef: number): void;
    rsaGenerateKeys(seedB64: string, keysLengthBytes: number, callRef: number): void;
};

type ApiExposedToHost = {
    onAesEncryptOrDecryptResult(callRef: number, outputDataB64: string): void;
    onRsaEncryptOrDecryptResult(callRef: number, outputDataB64: string): void;
    onRsaGenerateKeysResult(callRef: number, publicKeyStr: string, privateKeyStr: string): void;
};

declare const apiExposedByHost: ApiExposedByHost;

const evtAesEncryptOrDecryptResult = new Evt<{
    callRef: number;
    outputDataB64: string;
}>().setMaxHandlers(Infinity);

const evtRsaEncryptOrDecryptResult = new Evt<{
    callRef: number;
    outputDataB64: string;
}>();

const evtRsaGenerateKeysResult= new Evt<{
    callRef: number;
    publicKeyStr: string;
    privateKeyStr: string;
}>();


export const apiExposedToHost: ApiExposedToHost = {
    "onAesEncryptOrDecryptResult": (callRef, outputDataB64) =>
        evtAesEncryptOrDecryptResult.post({ callRef, outputDataB64 }),
    "onRsaEncryptOrDecryptResult": (callRef, outputDataB64) => 
        evtRsaEncryptOrDecryptResult.post({ callRef, outputDataB64 }),
    "onRsaGenerateKeysResult": (callRef, publicKeyStr, privateKeyStr) => 
        evtRsaGenerateKeysResult.post({ callRef, publicKeyStr, privateKeyStr })
};

const getCounter = (() => {

	let counter = 0;

	return () => counter++;

})();

export async function aesEncryptOrDecrypt(
    action: "ENCRYPT" | "DECRYPT",
    keyB64: string,
    inputDataB64: string
): Promise<{ outputDataB64: string; }> {

    const callRef= getCounter();

    apiExposedByHost.aesEncryptOrDecrypt(
        action,
        keyB64,
        inputDataB64,
        callRef
    );

    const { outputDataB64 } = await evtAesEncryptOrDecryptResult.waitFor(
        ({ callRef: callRef_ }) => callRef_ === callRef
    );

    return { outputDataB64 };

}

export async function rsaEncryptOrDecrypt(
    action: "ENCRYPT" | "DECRYPT",
    keyStr: string,
    inputDataB64: string
): Promise<{ outputDataB64: string; }> {

    const callRef= getCounter();

    apiExposedByHost.rsaEncryptOrDecrypt(
        action,
        keyStr,
        inputDataB64,
        callRef
    );

    const { outputDataB64 } = await evtRsaEncryptOrDecryptResult.waitFor(
        ({ callRef: callRef_ }) => callRef_ === callRef
    );

    return { outputDataB64 };


}

export async function rsaGenerateKeys(
    seedB64: string,
    keysLengthBytes: number
): Promise<{
    publicKeyStr: string;
    privateKeyStr: string;
}> {

    const callRef = getCounter();

    apiExposedByHost.rsaGenerateKeys(seedB64, keysLengthBytes, callRef);

    const {
        publicKeyStr,
        privateKeyStr
    } = await evtRsaGenerateKeysResult.waitFor(
        ({ callRef: callRef_ }) => callRef_ === callRef
    );

    return { publicKeyStr, privateKeyStr };

}
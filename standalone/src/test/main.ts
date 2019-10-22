import * as fs from "fs";
import * as ttTesting from "transfer-tools/dist/lib/testing";
import * as cryptoLib from "crypto-lib";

import { standalone_script_export_module, standalone_script_path_local } from "../bin/buildAndInstall";

const setTimeoutBack= setTimeout;

//NOTE: Simulate LiquidCore
global.setTimeout = undefined as any;

const real_require = require;

//NOTE: Make sure we do not need node crypto
require = function (module_name: string) {

    if (module_name === "crypto") {
        throw new Error("crypto not available");
    }

    return real_require(module_name);

} as any;

eval(
    fs.readFileSync(standalone_script_path_local)
    .toString("utf8")
);

const lib: typeof import("../lib/crypto-lib-standalone") = require(standalone_script_export_module);

cryptoLib.disableMultithreading();

global.setTimeout= setTimeoutBack;

{

    const seed = Buffer.from("this is a seed", "utf8");

    const keysLengthBytes = 160;

    ttTesting.assertSame(
        lib.rsaGenerateKeys(seed.toString("base64"), keysLengthBytes),
        (() => {

            const { publicKey, privateKey } = cryptoLib.rsa.syncGenerateKeys(seed, keysLengthBytes)

            return [publicKey, privateKey].map(key => cryptoLib.RsaKey.stringify(key));

        })()
    );

    console.log("PASS");

}

{

    const { publicKey, privateKey } = cryptoLib.rsa.syncGenerateKeys(Buffer.from("seed", "utf8"), 64);
    const inputData = Buffer.from("plain text", "utf8");

    const outputData = Buffer.from(
        lib.rsaEncryptOrDecrypt(
            "ENCRYPT",
            cryptoLib.RsaKey.stringify(publicKey),
            inputData.toString("base64")
        ),
        "base64"
    );

    const restoredInputData = cryptoLib.rsa.syncDecryptorFactory(privateKey).decrypt(outputData);

    if( cryptoLib.toBuffer(inputData).toString("hex") !== cryptoLib.toBuffer(restoredInputData).toString("hex") ){
        throw new Error("fail!");
    }


    console.log("PASS");

}


{

    const { publicKey, privateKey } = cryptoLib.rsa.syncGenerateKeys(Buffer.from("seed", "utf8"), 64);
    const inputData = Buffer.from("plain text", "utf8");

    const outputData = cryptoLib.rsa.syncEncryptorFactory(privateKey).encrypt(inputData);

    const restoredInputData = Buffer.from(
        lib.rsaEncryptOrDecrypt(
            "DECRYPT",
            cryptoLib.RsaKey.stringify(publicKey),
            cryptoLib.toBuffer(outputData).toString("base64")
        ),
        "base64"
    );


    if( cryptoLib.toBuffer(inputData).toString("hex") !== cryptoLib.toBuffer(restoredInputData).toString("hex") ){
        throw new Error("fail!");
    }


    console.log("PASS");

}



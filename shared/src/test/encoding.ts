declare const global: any;
import * as ttTesting from "transfer-tools/dist/lib/testing";

const BufferNodePd = Object.getOwnPropertyDescriptor(global, "Buffer");

if (BufferNodePd !== undefined) {

    const BufferNode = BufferNodePd.value;

    if (BufferNode === Buffer) {

        throw new Error("Same buffer implementation");

    }

    {

        console.log("test double encode");

        const doubleEncode= text => {

            const encode= text => BufferNode.from(
                text,
                "utf8"
            ).toString("binary");

            const oneEncode= encode(text);

            const twoEncode= encode(oneEncode);

            /*
            if( oneEncode !== twoEncode ){
                throw new Error("no it ain't so!");
            }
            */

            return twoEncode;


        };

        const doubleDecode = data => BufferNode.from(
            BufferNode.from(
                data,
                "binary"
            ).toString("utf8"),
            "binary"
        ).toString("utf8");

        for (let i = 1; i <= 100; i++) {

            const text = ttTesting.genUtf8Str(100);

            if (doubleDecode(doubleEncode(text)) !== text) {

                throw new Error("no it does not work like that");

            }

        }

        console.log("PASS test double encode");

    }



    require((() => "fs")()).writeFileSync(
        require("path").join(".", "res", "encoding_samples.json"),
        BufferNode.from(
            JSON.stringify(
                (new Array(1000)).fill("")
                    .map(() => ttTesting.genUtf8Str(60))
                    .map(text => {

                        const buffer = BufferNode.from(text, "utf8");

                        return {
                            text,
                            "hex": buffer.toString("hex"),
                            "base64": buffer.toString("base64"),
                            "binary": buffer.toString("binary")
                        };

                    })
            ),
            "utf8"
        )
    );


    for (const encoding of ["hex", "binary", "base64"]) {

        console.log({ encoding });

        for (let i = 1; i < 100; i++) {

            const text = ttTesting.genUtf8Str(90);

            if (JSON.parse(JSON.stringify(text)) !== text) {
                throw new Error("stringify | parse error");
            }

            const [got, expected] = [BufferNode, Buffer]
                .map(BufferImpl => BufferImpl.from(text, "utf8").toString(encoding))

            if (got !== expected) {

                console.log({ got, expected });

                throw new Error("FAIL");

            }

            const [textGot, textExpected] = [BufferNode, Buffer]
                .map(BufferImpl => BufferImpl.from(expected, encoding).toString("utf8"))
                ;

            if (textExpected !== text) {
                throw new Error("native node Buffer Impl error");
            }

            if (textGot !== text) {

                console.log({ got, expected });

                throw new Error("FAIL to restore string");

            }


        }

    }

    console.log("PASS test node buffer");

} else {

    const arr: { text: string; base64: string; binary: string; hex: string; }[] = require("../../res/encoding_samples.json");

    if (arr.length === 0) {
        throw new Error("generate samples first");
    }

    for (const entry of arr) {

        const buff = Buffer.from(entry.text, "utf8");

        for (const enc of ["base64", "binary", "hex"]) {

            if (entry[enc] !== buff.toString(enc)) {

                throw new Error(`failed encode to ${enc}, data: ${entry.hex}`);

            }

            if (Buffer.from(entry[enc], enc).toString("utf8") !== entry.text) {

                throw new Error(`failed restore from ${enc}, data: ${entry.hex}`);

            }

        }

    }

    console.log("PASS. Node buffer and browser buffer are the same");

}

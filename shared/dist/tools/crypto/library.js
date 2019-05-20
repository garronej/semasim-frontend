"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ttJC = require("transfer-tools/dist/lib/JSON_CUSTOM");
function toBuffer(uint8Array) {
    if (Object.getPrototypeOf(uint8Array).name === "Buffer") {
        return uint8Array;
    }
    else {
        return Buffer.from(uint8Array);
    }
}
exports.toBuffer = toBuffer;
function stringifyThenEncryptFactory(encryptor) {
    var stringify = ttJC.get().stringify;
    return function stringifyThenEncrypt(value) {
        return toBuffer(encryptor.encrypt(Buffer.from([
            stringify(value),
            (new Array(9 + Math.floor(Math.random() * 50)))
                .fill(" ")
                .join("")
        ].join(""), "utf8"))).toString(stringifyThenEncryptFactory.stringRepresentationEncoding);
    };
}
exports.stringifyThenEncryptFactory = stringifyThenEncryptFactory;
stringifyThenEncryptFactory.stringRepresentationEncoding = "binary";
function decryptThenParseFactory(decryptor) {
    var parse = ttJC.get().parse;
    return function decryptThenParse(encryptedValue) {
        return parse(toBuffer(decryptor.decrypt(Buffer.from(encryptedValue, stringifyThenEncryptFactory.stringRepresentationEncoding))).toString("utf8"));
    };
}
exports.decryptThenParseFactory = decryptThenParseFactory;

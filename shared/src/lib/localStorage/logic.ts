
import * as types from "./types";
import * as cryptoLib from "crypto-lib";

export type JustRegistered= types.JustRegistered;

export namespace JustRegistered {

    export function store(justRegistered: types.JustRegistered): void {

        localStorage.setItem(
            types.cookieKeys.JustRegistered,
            JSON.stringify(
                justRegistered,
                (key, value) => key === "towardUserKeys" ?
                    TowardUserKeys.stringify(value) :
                    value
            )
        );

    }

    export function retreave(): types.JustRegistered | undefined {

        const key = types.cookieKeys.JustRegistered;

        const justRegisteredStr= localStorage.getItem(
            key
        );

        if (justRegisteredStr === null) {
            return undefined;
        }

        localStorage.removeItem(key);

        return JSON.parse(
            justRegisteredStr,
            (key, value) => key === "towardUserKeys" ?
                TowardUserKeys.parse(value) :
                value
        );

    }

}

export type TowardUserKeys = types.TowardUserKeys;

export namespace TowardUserKeys {

    export function stringify(towardUserKeys: types.TowardUserKeys): string {
        return JSON.stringify(
            [towardUserKeys.encryptKey, towardUserKeys.decryptKey]
                .map(key => cryptoLib.RsaKey.stringify(key))
        )
    }

    export function parse(towardUserKeysStr: string): types.TowardUserKeys {

        const [encryptKey, decryptKey] = JSON.parse(towardUserKeysStr)
            .map(keyStr => cryptoLib.RsaKey.parse(keyStr))
            ;

        return { encryptKey, decryptKey };

    }

    //TODO: Set expiration for the cookie based on the session id expiration.
    export function store(towardUserKeys: types.TowardUserKeys): void {

        localStorage.setItem(
            types.cookieKeys.TowardUserKeys,
            stringify(towardUserKeys)
        );

    }

    export function retrieve(): types.TowardUserKeys | undefined {

        const towardUserKeysStr =
            localStorage.getItem(
                types.cookieKeys.TowardUserKeys
            );


        if (towardUserKeysStr === null) {
            return undefined;
        }

        return parse(towardUserKeysStr);

    }

}

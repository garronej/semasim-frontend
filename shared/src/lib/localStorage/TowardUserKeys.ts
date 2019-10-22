import * as localStorageApi from "./localStorageApi";
import { RsaKey } from "crypto-lib/dist/sync/types";

export type TowardUserKeys = {
    encryptKey: RsaKey.Public;
    decryptKey: RsaKey.Private;
};

export const key= "toward-user-keys";

export namespace TowardUserKeys {

    export function stringify(towardUserKeys: TowardUserKeys): string {
        return JSON.stringify(
            [towardUserKeys.encryptKey, towardUserKeys.decryptKey]
                .map(key => RsaKey.stringify(key))
        )
    }

    export function parse(towardUserKeysStr: string): TowardUserKeys {

        const [encryptKey, decryptKey] = JSON.parse(towardUserKeysStr)
            .map(keyStr => RsaKey.parse(keyStr))
            ;

        return { encryptKey, decryptKey };

    }

    //TODO: Set expiration for the cookie based on the session id expiration.
    export async function store(towardUserKeys: TowardUserKeys): Promise<void> {

        await localStorageApi.setItem(
            key,
            stringify(towardUserKeys)
        );

    }

    /** Assert present, throw otherwise, should be always present when
     * AuthenticatedSessionDescriptionSharedData is present */
    export async function retrieve(): Promise<TowardUserKeys> {

        const towardUserKeysStr =
            await localStorageApi.getItem(
                key
            );


        if (towardUserKeysStr === null) {
            throw new Error("Not present");
        }

        return parse(towardUserKeysStr);

    }


}
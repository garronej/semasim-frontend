import * as localStorageApi from "./localStorageApi";

import { TowardUserKeys } from "./TowardUserKeys";

const key = "just-registered";

export type JustRegistered = {
    password: string;
    secret: string;
    towardUserKeys: import("./TowardUserKeys").TowardUserKeys;
    promptEmailValidationCode: boolean;
};

export namespace JustRegistered {

    export async function store(justRegistered: JustRegistered): Promise<void> {

        await localStorageApi.setItem(
            key,
            JSON.stringify(
                justRegistered,
                (key, value) => key === "towardUserKeys" ?
                    TowardUserKeys.stringify(value) :
                    value
            )
        );

    }

    /** Will remove from internal storage */
    export async function retrieve(): Promise<JustRegistered | undefined> {

        const justRegisteredStr = await localStorageApi.getItem(
            key
        );

        if (justRegisteredStr === null) {
            return undefined;
        }

        await localStorageApi.removeItem(key);

        return JSON.parse(
            justRegisteredStr,
            (key, value) => key === "towardUserKeys" ?
                TowardUserKeys.parse(value) :
                value
        );

    }


}
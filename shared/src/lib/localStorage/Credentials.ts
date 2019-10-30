

import * as localStorageApi from "./localStorageApi";

const key = "credentials";

/** Soult be used only with react-native */
export type Credentials = Omit<import("../../web_api_declaration").loginUser.Params, "uaInstanceId"> & { uaInstanceId: string; };


export namespace Credentials {

    export async function isPresent(): Promise<boolean> {

        const value = await localStorageApi.getItem(key);

        return value !== null;

    }

    export async function remove() {

        if (!(await isPresent())) {
            return;
        }

        await localStorageApi.removeItem(key);

    }


    /** assert isPresent */
    export async function get(): Promise<Credentials> {

        const value = await localStorageApi.getItem(key);

        if (value === null) {
            throw new Error("Auth not present in localStorage");
        }

        return JSON.parse(value);

    }

    export async function set(authenticatedSessionDescriptorSharedData: Credentials): Promise<void> {

        await localStorageApi.setItem(
            key,
            JSON.stringify(authenticatedSessionDescriptorSharedData)
        );

    }

}



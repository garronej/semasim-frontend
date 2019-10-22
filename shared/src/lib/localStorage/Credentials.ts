

import * as localStorageApi from "./localStorageApi";
import * as env from "../env";

export const key = "credentials";

declare const Buffer: any;

export type Credentials = Omit<import ("../../web_api_declaration").loginUser.Params, "uaInstanceId"> & { uaInstanceId: string; };


export namespace Credentials {


    function throwIfWeb(): void | never {

        if( env.jsRuntimeEnv === "react-native" ){
            return;
        }

        throw new Error("Storing credentials in local storage should be done only on react-native");

    }

    export async function isPresent(): Promise<boolean> {

        throwIfWeb();

        const value= await localStorageApi.getItem(key);

        return value !== null;

    }

    export async function remove() {

        throwIfWeb();

        if( !(await isPresent())){
            return;
        }

        await localStorageApi.removeItem(key);

    }


    /** assert isPresent */
    export async function get(): Promise<Credentials> {

        throwIfWeb();

        const value: string | null = await localStorageApi.getItem(key);

        if( value === undefined ){
            throw new Error("Auth not present in localStorage");
        }

        return JSON.parse(
            Buffer.from(
                value,
                "hex"
            ).toString("utf8")
        );

    }

    export async function set(authenticatedSessionDescriptorSharedData: Credentials): Promise<void> {

        throwIfWeb();

        await localStorageApi.setItem(
            key,
            Buffer.from(
                JSON.stringify(authenticatedSessionDescriptorSharedData),
                "utf8"
            ).toString("hex")
        );

    }

    

}

    

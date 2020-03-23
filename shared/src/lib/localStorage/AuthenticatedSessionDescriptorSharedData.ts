
import { Evt } from "evt";
import * as localStorageApi from "./localStorageApi";

const key = "authenticated-session-descriptor-shared-data";

declare const Buffer: any;

export type AuthenticatedSessionDescriptorSharedData = {
    connect_sid: string;
    email: string;
    uaInstanceId: string;
    encryptedSymmetricKey: string;
};

export namespace AuthenticatedSessionDescriptorSharedData {

    /** Can be used to track when the user is logged in */
    export const evtChange = new Evt<AuthenticatedSessionDescriptorSharedData | undefined>();

    export async function isPresent(): Promise<boolean> {

        const value= await localStorageApi.getItem(key);

        return value !== null;
    }

    export async function remove() {

        evtChange.post(undefined);

        if( !(await isPresent())){
            return;
        }

        await localStorageApi.removeItem(key);
    }


    /** assert isPresent */
    export async function get(): Promise<AuthenticatedSessionDescriptorSharedData> {

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

    export async function set(authenticatedSessionDescriptorSharedData: AuthenticatedSessionDescriptorSharedData): Promise<void> {

        await localStorageApi.setItem(
            key,
            Buffer.from(
                JSON.stringify(authenticatedSessionDescriptorSharedData),
                "utf8"
            ).toString("hex")
        );

        evtChange.post(authenticatedSessionDescriptorSharedData);

    }

}


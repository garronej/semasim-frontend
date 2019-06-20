

import * as Cookies from "js-cookie";
import * as types from "../types";

declare const Buffer: any;

export type AuthenticatedSessionDescriptorSharedData= types.AuthenticatedSessionDescriptorSharedData;

export namespace AuthenticatedSessionDescriptorSharedData {

    export function get(): AuthenticatedSessionDescriptorSharedData {

        return JSON.parse(
            Buffer.from(
                Cookies.get(types.cookieKeys.SessionData), 
                "hex"
            ).toString("utf8")
        );

    }

}

export type WebsocketConnectionParams = types.WebsocketConnectionParams;

export namespace WebsocketConnectionParams {

    /** 
     * return a function that remove the cookie entry that should be called as 
     * soon as the websocket connection have been established.
     */
    export function set(websocketConnectionParams: WebsocketConnectionParams): () => void {

        const key = types.cookieKeys.WebsocketConnectionParams;

        Cookies.set(
            key,
            Buffer.from(
                JSON.stringify(websocketConnectionParams),
                "utf8"
            ).toString("hex")
        );

        return () => Cookies.remove(key);

    }

}

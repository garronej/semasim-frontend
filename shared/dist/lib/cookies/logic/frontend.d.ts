import * as types from "../types";
export declare type AuthenticatedSessionDescriptorSharedData = types.AuthenticatedSessionDescriptorSharedData;
export declare namespace AuthenticatedSessionDescriptorSharedData {
    function get(): AuthenticatedSessionDescriptorSharedData;
}
export declare type WebsocketConnectionParams = types.WebsocketConnectionParams;
export declare namespace WebsocketConnectionParams {
    /**
     * return a function that remove the cookie entry that should be called as
     * soon as the websocket connection have been established.
     */
    function set(websocketConnectionParams: WebsocketConnectionParams): () => void;
}

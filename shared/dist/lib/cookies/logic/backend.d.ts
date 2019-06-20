import * as types from "../types";
export declare type AuthenticatedSessionDescriptorSharedData = types.AuthenticatedSessionDescriptorSharedData;
export declare namespace AuthenticatedSessionDescriptorSharedData {
    function set(authenticatedSessionDescriptorSharedData: AuthenticatedSessionDescriptorSharedData, setter: (key: string, value: string) => void): void;
}
export declare type WebsocketConnectionParams = types.WebsocketConnectionParams;
export declare namespace WebsocketConnectionParams {
    /** Read from cookie */
    function get(parsedCookies: {
        [key: string]: string;
    }): WebsocketConnectionParams | undefined;
}

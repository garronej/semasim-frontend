export declare const cookieKeys: {
    "SessionData": string;
    "WebsocketConnectionParams": string;
};
export declare type AuthenticatedSessionDescriptorSharedData = {
    email: string;
    webUaInstanceId: string;
    encryptedSymmetricKey: string;
};
export declare type WebsocketConnectionParams = {
    requestTurnCred: boolean;
    connectionType: "MAIN";
} | {
    requestTurnCred: boolean;
    connectionType: "AUXILIARY";
    uaInstanceId: string;
};

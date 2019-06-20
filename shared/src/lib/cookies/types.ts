
export const cookieKeys = {
    "SessionData": "authenticated-session-descriptor-shared-data",
    "WebsocketConnectionParams": "websocket-connection-params"
};

export type AuthenticatedSessionDescriptorSharedData = {
    email: string;
    webUaInstanceId: string;
    encryptedSymmetricKey: string;
};


export type WebsocketConnectionParams = {
    requestTurnCred: boolean;
    connectionType: "MAIN";
} | {
    requestTurnCred: boolean;
    connectionType: "AUXILIARY";
    uaInstanceId: string;
};





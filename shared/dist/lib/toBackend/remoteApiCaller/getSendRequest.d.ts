declare type ConnectionApi = Pick<import("../connection").ConnectionApi, "getSocket">;
export declare function getSendRequest(connectionApi: ConnectionApi, restartApp: import("../../restartApp").RestartApp): <Params, Response_1>(methodName: string, params: Params) => Promise<Response_1>;
export {};

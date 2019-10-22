export declare class WebApiError extends Error {
    readonly methodName: string;
    readonly httpErrorStatus: number | undefined;
    constructor(methodName: string, httpErrorStatus: number | undefined);
}
export declare function sendRequest<Params, Response>(methodName: string, params: Params, connectSid: string | undefined): Promise<Response>;

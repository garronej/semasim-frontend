import * as sipLibrary from "ts-sip";

type ConnectionApi= Pick<import("../connection").ConnectionApi, "getSocket">;

export function getSendRequest(
    connectionApi: ConnectionApi,
    restartApp: import("../../restartApp").RestartApp
) {

    return async function sendRequest<Params, Response>(
        methodName: string,
        params: Params
    ): Promise<Response> {

        let response: Response;

        try {

            response = await sipLibrary.api.client.sendRequest<Params, Response>(
                await connectionApi.getSocket(),
                methodName,
                params,
                { "timeout": 60 * 1000 }
            );

        } catch (error) {

            return restartApp(`toBackend/remoteApiCaller/sendRequest ${methodName} error thrown: ${error.message}`);

        }

        return response;

    };

}

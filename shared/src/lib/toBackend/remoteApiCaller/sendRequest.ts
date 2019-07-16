import * as sipLibrary from "ts-sip";
import * as connection from "../connection";

export async function sendRequest<Params, Response>(
    methodName: string,
    params: Params,
    retry?: "RETRY"
): Promise<Response> {

    let response: Response;

    try {

        response = await sipLibrary.api.client.sendRequest<Params, Response>(
            await connection.get(),
            methodName,
            params,
            { "timeout": 60 * 1000 }
        );

    } catch (error) {

        if (!!retry) {

            return sendRequest<Params, Response>(
                methodName,
                params,
                "RETRY"
            );

        } else {

            throw error;

        }

    }

    return response;

}
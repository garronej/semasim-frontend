import * as sipLibrary from "ts-sip";
import * as connection from "../connection";
import { restartApp } from "../../restartApp";

export async function sendRequest<Params, Response>(
    methodName: string,
    params: Params
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

        restartApp();

        return new Promise<never>(()=>{});

    }

    return response;

}
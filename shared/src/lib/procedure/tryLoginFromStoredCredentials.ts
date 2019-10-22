
import * as env from "../env";
import * as webApiCaller from "../webApiCaller";
import { Credentials } from "../localStorage/Credentials";

export type Result = "LOGGED IN" | "NO VALID CREDENTIALS";

let prResult: Promise<Result> | undefined = undefined;

export function tryLoginFromStoredCredentials(): Promise<Result> {

    if (prResult !== undefined) {
        return prResult;
    }

    prResult = (async function callee(): Promise<Result> {


        {

            webApiCaller.setCanRequestThrowToTrueForNextMethodCall();

            let isUserLoggedIn: boolean;

            try {

                isUserLoggedIn = await webApiCaller.isUserLoggedIn();

            } catch (error) {

                if (!(error instanceof webApiCaller.WebApiError)) {
                    throw error;
                }


                await new Promise(resolve => setTimeout(resolve, 2000));

                return callee();

            }

            if (isUserLoggedIn) {

                return "LOGGED IN";

            }


        }

        if (env.jsRuntimeEnv === "browser") {
            return "NO VALID CREDENTIALS";
        }

        if (!await Credentials.isPresent()) {
            return "NO VALID CREDENTIALS";
        }

        const { email, secret, uaInstanceId } = await Credentials.get();

        {

            const resp = await webApiCaller.loginUser(email, secret, uaInstanceId)
                .catch(error => {

                    if (!(error instanceof webApiCaller.WebApiError)) {
                        throw error;
                    }

                    return error;

                })
                ;

            if (resp instanceof webApiCaller.WebApiError) {

                await new Promise(resolve => setTimeout(resolve, 2000));

                return callee();

            }


            if (resp.status === "RETRY STILL FORBIDDEN") {

                //TODO: some log
                await new Promise(resolve => setTimeout(resolve, resp.retryDelayLeft));

                return callee();


            }


            if (resp.status !== "SUCCESS") {

                await Credentials.remove();

                return "NO VALID CREDENTIALS";

            }

        }

        return "LOGGED IN";


    })();

    prResult.then(() => prResult = undefined);

    return tryLoginFromStoredCredentials();

}
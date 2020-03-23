
import { env } from "./env";
import { assert } from "../tools/typeSafety/assert";

export type Result = "LOGGED IN" | "NO VALID CREDENTIALS";

let prCurrentRequestResult: Promise<Result> | undefined = undefined;

export type TryLoginWithStoredCredentialIfNotAlreadyLogedIn = ReturnType<typeof tryLoginWithStoredCredentialIfNotAlreadyLogedInFactory>

export namespace tryLoginWithStoredCredentialIfNotAlreadyLogedInFactory {

    export type Params = Params.Browser | Params.ReactNative;

    export namespace Params {

        export type Browser = {
            assertJsRuntimeEnv: "browser";
            webApi: Pick<import("./webApiCaller").WebApi, "WebApiError" | "isUserLoggedIn">
        };

        export type ReactNative = {
            assertJsRuntimeEnv: "react-native";
            Credentials: typeof import("./localStorage/Credentials").Credentials;
            webApi: Pick<import("./webApiCaller").WebApi, "WebApiError" | "isUserLoggedIn" | "loginUser">
        };

    }

}

export function tryLoginWithStoredCredentialIfNotAlreadyLogedInFactory(
    params: tryLoginWithStoredCredentialIfNotAlreadyLogedInFactory.Params
) {

    assert(params.assertJsRuntimeEnv === env.jsRuntimeEnv);

    const { WebApiError } = params.webApi;

    return function tryLoginWithStoredCredentialIfNotAlreadyLogedIn(): Promise<Result> {


        if (prCurrentRequestResult !== undefined) {
            return prCurrentRequestResult;
        }

        prCurrentRequestResult = (async function callee(): Promise<Result> {

            {

                let isUserLoggedIn: boolean;

                try {

                    isUserLoggedIn = await params.webApi.isUserLoggedIn({ "shouldThrowOnError": true });

                } catch (error) {

                    assert(error instanceof WebApiError);

                    await new Promise(resolve => setTimeout(resolve, 2000));

                    return callee();

                }

                if (isUserLoggedIn) {

                    return "LOGGED IN";

                }


            }

            if (params.assertJsRuntimeEnv === "browser") {
                return "NO VALID CREDENTIALS";
            }

            const { Credentials } = params;

            if (env.jsRuntimeEnv === "browser") {
                return "NO VALID CREDENTIALS";
            }

            if (!await Credentials.isPresent()) {
                return "NO VALID CREDENTIALS";
            }

            const { email, secret, uaInstanceId } = await Credentials.get();

            {

                const resp = await params.webApi.loginUser({
                    "assertJsRuntimeEnv": "react-native",
                    email,
                    secret,
                    uaInstanceId,
                    "shouldThrowOnError": true
                }).catch(error => {

                    assert(error instanceof WebApiError);

                    return error;

                })
                    ;

                if (resp instanceof WebApiError) {

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

        prCurrentRequestResult.then(() => prCurrentRequestResult = undefined);

        return tryLoginWithStoredCredentialIfNotAlreadyLogedIn();

    }

}

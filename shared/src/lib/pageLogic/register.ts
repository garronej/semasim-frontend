
import * as crypto from "../crypto/keysGeneration";
import * as cryptoLib from "../crypto/cryptoLibProxy";
import { AsyncReturnType } from "../../tools/typeSafety/AsyncReturnType";

export type LaunchRegister = ReturnType<typeof factory>;

export namespace LaunchRegister {

	export type Api = AsyncReturnType<LaunchRegister>;

	export type Params = {
		email: string | undefined;
		uiApi: {
			emailInput: {
				setValue(params: { value: string; readonly: boolean; }): void;
				getValue(): string;
			},
			passwordInput: {
				getValue(): string;
			}
			redirectToLogin(params: { email: string; }): void;
		}
	};


}

export function factory(
	params: {
		webApi: Pick<import("../webApiCaller").WebApi, "registerUser">;
		dialogApi: import("../../tools/modal/dialog").DialogApi,
		JustRegistered: typeof import("../localStorage/JustRegistered").JustRegistered;
	}
) {

	const { webApi, dialogApi, JustRegistered } = params;

	return async function launchRegister(
		params: LaunchRegister.Params
	) {

		const { email, uiApi } = params;

		crypto.preSpawnIfNotAlreadyDone();

		if (email !== undefined) {

			uiApi.emailInput.setValue({
				"value": email,
				"readonly": true
			});

		}

		return {
			"register": async () => {

				const email = uiApi.emailInput.getValue();
				const password = uiApi.passwordInput.getValue()

				const { secret, towardUserKeys } = await crypto.computeLoginSecretAndTowardUserKeys({
					password,
					"uniqUserIdentification": email
				});

				dialogApi.loading("Creating account", 0);

				const regStatus = await webApi.registerUser({
					email,
					secret,
					"towardUserEncryptKeyStr": cryptoLib.RsaKey.stringify(
						towardUserKeys.encryptKey
					),
					"encryptedSymmetricKey": await crypto.symmetricKey.createThenEncryptKey(
						towardUserKeys.encryptKey
					),
					"shouldThrowOnError": true
				}).catch(() => new Error());

				if (regStatus instanceof Error) {

					await dialogApi.create(
						"alert",
						{ "message": "Something went wrong, please try again later" }
					);

					return;

				}

				switch (regStatus) {
					case "EMAIL NOT AVAILABLE":

						dialogApi.dismissLoading();

						dialogApi.create(
							"alert",
							{ "message": `Semasim account for ${email} has already been created` }
						);

						uiApi.emailInput.setValue({
							"value": "",
							"readonly": false
						});

						break;

					case "CREATED":
					case "CREATED NO ACTIVATION REQUIRED":

						JustRegistered.store({
							password,
							secret,
							towardUserKeys,
							"promptEmailValidationCode": regStatus !== "CREATED NO ACTIVATION REQUIRED"
						});

						uiApi.redirectToLogin({ email });

						break;

				}


			}
		};




	}

}




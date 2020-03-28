import * as cryptoLib from "../crypto/cryptoLibProxy";
import * as crypto from "../crypto/keysGeneration";
import { assert } from "../../tools/typeSafety/assert";
import { env } from "../env";
import { AsyncReturnType } from "../../tools/typeSafety/AsyncReturnType";
import * as uuidv5 from "uuid/v5";

export type LaunchLogin = ReturnType<typeof factory>;

export namespace LaunchLogin {

	export type Api = AsyncReturnType<LaunchLogin>;

	export type Params = {
		intent: {
			action: "VALIDATE EMAIL";
			email: string;
			code: string;
		} | {
			action: "RENEW PASSWORD";
			email: string;
			token: string;
		} | {
			action: "LOGIN";
			email: string | undefined;
		};
		uiApi: {
			emailInput: {
				getValue(): string;
				setValue(email: string): void;
			};
			passwordInput: {
				getValue(): string;
				setValue(password: string): void;
			}
			triggerClickButtonLogin(): void;

			redirectToRegister(): void;
			//TODO: params are legacy, should be ()=> void;
			onLoginSuccess(
				params: {
					email: string;
					secret: string;
					towardUserEncryptKeyStr: string;
					towardUserDecryptKeyStr: string;
				}
			): void;
		}
	};


}


export function factory(params: {
	webApi: Pick<import("../webApiCaller").WebApi, "loginUser" | "validateEmail" | "renewPassword" | "sendRenewPasswordEmail">;
	dialogApi: import("../../tools/modal/dialog").DialogApi,
	JustRegistered: typeof import("../localStorage/JustRegistered").JustRegistered;
	TowardUserKeys: typeof import("../localStorage/TowardUserKeys").TowardUserKeys;
}) {

	const { webApi, dialogApi, JustRegistered, TowardUserKeys } = params;

	const { validateEmail } = validateEmailFactory({ dialogApi, webApi });
	const { renewPassword } = renewPasswordFactory({ dialogApi, webApi });

	return async function launchLogin(params: LaunchLogin.Params) {

		const { intent, uiApi } = params;

		crypto.preSpawnIfNotAlreadyDone();

		{

			const { email } = params.intent;

			if (email !== undefined) {
				uiApi.emailInput.setValue(email);
			}


		}

		let justRegistered = await JustRegistered.retrieve();


		switch (intent.action) {
			case "LOGIN": {

				const { email } = intent;

				//NOTE: If justRegistered we assert we have an email
				if (email === undefined) {
					break;
				}

				if (justRegistered === undefined) {
					break;
				}

				uiApi.passwordInput.setValue(justRegistered.password);

				if (justRegistered.promptEmailValidationCode) {

					const code = await (async function callee(): Promise<string> {

						const out = await new Promise<string | null>(
							resolve => dialogApi.create("prompt", {
								"title": "Code you just received by email",
								"inputType": "number",
								"placeholder": "XXXX",
								"callback": result => resolve(result)
							})
						);

						if (!out) {

							await new Promise<void>(
								resolve => dialogApi.create("alert", {
									"message": "Validating you email address is mandatory to access Semasim services",
									"callback": () => resolve()
								})
							);

							return callee();

						}

						return out;

					})();

					const { isEmailValidated } = await validateEmail({ email, code })

					if (!isEmailValidated) {
						break;
					}

				}

				setTimeout(() => uiApi.triggerClickButtonLogin(), 0);

			} break;
			case "VALIDATE EMAIL": {

				const { isEmailValidated } = await validateEmail({
					"email": intent.email,
					"code": intent.code
				});

				if (!isEmailValidated) {
					break;
				}

				await new Promise<void>(
					resolve => dialogApi.create("alert", {
						"message": "Email successfully validated you can now proceed to login",
						"callback": () => resolve()
					})
				);

			} break;
			case "RENEW PASSWORD": {

				const renewPasswordResult = await renewPassword({
					"email": intent.email,
					"token": intent.token
				});

				if (!renewPasswordResult.isSuccess) {
					break;
				}

				const { newPassword, newSecret, towardUserKeys } = renewPasswordResult;

				justRegistered = {
					"password": newPassword,
					"secret": newSecret,
					towardUserKeys,
					"promptEmailValidationCode": false
				};

				uiApi.passwordInput.setValue(newPassword);

				setTimeout(() => uiApi.triggerClickButtonLogin(), 0);

			} break;
		}

		return {
			/** 
			 * Assert email and password fields have been validated,
			 * Resolves when no more action ongoing.
			 * */
			"login": async (
				params: {
					assertJsRuntimeEnv: "browser";
				} | {
					assertJsRuntimeEnv: "react-native";
					getDeviceUniqIdentifier: () => string;
				}
			): Promise<void> => {

				assert(params.assertJsRuntimeEnv === env.jsRuntimeEnv);

				const email = uiApi.emailInput.getValue();

				//const { email, password, justRegistered, uiApi } = params;

				const { secret, towardUserKeys } =
					justRegistered ??
					await crypto.computeLoginSecretAndTowardUserKeys({
						"password": uiApi.passwordInput.getValue(),
						"uniqUserIdentification": email
					})
					;

				const resp = await webApi.loginUser({
					email,
					secret,
					"shouldThrowOnError": true,
					...(() => {
						switch (params.assertJsRuntimeEnv) {
							case "browser": return {
								"assertJsRuntimeEnv": "browser" as const
							};
							case "react-native": return {
								"assertJsRuntimeEnv": "react-native" as const,
								"uaInstanceId": `"<urn:uuid:${uuidv5(params.getDeviceUniqIdentifier(), "1514baa7-6d21-4eeb-86f5-f7ccd6a85afd")}>"`
							};
						}
					})()
				}).catch(() => new Error());

				if (resp instanceof Error) {

					await dialogApi.create(
						"alert",
						{ "message": "Please try again later" }
					);

					uiApi.passwordInput.setValue("");

					return;

				}

				if (resp.status !== "SUCCESS") {

					uiApi.passwordInput.setValue("");

				}

				switch (resp.status) {
					case "SUCCESS":
						await TowardUserKeys.store(towardUserKeys);

						//window.location.href = `/${availablePages.PageName.manager}`;
						uiApi.onLoginSuccess({
							email,
							secret,
							"towardUserEncryptKeyStr": cryptoLib.RsaKey.stringify(towardUserKeys.encryptKey),
							"towardUserDecryptKeyStr": cryptoLib.RsaKey.stringify(towardUserKeys.decryptKey)

						});
						break;

					case "NO SUCH ACCOUNT":
						await dialogApi.create("alert", { "message": "No Semasim account correspond to this email" });
						break;
					case "WRONG PASSWORD":
						await dialogApi.create("alert", {
							"message": `Wrong password, please wait ${resp.retryDelay / 1000} second before retrying`
						});
						break;
					case "RETRY STILL FORBIDDEN":
						await dialogApi.create("alert", {
							"message": [
								`Due to unsuccessful attempt to login your account is temporally locked`,
								`please wait ${resp.retryDelayLeft / 1000} second before retrying`
							].join(" ")
						});
						break;
					case "NOT VALIDATED YET":
						await dialogApi.create("alert", {
							"message": [
								"This account have not been validated yet.",
								"Please check your emails"
							].join(" ")
						});
						break;

				}



			},
			"requestRenewPassword": async function callee(): Promise<void> {

				const email = await new Promise<string | null>(
					resolve => dialogApi.create("prompt", {
						"title": "Account email?",
						"inputType": "email",
						"value": uiApi.emailInput.getValue(),
						"callback": result => resolve(result),
					})
				);

				if (!email) {
					return;
				}


				const isSuccess = await webApi.sendRenewPasswordEmail({ email, "shouldThrowOnError": true })
					.catch(() => new Error());

				if (isSuccess instanceof Error) {

					await dialogApi.create(
						"alert",
						{ "message": "Something went wrong please try again later" }
					);

					return;

				}

				if (isSuccess) {

					await dialogApi.create(
						"alert",
						{ "message": "An email that will let you renew your password have been sent to you" }
					);

					return;

				}

				const shouldProceed = await new Promise<"RETRY" | "REGISTER" | "CANCEL">(
					resolve => dialogApi.create("dialog", {
						"title": "Not found",
						"message": `Account '${email}' does not exist`,
						"buttons": {
							"cancel": {
								"label": "Retry",
								"callback": () => resolve("RETRY")
							},
							"success": {
								"label": "Register",
								"className": "btn-success",
								"callback": () => resolve("REGISTER")
							}
						},
						"closeButton": true,
						"onEscape": () => resolve("CANCEL")
					})
				);

				switch (shouldProceed) {
					case "CANCEL": return;
					case "REGISTER":
						uiApi.redirectToRegister();
						return;
					case "RETRY":
						uiApi.emailInput.setValue("");
						callee();
						return;

				}



			}
		};


	}



}

function validateEmailFactory(
	params: {
		webApi: Pick<import("../webApiCaller").WebApi, "validateEmail">;
		dialogApi: import("../../tools/modal/dialog").DialogApi,
	}

) {

	const { webApi, dialogApi } = params;

	async function validateEmail(
		params: {
			email: string;
			code: string;
		}
	): Promise<{ isEmailValidated: boolean; }> {

		const { email, code } = params;

		const isEmailValidated = await webApi.validateEmail({
			email,
			"activationCode": code,
			"shouldThrowOnError": true
		}).catch(() => new Error());

		if (isEmailValidated instanceof Error) {

			await dialogApi.create("alert", {
				"message": "Something went wrong please validate your email using the link that have via email"
			});

			return { "isEmailValidated": false };

		}

		if (!isEmailValidated) {

			await new Promise<void>(
				resolve => dialogApi.create("alert", {
					"message": [
						"Email was already validated or provided activation code was wrong.",
						"Follow the link you received by email to try again."
					].join(" "),
					"callback": () => resolve()
				})
			);

		}

		return { isEmailValidated };

	}

	return { validateEmail };

}

function renewPasswordFactory(
	params: {
		webApi: Pick<import("../webApiCaller").WebApi, "renewPassword">;
		dialogApi: import("../../tools/modal/dialog").DialogApi,
	}
) {

	const { webApi, dialogApi } = params;


	async function renewPassword(
		params: {
			email: string;
			token: string;
		}
	) {

		const { email, token } = params;

		return new Promise<{
			isSuccess: false;
		} | {
			isSuccess: true;

			newPassword: string;
			newSecret: string;
			towardUserKeys: import("../localStorage/TowardUserKeys").TowardUserKeys;
		}>(async function callee(resolve) {

			const newPassword = await new Promise<string | null>(
				resolve => dialogApi.create("prompt", {
					"title": "Chose a new password",
					"inputType": "password",
					"callback": result => resolve(result)
				})
			);

			if (!newPassword || newPassword.length < 5) {

				await new Promise<void>(
					resolve => dialogApi.create("alert", {
						"message": "Password must be at least 5 character long",
						"callback": () => resolve()
					})
				);

				callee(resolve);

				return;

			}

			const newPasswordConfirm = await new Promise<string | null>(
				resolve => dialogApi.create("prompt", {
					"title": "Confirm your new password",
					"inputType": "password",
					"callback": result => resolve(result)
				})
			);

			if (newPassword !== newPasswordConfirm) {

				await new Promise<void>(
					resolve => dialogApi.create("alert", {
						"message": "The two entry mismatch",
						"callback": () => resolve()
					})
				);

				callee(resolve);

				return;

			}

			const { secret: newSecret, towardUserKeys } = await crypto.computeLoginSecretAndTowardUserKeys({
				"password": newPassword,
				"uniqUserIdentification": email
			});

			dialogApi.loading("Renewing password");

			const wasTokenStillValid = await webApi.renewPassword({
				email,
				newSecret,
				"newTowardUserEncryptKeyStr": cryptoLib.RsaKey.stringify(
					towardUserKeys.encryptKey
				),
				"newEncryptedSymmetricKey": await crypto.symmetricKey.createThenEncryptKey(
					towardUserKeys.encryptKey
				),
				token,
				"shouldThrowOnError": true
			}).catch(() => new Error());


			if (wasTokenStillValid instanceof Error) {

				await dialogApi.create("alert", { "message": "Something went wrong please try again later" });

				resolve({ "isSuccess": false });

				return;

			}

			dialogApi.dismissLoading();

			if (!wasTokenStillValid) {

				await dialogApi.create("alert", { "message": "This password renew email was no longer valid" });

				resolve({ "isSuccess": false });

				return;

			}

			resolve({
				"isSuccess": true,
				newPassword,
				newSecret,
				towardUserKeys
			});

		});

	};

	return { renewPassword };

}





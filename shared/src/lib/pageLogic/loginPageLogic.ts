import * as cryptoLib from "../crypto/cryptoLibProxy";
import * as availablePages from "../availablePages";
import { TowardUserKeys } from "../localStorage/TowardUserKeys";
import * as webApiCaller from "../webApiCaller";
import * as crypto from "../crypto/keysGeneration";
import { JustRegistered } from "../localStorage/JustRegistered";
import { dialogApi } from "../../tools/modal/dialog";

/** uaInstanceId to provide only in react native */
export async function login(
	email: string,
	password: string,
	uaInstanceId: string | undefined,
	justRegistered: JustRegistered | undefined,
	uiApi: {
		resetPassword: () => void;
		loginSuccess: (secret: string) => void;
	},
) {

	const { secret, towardUserKeys } =
		justRegistered ||
		await crypto.computeLoginSecretAndTowardUserKeys(
			password,
			email
		)
		;


	webApiCaller.setCanRequestThrowToTrueForNextMethodCall();

	const resp = await webApiCaller.loginUser(
		email,
		secret,
		uaInstanceId
	).catch(error=> error as Error);

	if( resp instanceof Error){

		await dialogApi.create("alert", {
			"message": "Please try again later"
		});

		uiApi.resetPassword();

		return;

	}

	if (resp.status !== "SUCCESS") {

		uiApi.resetPassword();

	}

	switch (resp.status) {
		case "SUCCESS":


			//TODO: if native declare ua.

			await TowardUserKeys.store(towardUserKeys);

			//window.location.href = `/${availablePages.PageName.manager}`;
			uiApi.loginSuccess(secret);
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


}


export async function init(
	params: availablePages.urlParams.Login,
	uiApi: {
		setEmail: (email: string) => void;
		setPassword: (password: string) => void;
		triggerClickLogin: () => void;
		setJustRegistered: (justRegistered: JustRegistered) => void;
	}
) {

	crypto.preSpawn();

	const justRegistered = await JustRegistered.retrieve();

	if (justRegistered) {

		uiApi.setJustRegistered(justRegistered);

	}

	const email_ = params.email;

	if (email_ !== undefined) {

		uiApi.setEmail(email_);

	}

	if (
		params.email_confirmation_code !== undefined ||
		!!justRegistered && justRegistered.promptEmailValidationCode
	) {

		const email = email_!;

		const { email_confirmation_code } = params;

		webApiCaller.setCanRequestThrowToTrueForNextMethodCall();

		const isEmailValidated = await webApiCaller.validateEmail(
			email,
			email_confirmation_code !== undefined ?
				email_confirmation_code :
				await (async function callee(): Promise<string> {

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

				})()
		).catch(error=> error as Error);

		if( isEmailValidated instanceof Error ){

			await dialogApi.create("alert", {
				"message": "Something went wrong please validate your email using the link that have via email"
			});

			return;

		}

		if (!isEmailValidated) {

			await new Promise<void>(
				resolve => dialogApi.create("alert", {
					"message": [
						"Email was already validated or provided activation code was wrong.",
						"Follow the link you received by email to activate your account."
					].join(" "),
					"callback": () => resolve()
				})
			);

			return;

		}

		if (email_confirmation_code !== undefined) {

			await new Promise<void>(
				resolve => dialogApi.create("alert", {
					"message": "Email successfully validated you can now proceed to login",
					"callback": () => resolve()
				})
			);

		}

	}

	if (!!justRegistered) {

		//$("#password").val(justRegistered.password);
		uiApi.setPassword(justRegistered.password);

		//$("#login-btn").trigger("click");
		uiApi.triggerClickLogin();
		return;
	}

	//NOTE: Never in React native.
	if (params.renew_password_token !== undefined) {

		const email = params.email!;

		(async function callee() {

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

				callee();

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

				callee();

				return;

			}

			const { secret: newSecret, towardUserKeys } = await crypto.computeLoginSecretAndTowardUserKeys(
				newPassword,
				email
			);

			dialogApi.loading("Renewing password");

			webApiCaller.setCanRequestThrowToTrueForNextMethodCall();

			const wasTokenStillValid = await webApiCaller.renewPassword(
				email,
				newSecret,
				cryptoLib.RsaKey.stringify(
					towardUserKeys.encryptKey
				),
				await crypto.symmetricKey.createThenEncryptKey(
					towardUserKeys.encryptKey
				),
				params.renew_password_token!
			).catch(error => error as Error);

			if( wasTokenStillValid instanceof Error ){

				await dialogApi.create("alert", { "message": "Something went wrong please try again later" });

				return;

			}

			dialogApi.dismissLoading();

			if (!wasTokenStillValid) {

				await dialogApi.create("alert", { "message": "This password renew email was no longer valid" });

				return;

			}

			uiApi.setJustRegistered({
				"password": newPassword,
				"secret": newSecret,
				towardUserKeys,
				"promptEmailValidationCode": false
			});

			//$("#password").val(newPassword);
			uiApi.setPassword(newPassword);

			//$("#login-form").submit();
			uiApi.triggerClickLogin();

		})();

	}


}

export async function requestRenewPassword(
	uiApi: {
		getEmail: () => string;
		setEmail: (email: string) => void;
		redirectToRegister: () => void;
	}
) {

	const email = await new Promise<string | null>(
		resolve => dialogApi.create("prompt", {
			"title": "Account email?",
			"inputType": "email",
			"value": uiApi.getEmail(),
			"callback": result => resolve(result),
		})
	);

	if (!email) {
		return;
	}

	webApiCaller.setCanRequestThrowToTrueForNextMethodCall();

	const isSuccess = await webApiCaller.sendRenewPasswordEmail(email)
	.catch(error=> error as Error);

	if( isSuccess instanceof Error ){

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
			uiApi.setEmail("");
			requestRenewPassword(uiApi);
			return;

	}


}

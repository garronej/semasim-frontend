import * as webApiCaller from "../../../shared/dist/lib/webApiCaller";
import * as bootbox_custom from "../../../shared/dist/tools/bootbox_custom";
import { requestRenewPassword } from "./requestRenewPassword";
import "../../../shared/dist/tools/standalonePolyfills";
import * as crypto from "../../../shared/dist/lib/crypto";
import * as localStorage from "../../../shared/dist/lib/localStorage/logic";
import * as availablePages from "../../../shared/dist/lib/availablePages";
import * as urlGetParameters from "../../../shared/dist/tools/urlGetParameters";

let justRegistered: localStorage.JustRegistered | undefined;

declare const apiExposedByHost: {
    onDone(email: string, secret: string, towardUserKeysStr: string): void;
};

function setHandlers() {

	/* Start import from theme */
	$("#login-form").validate({
		"ignore": 'input[type="hidden"]',
		"errorPlacement": function (error, element) {
			let place = element.closest(".input-group");
			if (!place.get(0)) {
				place = element;
			}
			if (error.text() !== "") {
				place.after(error);
			}
		},
		"errorClass": 'help-block',
		"rules": {
			"email": {
				"required": true,
				"email": true
			},
			"password": {
				"required": true,
				"minlength": 5
			}
		},
		"messages": {
			"password": {
				"required": "Please provide a password",
				"minlength": "Your password must be at least 5 characters long"
			},
			"email": "Please type your email",
		},
		"highlight":  label => 
			$(label).closest('.form-group').removeClass('has-success').addClass('has-error')
		,
		"success":  label => {
			$(label).closest('.form-group').removeClass('has-error');
			label.remove();
		}
	});
	/* End import from theme */

	$("#login-form").on("submit", async function (event) {

		event.preventDefault();

		if (!$(this).valid()) return;

		const [email, password] = (() => {

			const [email, password] = ["#email", "#password"]
				.map(sel => $(sel).val() as string)
				;

			return [email.toLowerCase(), password];

		})();

		const { secret, towardUserKeys } =
			justRegistered ||
			await crypto.computeLoginSecretAndTowardUserKeys(
				password,
				email
			)
			;

		const resp = await webApiCaller.loginUser(
			email,
			secret
		);

		if (resp.status !== "SUCCESS") {

			$("#password").val("");

		}

		switch (resp.status) {
			case "SUCCESS":

				if (typeof apiExposedByHost !== "undefined") {

					apiExposedByHost.onDone(
						email,
						secret,
						localStorage.TowardUserKeys.stringify(towardUserKeys)
					);

				} else {

					localStorage.TowardUserKeys.store(towardUserKeys);

					window.location.href = `/${availablePages.PageName.manager}`;

				}

				break;
			case "NO SUCH ACCOUNT":
				bootbox_custom.alert("No Semasim account correspond to this email");
				break;
			case "WRONG PASSWORD":
				bootbox_custom.alert(
					`Wrong password, please wait ${resp.retryDelay / 1000} second before retrying`
				);
				break;
			case "RETRY STILL FORBIDDEN":
				bootbox_custom.alert([
					`Due to unsuccessful attempt to login your account is temporally locked`,
					`please wait ${resp.retryDelayLeft / 1000} second before retrying`
				].join(" "));
				break;
			case "NOT VALIDATED YET":
				bootbox_custom.alert([
					"This account have not been validated yet.",
					"Please check your emails"
				].join(" "));
				break;

		}


	});

	$("#forgot-password").click(event => {

		event.preventDefault();

		requestRenewPassword();

	});

}

$(document).ready(async () => {

	crypto.preSpawn();

	justRegistered = localStorage.JustRegistered.retreave();

	setHandlers();

	const params = urlGetParameters.parseUrl<availablePages.urlParams.Login>();

	if (params.email !== undefined) {
		$("#email").val(params.email);
	}

	if (
		params.email_confirmation_code !== undefined ||
		justRegistered !== undefined && justRegistered.promptEmailValidationCode
	) {

		const email = params.email!;

		const { email_confirmation_code } = params;

		const isEmailValidated = await webApiCaller.validateEmail(
			email,
			email_confirmation_code !== undefined ?
				email_confirmation_code :
				await (async function callee(): Promise<string> {

					const out = await new Promise<string | null>(
						resolve => bootbox_custom.prompt({
							"title": "Code you just received by email",
							"inputType": "number",
							"placeholder": "XXXX",
							"callback": result => resolve(result)
						})
					);

					if (!out) {

						await new Promise<void>(
							resolve => bootbox_custom.alert(
								"Validating you email address is mandatory to access Semasim services",
								() => resolve()
							)
						);

						return callee();

					}

					return out;

				})()
		);

		if (!isEmailValidated) {

			await new Promise<void>(
				resolve => bootbox_custom.alert(
					[
						"Email was already validated or provided activation code was wrong.",
						"Follow the link you received by email to activate your account."
					].join(" "),
					() => resolve()
				)
			);

			return;

		}

		if( email_confirmation_code !== undefined ){

			await new Promise<void>(
				resolve => bootbox_custom.alert(
					"Email successfully validated you can now proceed to login",
					() => resolve()
				)
			);

		}

	}

	if (justRegistered !== undefined) {

		$("#password").val(justRegistered.password);
		$("#login-btn").trigger("click");
		return;
	}

	if (params.renew_password_token !== undefined) {

		const email = params.email!;

		(async function callee() {

			const newPassword = await new Promise<string | null>(
				resolve => bootbox_custom.prompt({
					"title": "Chose a new password",
					"inputType": "password",
					"callback": result => resolve(result)
				})
			);

			if (!newPassword || newPassword.length < 5) {

				await new Promise<void>(
					resolve => bootbox_custom.alert(
						"Password must be at least 5 character long",
						() => resolve()
					)
				);

				callee();

				return;

			}

			const newPasswordConfirm = await new Promise<string | null>(
				resolve => bootbox_custom.prompt({
					"title": "Confirm your new password",
					"inputType": "password",
					"callback": result => resolve(result)
				})
			);

			if (newPassword !== newPasswordConfirm) {

				await new Promise<void>(
					resolve => bootbox_custom.alert(
						"The two entry mismatch",
						() => resolve()
					)
				);

				callee();

				return;

			}

			const { secret: newSecret, towardUserKeys } = await crypto.computeLoginSecretAndTowardUserKeys(
				newPassword,
				email
			);

			bootbox_custom.loading("Renewing password");

			const wasTokenStillValid = await webApiCaller.renewPassword(
				email,
				newSecret,
				towardUserKeys.encryptKey,
				await crypto.symmetricKey.createThenEncryptKey(
					towardUserKeys.encryptKey
				),
				params.renew_password_token!
			);

			bootbox_custom.dismissLoading();

			if (!wasTokenStillValid) {

				bootbox_custom.alert("This password renew email was no longer valid");

				return;

			}

			justRegistered = {
				"password": newPassword,
				"secret": newSecret,
				towardUserKeys,
				"promptEmailValidationCode": false
			};

			$("#password").val(newPassword);

			$("#login-form").submit();

		})();

	}

});
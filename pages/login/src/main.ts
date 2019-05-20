import * as webApiCaller from "../../../shared/dist/lib/webApiCaller";
import * as bootbox_custom from "../../../shared/dist/tools/bootbox_custom";
import { getURLParameter } from "../../../shared/dist/tools/getURLParameter";
import { requestRenewPassword } from "./requestRenewPassword";
import "../../../shared/dist/tools/standalonePolyfills";

declare const Buffer: any;
declare const Cookies: any;

declare const apiExposedByHost: {
    onDone(email?: string, password?: string): void;
};

function setHandlers() {

	/* Start import from theme */
	$("#login-form").validate({
		ignore: 'input[type="hidden"]',
		errorPlacement: function (error, element) {
			var place = element.closest('.input-group');
			if (!place.get(0)) {
				place = element;
			}
			if (error.text() !== "") {
				place.after(error);
			}
		},
		errorClass: 'help-block',
		rules: {
			email: {
				required: true,
				email: true
			},
			password: {
				required: true,
				minlength: 5
			}
		},
		messages: {
			password: {
				required: "Please provide a password",
				minlength: "Your password must be at least 5 characters long"
			},
			email: "Please type your email",
		},
		highlight: function (label) {
			$(label).closest('.form-group').removeClass('has-success').addClass('has-error');
		},
		success: function (label) {
			$(label).closest('.form-group').removeClass('has-error');
			label.remove();
		}
	});
	/* End import from theme */

	$("#login-form").on("submit", async function (event) {

		event.preventDefault();

		if (!$(this).valid()) return;

		const email = ($("#email").val() as string).toLowerCase();
		const password = $("#password").val();

		const resp = await webApiCaller.loginUser(
			email,
			password
		);

		if (resp.status !== "SUCCESS") {

			$("#password").val("");

		}

		switch (resp.status) {
			case "SUCCESS":

				Cookies.set("email", email);

				if( typeof apiExposedByHost !== "undefined" ){

					apiExposedByHost.onDone(email, password);

				}else{

					window.location.href = "/manager";

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


async function handleQueryString() {

	const emailAsHex = getURLParameter("email_as_hex");

	let email = "";

	if (!!emailAsHex) {

		email = Buffer.from(emailAsHex, "hex").toString("utf8");

		$("#email").val(email);

	}

	const password= Cookies.get("password");

	if( !!password ){

		Cookies.remove("password");

		$("#password").val(password);

	}


	let emailConfirmationCode = getURLParameter("email_confirmation_code");

	if (!!emailConfirmationCode) {

		if (emailConfirmationCode === "__prompt__") {

			emailConfirmationCode = await (async function callee(): Promise<string> {

				const out = await new Promise<string | null>(
					resolve => bootbox_custom.prompt({
						"title": "Please enter the code to confirm your email ( check also your SPAM inbox )",
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

			})();

		}

		const isEmailValidated = await webApiCaller.validateEmail(email, emailConfirmationCode);

		if (!isEmailValidated) {

			await new Promise<void>(
				resolve => bootbox_custom.alert(
					"Email was already validated or provided activation code was wrong",
					() => resolve()
				)
			);

			window.close();

			return;

		} else {

			await new Promise<void>(
				resolve => bootbox_custom.alert(
					"Semasim account successfully validated",
					() => resolve()
				)
			);

		}

	}

	if (!!emailAsHex && !!password) {

		$("#login-form").submit();

		return;
	}

	const renewPasswordToken = getURLParameter("renew_password_token");

	if (!!renewPasswordToken) {

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

			bootbox_custom.loading("Renewing password");

			const wasTokenStillValid = await webApiCaller.renewPassword(email, newPassword, renewPasswordToken);

			bootbox_custom.dismissLoading();

			if (!wasTokenStillValid) {

				bootbox_custom.alert("This password renew email was no longer valid");

				return;

			}

			$("#password").val(newPassword);

			$("#login-form").submit();

		})();

	}

}

$(document).ready(() => {

	setHandlers();

	handleQueryString();

});
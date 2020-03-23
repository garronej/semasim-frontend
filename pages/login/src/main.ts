import "minimal-polyfills/dist/lib/ArrayBuffer.isView";
import "frontend-shared/dist/tools/polyfills/Object.assign";
import * as availablePages from "frontend-shared/dist/lib/availablePages";
import * as hostKfd from "frontend-shared/dist/lib/nativeModules/hostKfd";
import * as urlGetParameters from "frontend-shared/dist/tools/urlGetParameters";
import { loginPageLaunch } from "frontend-shared/dist/lib/appLauncher/loginPageLaunch";
import { assert } from "frontend-shared/dist/tools/typeSafety/assert";

declare const apiExposedByHost: (
	hostKfd.ApiExposedByHost &
	{
		onDone(
			email: string,
			secret: string,
			towardUserEncryptKeyStr: string,
			towardUserDecryptKeyStr: string,
		): void;
	}
);

const apiExposedToHost: (
	hostKfd.ApiExposedToHost &
	{}
) = {
	...hostKfd.apiExposedToHost
};

Object.assign(window, { apiExposedToHost });

$(document).ready(async () => {

	const prApi = loginPageLaunch({
		"assertJsRuntimeEnv": "browser",
		"intent": (() => {

			const {
				email,
				email_confirmation_code,
				renew_password_token
			} = urlGetParameters.parseUrl<availablePages.urlParams.Login>()

			if (typeof email_confirmation_code === "string") {

				assert(typeof email === "string");

				return {
					"action": "VALIDATE EMAIL" as const,
					email,
					"code": email_confirmation_code
				};

			}

			if (typeof renew_password_token === "string") {

				assert(typeof email === "string");

				return {
					"action": "RENEW PASSWORD" as const,
					email,
					"token": renew_password_token
				};

			}

			return {
				"action": "LOGIN" as const,
				email
			};

		})(),
		"uiApi": {
			"emailInput": {
				"getValue": $("#email").val(),
				"setValue": email => $("#email").val(email)
			},
			"passwordInput": {
				"getValue": $("#password").val(),
				"setValue": password => $("#password").val(password)
			},
			"triggerClickButtonLogin": () => $("#login-btn").trigger("click"),
			"redirectToRegister": () => window.location.href = `/${availablePages.PageName.register}`,
			"onLoginSuccess": async ({
				email,
				secret,
				towardUserEncryptKeyStr,
				towardUserDecryptKeyStr
			}) => {

				if (typeof apiExposedByHost !== "undefined") {

					apiExposedByHost.onDone(
						email,
						secret,
						towardUserEncryptKeyStr,
						towardUserDecryptKeyStr
					);

					return;

				}

				window.location.href = `/${availablePages.PageName.manager}`;

			}
		}
	});

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
		"highlight": label =>
			$(label).closest('.form-group').removeClass('has-success').addClass('has-error')
		,
		"success": label => {
			$(label).closest('.form-group').removeClass('has-error');
			label.remove();
		}
	});
	/* End import from theme */

	$("#login-form").on("submit", async function (event) {

		event.preventDefault();

		if (!$(this).valid()) return;

		const { login } = await prApi;

		login({ "assertJsRuntimeEnv": "browser" });

	});


	$("#forgot-password").click(async event => {

		event.preventDefault();

		const { requestRenewPassword } = await prApi;

		requestRenewPassword();

	});


});




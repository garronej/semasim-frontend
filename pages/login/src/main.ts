import "minimal-polyfills/dist/lib/ArrayBuffer.isView";
import "frontend-shared/dist/tools/polyfills/Object.assign";
import { JustRegistered } from "frontend-shared/dist/lib/localStorage/JustRegistered";
import * as availablePages from "frontend-shared/dist/lib/availablePages";
import * as hostKfd from "frontend-shared/dist/lib/nativeModules/hostKfd";
import * as loginPageLogic from "frontend-shared/dist/lib/pageLogic/loginPageLogic";
import { TowardUserKeys } from "frontend-shared/dist/lib/localStorage/TowardUserKeys";
import * as cryptoLib from "frontend-shared/node_modules/crypto-lib";
import * as urlGetParameters from "frontend-shared/dist/tools/urlGetParameters";

let justRegistered: JustRegistered | undefined;

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

		const [email, password] = (() => {

			const [email, password] = ["#email", "#password"]
				.map(sel => $(sel).val() as string)
				;

			return [email, password];

		})();

		loginPageLogic.login(
			email,
			password,
			undefined,
			justRegistered,
			{
				"resetPassword": () => $("#password").val(""),
				"loginSuccess": async secret => {

					if (typeof apiExposedByHost !== "undefined") {

						const towardUserKeys = (await TowardUserKeys.retrieve())!;

						apiExposedByHost.onDone(
							email,
							secret,
							cryptoLib.RsaKey.stringify(towardUserKeys.encryptKey),
							cryptoLib.RsaKey.stringify(towardUserKeys.decryptKey)
						);

						return;

					}

					window.location.href = `/${availablePages.PageName.manager}`;

				}
			}
		);

	});


	$("#forgot-password").click(event => {

		event.preventDefault();

		loginPageLogic.requestRenewPassword({
			"redirectToRegister": () => window.location.href = `/${availablePages.PageName.register}`,
			"getEmail": () => $("#email").val(),
			"setEmail": email => $("#email").val(email)
		});


	});

}

$(document).ready(async () => {

	setHandlers();

	loginPageLogic.init(
		urlGetParameters.parseUrl<availablePages.urlParams.Login>(),
		{
			"setEmail": email => $("#email").val(email),
			"setJustRegistered": justRegistered_ => justRegistered = justRegistered_,
			"setPassword": password => $("#password").val(password),
			"triggerClickLogin": () => $("#login-btn").trigger("click")
		}
	);

});

import "minimal-polyfills/dist/lib/ArrayBuffer.isView";
import "../../../shared/dist/tools/polyfills/Object.assign";
import * as webApiCaller from "../../../shared/dist/lib/webApiCaller";
import * as bootbox_custom from "../../../shared/dist/tools/bootbox_custom";
import * as urlGetParameters from "../../../shared/dist/tools/urlGetParameters";
import * as crypto from "../../../shared/dist/lib/crypto";
import * as cryptoLib from "crypto-lib";
import * as localStorage from "../../../shared/dist/lib/localStorage/logic";
import * as availablePages from "../../../shared/dist/lib/availablePages";
import * as hostKfd from "../../../shared/dist/lib/hostKfd";

//@ts-ignore: so it is clear that some API should be exposed by host.
declare const apiExposedByHost: (
	hostKfd.ApiExposedByHost &
	{}
);

const apiExposedToHost: (
	hostKfd.ApiExposedToHost &
	{}
) = {
	...hostKfd.apiExposedToHost
};

Object.assign(window, { apiExposedToHost });

function setHandlers() {

	/* Start code from template */
	$("#register-form").validate({
		"ignore": 'input[type="hidden"]',
		"errorPlacement": function (error, element) {
			let place = element.closest('.input-group');
			if (!place.get(0)) {
				place = element;
			}
			if (error.text() !== '') {
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
			},
			"password1": {
				"equalTo": '#password'
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
	/* End code from template */

	$("#register-form").on("submit", async function (event) {

		event.preventDefault();

		if (!$(this).valid()) return;

		const [email, password] = (() => {

			const [email, password] = ["#email", "#password"]
				.map(sel => $(sel).val() as string)
				;

			return [email.toLowerCase(), password];

		})();

		const { secret, towardUserKeys } = await crypto.computeLoginSecretAndTowardUserKeys(
			password,
			email,
			hostKfd.kfd
		);

		bootbox_custom.loading("Creating account",0);

		const regStatus = await webApiCaller.registerUser(
			email,
			secret,
			cryptoLib.RsaKey.stringify(
				towardUserKeys.encryptKey
			),
			await crypto.symmetricKey.createThenEncryptKey(
				towardUserKeys.encryptKey
			)
		);

		switch (regStatus) {
			case "EMAIL NOT AVAILABLE":

				bootbox_custom.dismissLoading();

				bootbox_custom.alert(`Semasim account for ${email} has already been created`);

				$("#email").val("");

				break;

			case "CREATED":
			case "CREATED NO ACTIVATION REQUIRED":

				localStorage.JustRegistered.store({
					password,
					secret,
					towardUserKeys,
					"promptEmailValidationCode": regStatus !== "CREATED NO ACTIVATION REQUIRED"
				});

				window.location.href = urlGetParameters.buildUrl<availablePages.urlParams.Login>(
					`/${availablePages.PageName.login}`,
					{ email }
				);

				break;

		}

	});

}

$(document).ready(() => {

	crypto.preSpawn();

	setHandlers();

	{

		const { email } = urlGetParameters.parseUrl<availablePages.urlParams.Register>();

		if (email !== undefined) {

			$("#email").val(email);
			$("#email").prop("readonly", true);

		}

	}


});
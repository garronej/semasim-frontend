
import "minimal-polyfills/dist/lib/ArrayBuffer.isView";
import "frontend-shared/dist/tools/polyfills/Object.assign";
import * as urlGetParameters from "frontend-shared/dist/tools/urlGetParameters";
import * as availablePages from "frontend-shared/dist/lib/availablePages";
import * as hostKfd from "frontend-shared/dist/lib/nativeModules/hostKfd";
import * as registerPageLogic from "frontend-shared/dist/lib/pageLogic/registerPageLogic";

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

			return [email, password];

		})();

		registerPageLogic.register(email, password, {
			"resetEmail": () => $("#email").val(""),
			"redirectToLogin": () =>
				window.location.href = urlGetParameters.buildUrl<availablePages.urlParams.Login>(
					`/${availablePages.PageName.login}`,
					{ email }
				)
		});

	});

}

$(document).ready(() => {

	setHandlers();

	registerPageLogic.init(urlGetParameters.parseUrl<availablePages.urlParams.Register>(), {
		"setEmailReadonly": email => {
			$("#email").val(email);
			$("#email").prop("readonly", true);
		}
	});


});

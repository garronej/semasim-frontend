import * as webApiCaller from "../../../shared/dist/lib/webApiCaller";
import * as bootbox_custom from "../../../shared/dist/lib/tools/bootbox_custom";
import { getURLParameter } from "../../../shared/dist/lib/tools/getURLParameter";
import "../../../shared/dist/lib/tools/standalonePolyfills";

declare const Buffer: any;
declare const Cookies: any;

function setHandlers(){

	/* Start code from template */
	$("#register-form").validate({
		ignore: 'input[type="hidden"]',
		errorPlacement: function (error, element) {
			var place = element.closest('.input-group');
			if (!place.get(0)) {
				place = element;
			}
			if (error.text() !== '') {
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
			},
			password1: {
				equalTo: '#password'
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
    /* End code from template */

    $("#register-form").on("submit", async function(event) {

        event.preventDefault();

        if (!$(this).valid()) return;

        let email = $("#email").val();
        let password = $("#password").val();

        let regStatus = await webApiCaller.registerUser(email, password);

        switch (regStatus) {
            case "EMAIL NOT AVAILABLE":

                bootbox_custom.alert(`Semasim account for ${email} has already been created`);

                $("#email").val("");

                break;

            case "CREATED":
			case "CREATED NO ACTIVATION REQUIRED":

				Cookies.set("password", password, { "expires": 1 });

                window.location.href = "/login?" + [
                    regStatus === "CREATED NO ACTIVATION REQUIRED" ?
                        undefined : `email_confirmation_code=__prompt__`,
                    `email_as_hex=${Buffer.from(email, "utf8").toString("hex")}`
                ].filter(v => !!v).join("&");

                break;

        }

    });

}

function handleQueryString() {

    const emailAsHex = getURLParameter("email_as_hex");

    if (emailAsHex) {

        $("#email").val(Buffer.from(emailAsHex, "hex").toString("utf8"));
        $("#email").prop("readonly", true);

    }

}

$(document).ready(() => {

    setHandlers();

    handleQueryString();

});
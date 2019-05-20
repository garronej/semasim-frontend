import * as webApiCaller from "../../../shared/dist/lib/webApiCaller";
import * as bootbox_custom from "../../../shared/dist/tools/bootbox_custom";

declare const Buffer: any;

export async function requestRenewPassword() {

	let email = await new Promise<string | null>(
		resolve => bootbox_custom.prompt({
			"title": "Account email?",
			"inputType": "email",
			"value": $("#email").val() || "",
			"callback": result => resolve(result),
		})
	);

	if (!email){ 
		return;
	}

	const isSuccess = await webApiCaller.sendRenewPasswordEmail(email);

	if (isSuccess) {

		bootbox_custom.alert("An email that will let you renew your password have been sent to you");

	} else {

		const shouldProceed = await new Promise<"RETRY" | "REGISTER" | "CANCEL">(
			resolve => bootbox_custom.dialog({
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
				"onEscape": () => resolve("CANCEL")
			})
		);

		switch (shouldProceed) {
			case "CANCEL": return;
			case "REGISTER":
				window.location.href = [
					"/register",
					"?",
					`email_as_hex=${Buffer.from(email, "utf8").toString("hex")}`
				].join("");
				return;
			case "RETRY":
				$("#email").val("");
				requestRenewPassword();
				return;
		}

	}

}
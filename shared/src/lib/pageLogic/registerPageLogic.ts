
import * as webApiCaller from "../webApiCaller";
import { dialogApi } from "../../tools/modal/dialog";
import * as crypto from "../crypto/keysGeneration";
import * as cryptoLib from "../crypto/cryptoLibProxy";
import { JustRegistered } from "../localStorage/JustRegistered";
import * as availablePages from "../availablePages";

export async function init(
	params: availablePages.urlParams.Register,
	uiApi: {
		setEmailReadonly: (email: string) => void;
	}
) {

	crypto.preSpawn();

	{

		const { email } = params;

		if (email !== undefined) {

			uiApi.setEmailReadonly(email)

		}

	}

}


export async function register(
	email: string,
	password: string,
	uiApi: {
		resetEmail: () => void;
		redirectToLogin: () => void;
	}
) {

	const { secret, towardUserKeys } = await crypto.computeLoginSecretAndTowardUserKeys(
		password,
		email
	);

	dialogApi.loading("Creating account", 0);

	const regStatus = await webApiCaller.registerUser(
		email,
		secret,
		cryptoLib.RsaKey.stringify(
			towardUserKeys.encryptKey
		),
		await crypto.symmetricKey.createThenEncryptKey(
			towardUserKeys.encryptKey
		)
	).catch(error=> error as Error);

	if ( regStatus instanceof Error) {
		await dialogApi.create("alert", { "message": "Something went wrong, please try again later" });

		uiApi.resetEmail();

		return;

	}

	switch (regStatus) {
		case "EMAIL NOT AVAILABLE":

			dialogApi.dismissLoading();

			dialogApi.create("alert", { "message": `Semasim account for ${email} has already been created` });

			uiApi.resetEmail();

			break;

		case "CREATED":
		case "CREATED NO ACTIVATION REQUIRED":

			JustRegistered.store({
				password,
				secret,
				towardUserKeys,
				"promptEmailValidationCode": regStatus !== "CREATED NO ACTIVATION REQUIRED"
			});

			uiApi.redirectToLogin();

			break;

	}


}
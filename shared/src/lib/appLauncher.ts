

import { appCryptoSetupHelper } from "./crypto/appCryptoSetupHelper";
import * as remoteApiCaller from "./toBackend/remoteApiCaller";
import { AuthenticatedSessionDescriptorSharedData } from "./localStorage/AuthenticatedSessionDescriptorSharedData";
import * as declaredPushNotificationToken from "./localStorage/declaredPushNotificationToken";
import { TowardUserKeys } from "./localStorage/TowardUserKeys";
import { Ua } from "./Ua";
import { appEvts } from "./toBackend/appEvts";
import { Webphone } from "./Webphone";
import * as connection from "./toBackend/connection";
import { tryLoginFromStoredCredentials } from "./tryLoginFromStoredCredentials";
import { restartApp } from "./restartApp";
import { env } from "./env";
import { baseTypes as dialogBaseTypes, provideCustomImplementationOfBaseApi, dialogApi, startMultiDialogProcess } from "../tools/modal/dialog";
import * as webApiCaller from "./webApiCaller";
import { registerInteractiveAppEvtHandlers } from "./interactiveAppEvtHandlers";

const log: typeof console.log = true ?
	((...args) => console.log.apply(console, ["[appLauncher]", ...args])) :
	(() => { });


export type Params = Params.Browser | Params.ReactNative;

export namespace Params {

	export type Browser =  {
		assertJsRuntimeEnv: "browser";
	};

	export type ReactNative = {
		assertJsRuntimeEnv: "react-native";
		prPushNotificationToken: Promise<string>;
		notConnectedUserFeedback: connection.ConnectParams.ReactNative["notConnectedUserFeedback"];
		dialogBaseApi: dialogBaseTypes.Api
	};

}


export async function appLauncher(params: Params): Promise<{
	needLogin: boolean; //NOTE: fow web will always be false.
	prWebphones: Promise<Webphone[]>
}> {

	if (params.assertJsRuntimeEnv !== env.jsRuntimeEnv) {
		throw new Error("Wrong params for js runtime environnement");
	}

	if (params.assertJsRuntimeEnv === "react-native") {

		provideCustomImplementationOfBaseApi(params.dialogBaseApi);

	}

	const needLogin = "NO VALID CREDENTIALS" === await tryLoginFromStoredCredentials();

	return {
		needLogin,
		"prWebphones": (async () => {

			if (needLogin) {

				if (params.assertJsRuntimeEnv === "browser") {

					return restartApp("User not logged in (launching app)");

				}

				await AuthenticatedSessionDescriptorSharedData.evtChange
					.waitFor(authenticatedSessionDescriptorSharedData => !!authenticatedSessionDescriptorSharedData);

			}

			return appLauncher_onceLoggedIn(
				params,
				await AuthenticatedSessionDescriptorSharedData.get()
			);



		})()
	};

}

async function appLauncher_onceLoggedIn(
	params: Params,
	authenticatedSessionDescriptorSharedData: Pick<
		AuthenticatedSessionDescriptorSharedData,
		"encryptedSymmetricKey" | "email" | "uaInstanceId"
	>
): Promise<Webphone[]> {

	const { encryptedSymmetricKey, email, uaInstanceId } = authenticatedSessionDescriptorSharedData;

	const { paramsNeededToEncryptDecryptWebphoneData, paramsNeededToInstantiateUa } = await appCryptoSetupHelper({
		"towardUserKeys": await TowardUserKeys.retrieve(),
		encryptedSymmetricKey
	});

	const getApiCallerForSpecificSim = (() => {

		const { encryptorDecryptor } = paramsNeededToEncryptDecryptWebphoneData;

		return remoteApiCaller.getWdApiCallerForSpecificSimFactory(
			encryptorDecryptor,
			email
		);

	})();



	const pushNotificationToken = await (() => {
		switch (params.assertJsRuntimeEnv) {
			case "browser": return undefined;
			case "react-native": return params.prPushNotificationToken
		}
	})();

	//TODO: If user delete and re create an account with same email and password
	//and to not re-open the app while the account was deleted the it will result
	//into the UA not being declared.
	//To fix this backend might return user.id_ so we can detect when it is not
	//the same user account. ( change need to be made in webApiCaller.loginUser )
	await (async () => {

		if (pushNotificationToken === undefined) {
			return;
		}

		if (pushNotificationToken === await declaredPushNotificationToken.get()) {
			return;
		}

		log("Declaring UA");

		await webApiCaller.declareUa({
			"platform": env.hostOs!,
			pushNotificationToken
		});

		await declaredPushNotificationToken.set(pushNotificationToken);

	})();

	const ua = Ua.instantiate({
		email,
		uaInstanceId,
		"cryptoRelatedParams": paramsNeededToInstantiateUa,
		"pushNotificationToken": pushNotificationToken ?? "",
		connection,
		fromBackendEvents: appEvts
	});

	connection.connect(((): connection.ConnectParams => {

		const requestTurnCred = true;

		switch (params.assertJsRuntimeEnv) {
			case "browser": {
				const out: connection.ConnectParams.Browser = {
					"assertJsRuntimeEnv": "browser",
					requestTurnCred
				};
				return out;
			}
			case "react-native": {
				const out: connection.ConnectParams.ReactNative = {
					"assertJsRuntimeEnv": "react-native",
					requestTurnCred,
					"notConnectedUserFeedback": params.notConnectedUserFeedback
				};
				return out;
			}
		}

	})());

	const createWebphone = Webphone.createFactory(
		ua,
		appEvts,
		getApiCallerForSpecificSim,
		remoteApiCaller.core
	);

	appEvts.evtUsableSim.attachOnce(
		() => restartApp("New usable sim")
	);

	appEvts.evtSimPermissionLost.attach(
		() => restartApp("Permission lost for a Sim")
	);

	appEvts.evtSimPasswordChanged.attach(
		() => restartApp("One sim password have changed")
	);

	registerInteractiveAppEvtHandlers(
		appEvts,
		remoteApiCaller.core,
		dialogApi,
		startMultiDialogProcess,
		restartApp
	);

	return (await Promise.all(
		(await remoteApiCaller.core.getUsableUserSims())
			.map(userSim => createWebphone(userSim))
	)).sort(Webphone.sortPutingFirstTheOnesWithMoreRecentActivity);

}


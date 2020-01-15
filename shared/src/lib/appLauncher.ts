

import { appCryptoSetupHelper } from "./crypto/appCryptoSetupHelper";
import * as remoteApiCaller from "./toBackend/remoteApiCaller";
import { AuthenticatedSessionDescriptorSharedData } from "./localStorage/AuthenticatedSessionDescriptorSharedData";
import * as declaredPushNotificationToken from "./localStorage/declaredPushNotificationToken";
import { TowardUserKeys } from "./localStorage/TowardUserKeys";
import { sipUserAgentCreateFactory } from "./sipUserAgent";
import { appEvts } from "./toBackend/appEvts";
import { Webphone } from "./Webphone";
import * as connection from "./toBackend/connection";
import { tryLoginFromStoredCredentials } from "./tryLoginFromStoredCredentials";
import { restartApp, registerActionToPerformBeforeAppRestart } from "./restartApp";
import { env } from "./env";
import { 
	baseTypes as dialogBaseTypes, 
	provideCustomImplementationOfBaseApi as provideCustomImplementationOfDialogBaseApi, 
	dialogApi, startMultiDialogProcess } from "../tools/modal/dialog";
import * as webApiCaller from "./webApiCaller";
import { registerInteractiveAppEvtHandlers } from "./interactiveAppEvtHandlers";
import { getPushToken } from "./getPushToken";
import { id } from "../tools/id";
import { phoneNumber } from "phone-number/dist/lib";
import * as types from "./types/userSimAndPhoneCallUi";


const log: typeof console.log = true ?
	((...args) => console.log(...["[appLauncher]", ...args])) :
	(() => { });

export async function appLauncher(params: appLauncher.Params): Promise<{
	needLogin: boolean; //NOTE: fow web will always be false.
	prWebphones: Promise<Webphone[]>
}> {

	if (params.assertJsRuntimeEnv !== env.jsRuntimeEnv) {
		throw new Error("Wrong params for js runtime environnement");
	}

	if (params.assertJsRuntimeEnv === "react-native") {

		registerActionToPerformBeforeAppRestart(
			()=>params.actionToPerformBeforeAppRestart()
		);

		provideCustomImplementationOfDialogBaseApi(params.dialogBaseApi);


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

export namespace appLauncher {

	export type Params = Params.Browser | Params.ReactNative;

	export namespace Params {

		 type Base_ = {
            phoneCallUiCreateFactory: types.PhoneCallUi.CreateFactory;
		 }


		export type Browser = Base_ & {
			assertJsRuntimeEnv: "browser";
		};

		export type ReactNative = Base_ & {
			assertJsRuntimeEnv: "react-native";
			notConnectedUserFeedback: connection.ConnectParams.ReactNative["notConnectedUserFeedback"];
			actionToPerformBeforeAppRestart: ()=> Promise<void>;
			dialogBaseApi: dialogBaseTypes.Api;
		};

	}

}

async function appLauncher_onceLoggedIn(
	params: appLauncher.Params,
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


	const pushNotificationToken = await (() => {
		switch (params.assertJsRuntimeEnv) {
			case "browser": return undefined;
			case "react-native": return getPushToken();
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

	connection.connect((() => {

		const requestTurnCred = true;

		switch (params.assertJsRuntimeEnv) {
			case "browser": {
				return id<connection.ConnectParams.Browser>({
					"assertJsRuntimeEnv": "browser",
					requestTurnCred
				});
			}
			case "react-native": {
				return id<connection.ConnectParams.ReactNative>({
					"assertJsRuntimeEnv": "react-native",
					requestTurnCred,
					"notConnectedUserFeedback": params.notConnectedUserFeedback
				});
			}
		}

	})());

	appEvts.evtUsableSim.attachOnce(
		() => restartApp("New usable sim")
	);

	appEvts.evtSimPermissionLost.attach(
		() => restartApp("Permission lost for a Sim")
	);

	appEvts.evtSimPasswordChanged.attach(
		() => restartApp("One sim password have changed")
	);

	//NOTE: Must be resolved after user enabled sim permissions.
	let resolvePrReadyToInteract!: ()=> void;

	registerInteractiveAppEvtHandlers(
		new Promise(resolve=> resolvePrReadyToInteract = resolve),
		appEvts,
		remoteApiCaller.core,
		dialogApi,
		startMultiDialogProcess,
		restartApp
	);

	const userSims = await remoteApiCaller.core.getUsableUserSims();

	const prCreateWebphone = Webphone.createFactory({
		"sipUserAgentCreate": sipUserAgentCreateFactory({
			email,
			uaInstanceId,
			"cryptoRelatedParams": paramsNeededToInstantiateUa,
			"pushNotificationToken": pushNotificationToken ?? "",
			connection,
			appEvts
		}),
		appEvts,
		"getWdApiCallerForSpecificSim": remoteApiCaller.getWdApiCallerForSpecificSimFactory(
			paramsNeededToEncryptDecryptWebphoneData.encryptorDecryptor,
			email
		),
		"coreApiCaller": remoteApiCaller.core,
		"phoneCallUiCreate": await params.phoneCallUiCreateFactory({
			"sims": userSims.map(userSim => ({
				"imsi": userSim.sim.imsi,
				"friendlyName": userSim.friendlyName,
				"phoneNumber": (() => {

					const { number } = userSim.sim.storage;

					return number !== undefined ? phoneNumber.build(
						number,
						userSim.sim.country?.iso
					) : undefined;

				})(),
				"serviceProvider": (() => {

					const { fromImsi, fromNetwork } = userSim.sim.serviceProvider;

					return fromImsi ?? fromNetwork ?? "";

				})()
			}))
		})
	});

	resolvePrReadyToInteract();

	return (await Promise.all(
		userSims.map(
			userSim => prCreateWebphone.then(
				createWebphone => createWebphone(userSim)
			)
		)
	)).sort(Webphone.sortPutingFirstTheOnesWithMoreRecentActivity);

}


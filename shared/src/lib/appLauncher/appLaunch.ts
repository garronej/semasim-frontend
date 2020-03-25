
import { appCryptoSetupHelper } from "../crypto/appCryptoSetupHelper";
import { createSipUserAgentFactory } from "../createSipUserAgentFactory";
import { createWebphoneFactory } from "../createWebphoneFactory";
import { restartApp, registerActionToPerformBeforeAppRestart } from "../restartApp";
import { env } from "../env";
import {
	baseTypes as dialogBaseTypes,
	provideCustomImplementationOfBaseApi as provideCustomImplementationOfDialogBaseApi,
	dialogApi, startMultiDialogProcess
} from "../../tools/modal/dialog";
import { getPushToken } from "../getPushToken";
import { phoneNumber } from "phone-number/dist/lib";
import * as types from "../types";
import { Webphone } from "../types/Webphone";
import { id } from "../../tools/typeSafety/id";
import { assert } from "../../tools/typeSafety/assert";
import { getWebApi } from "../webApiCaller";
import { tryLoginWithStoredCredentialIfNotAlreadyLogedInFactory } from "../tryLoginWithStoredCredentialIfNotAlreadyLogedInFactory";
import { TowardUserKeys } from "../localStorage/TowardUserKeys";
import { Credentials } from "../localStorage/Credentials";
import { JustRegistered } from "../localStorage/JustRegistered";
import { AuthenticatedSessionDescriptorSharedData } from "../localStorage/AuthenticatedSessionDescriptorSharedData";
import * as declaredPushNotificationToken from "../localStorage/declaredPushNotificationToken";
import * as networkStateMonitoring from "../networkStateMonitoring";
import * as loginPageLogic from "../pageLogic/login";
import * as registerPageLogic from "../pageLogic/register";
import { minimalLaunch } from "./minimalLaunch";
import { createModal } from "../../tools/modal";


const log: typeof console.log = true ?
	((...args) => console.log(...["[appLaunch]", ...args])) :
	(() => { });


export namespace appLaunch {

	export type Params = Params.Browser | Params.ReactNative;

	export namespace Params {

		export type Common_ = {
			phoneCallUiCreateFactory: types.PhoneCallUi.CreateFactory;
		};


		export type Browser = Common_ & {
			assertJsRuntimeEnv: "browser";
		};


		export type ReactNative = Common_ & {
			assertJsRuntimeEnv: "react-native";
			notConnectedUserFeedback: import("../toBackend/connection").Params["notConnectedUserFeedback"];
			actionToPerformBeforeAppRestart: () => Promise<void>;
			dialogBaseApi: dialogBaseTypes.Api;
		};

	}

	export type Out = {
		dialogApi: typeof dialogApi;
		startMultiDialogProcess: typeof startMultiDialogProcess;
		createModal: typeof createModal;
		restartApp: typeof restartApp;
		prAuthenticationStep: Promise<AuthenticationStep>;
	};

	export type AuthenticationStep = AuthenticationStep.AuthenticationApi & {
		getAccountManagementApiAndWebphoneLauncher: GetAccountManagementApiAndWebphoneLauncher;
	};

	export namespace AuthenticationStep {

		export type AuthenticationApi =
			AuthenticationApi.NeedLogin |
			AuthenticationApi.DoNotNeedLogin;

		export namespace AuthenticationApi {

			export type NeedLogin = {
				needLogin: true;
				tryLoginWithStoredCredentialIfNotAlreadyLogedIn:
				import("../tryLoginWithStoredCredentialIfNotAlreadyLogedInFactory").TryLoginWithStoredCredentialIfNotAlreadyLogedIn;
				launchLogin: loginPageLogic.LaunchLogin;
				launchRegister: registerPageLogic.LaunchRegister;
			};

			export type DoNotNeedLogin = {
				needLogin: false;
			};

		}

	}

	export type GetAccountManagementApiAndWebphoneLauncher = (
		params: { prReadyToDisplayUnsolicitedDialogs: Promise<void>; }
	) => Promise<AccountManagementApiAndWebphoneLauncher>;

	export type AccountManagementApiAndWebphoneLauncher = {
		accountManagementApi: types.AccountManagementApi;
		getWebphones(params: { phoneCallUiCreateFactory: types.PhoneCallUi.CreateFactory }): Promise<types.Webphone[]>;
	};

}


export function appLaunch(
	params: {
		assertJsRuntimeEnv: "browser";
	} | {
		assertJsRuntimeEnv: "react-native";
		notConnectedUserFeedback: import("../toBackend/connection").Params["notConnectedUserFeedback"];
		actionToPerformBeforeAppRestart: () => Promise<void>;
		dialogBaseApi: dialogBaseTypes.Api;
	}
): appLaunch.Out {

	assert(!appLaunch.hasBeedCalled, "Should be called only once");

	appLaunch.hasBeedCalled = true;

	assert(
		params.assertJsRuntimeEnv === env.jsRuntimeEnv,
		"Wrong params for js runtime environnement"
	);

	if (params.assertJsRuntimeEnv === "react-native") {

		registerActionToPerformBeforeAppRestart(
			() => params.actionToPerformBeforeAppRestart()
		);

		provideCustomImplementationOfDialogBaseApi(params.dialogBaseApi);

	}

	return {
		dialogApi,
		startMultiDialogProcess,
		restartApp,
		createModal,
		"prAuthenticationStep": (async () => {

			const networkStateMonitoringApi = await networkStateMonitoring.getApi();

			const webApi = (() => {

				const { getLoginLogoutApi, ...rest } = getWebApi({
					AuthenticatedSessionDescriptorSharedData,
					networkStateMonitoringApi,
					restartApp
				});

				return {
					...rest,
					...getLoginLogoutApi({
						"assertJsRuntimeEnv": params.assertJsRuntimeEnv,
						Credentials,
						declaredPushNotificationToken
					})
				};

			})();

			const tryLoginWithStoredCredentialIfNotAlreadyLogedIn = tryLoginWithStoredCredentialIfNotAlreadyLogedInFactory((() => {
				switch (params.assertJsRuntimeEnv) {
					case "browser": return id<tryLoginWithStoredCredentialIfNotAlreadyLogedInFactory.Params.Browser>({
						"assertJsRuntimeEnv": params.assertJsRuntimeEnv,
						webApi
					});
					case "react-native": return id<tryLoginWithStoredCredentialIfNotAlreadyLogedInFactory.Params.ReactNative>({
						"assertJsRuntimeEnv": params.assertJsRuntimeEnv,
						Credentials,
						webApi
					});
				}
			})());


			const needLogin = await tryLoginWithStoredCredentialIfNotAlreadyLogedIn() === "NO VALID CREDENTIALS";

			return {
				...(needLogin ? ({
					"needLogin": true as const,
					tryLoginWithStoredCredentialIfNotAlreadyLogedIn,
					"launchLogin": loginPageLogic.factory({
						webApi,
						dialogApi,
						JustRegistered,
						TowardUserKeys
					}),
					"launchRegister": registerPageLogic.factory({
						webApi,
						dialogApi,
						JustRegistered,
					})
				}) : ({
					"needLogin": false as const
				})),
				"getAccountManagementApiAndWebphoneLauncher": id<appLaunch.GetAccountManagementApiAndWebphoneLauncher>(
					async ({ prReadyToDisplayUnsolicitedDialogs }) => {

						if (needLogin) {

							if (params.assertJsRuntimeEnv === "browser") {

								return restartApp("User not logged in (launching app)");

							}

							await AuthenticatedSessionDescriptorSharedData.evtChange
								.waitFor(authenticatedSessionDescriptorSharedData => !!authenticatedSessionDescriptorSharedData);

						}

						return onceLoggedIn((() => {

							const common_: onceLoggedIn.Params.Common_ = {
								prReadyToDisplayUnsolicitedDialogs,
								networkStateMonitoringApi,
								tryLoginWithStoredCredentialIfNotAlreadyLogedIn,
								webApi
							};

							switch (params.assertJsRuntimeEnv) {
								case "browser": return id<onceLoggedIn.Params.Browser>({
									"assertJsRuntimeEnv": params.assertJsRuntimeEnv,
									...common_
								});
								case "react-native": return id<onceLoggedIn.Params.ReactNative>({
									"assertJsRuntimeEnv": params.assertJsRuntimeEnv,
									"notConnectedUserFeedback": params.notConnectedUserFeedback,
									...common_
								});
							}

						})());

					}
				)
			};



		})()
	};




}

appLaunch.hasBeedCalled = false;

namespace onceLoggedIn {

	export type Params = Params.Browser | Params.ReactNative;

	export namespace Params {

		export type Common_ = {
			prReadyToDisplayUnsolicitedDialogs: Promise<void>;
			networkStateMonitoringApi: import("../networkStateMonitoring").NetworkStateMonitoring;
			tryLoginWithStoredCredentialIfNotAlreadyLogedIn: import("../tryLoginWithStoredCredentialIfNotAlreadyLogedInFactory").TryLoginWithStoredCredentialIfNotAlreadyLogedIn;
			webApi: Pick<import("../webApiCaller").WebApi, "declareUa"> & types.AccountManagementApi["webApi"]
		};


		export type Browser = Common_ & {
			assertJsRuntimeEnv: "browser";
		};


		export type ReactNative = Common_ & {
			assertJsRuntimeEnv: "react-native";
			notConnectedUserFeedback: appLaunch.Params.ReactNative["notConnectedUserFeedback"];
		};

	}

}




async function onceLoggedIn(
	params: onceLoggedIn.Params
): Promise<appLaunch.AccountManagementApiAndWebphoneLauncher> {

	const { webApi, networkStateMonitoringApi, tryLoginWithStoredCredentialIfNotAlreadyLogedIn, prReadyToDisplayUnsolicitedDialogs } = params;

	const { encryptedSymmetricKey, email, uaInstanceId } = await AuthenticatedSessionDescriptorSharedData.get();

	const { paramsNeededToEncryptDecryptWebphoneData, paramsNeededToInstantiateUa } = await appCryptoSetupHelper({
		"towardUserKeys": await TowardUserKeys.retrieve(),
		encryptedSymmetricKey
	});

	let pushNotificationToken: string | undefined = undefined;

	//TODO: If user delete and re create an account with same email and password
	//and to not re-open the app while the account was deleted the it will result
	//into the UA not being declared.
	//To fix this backend might return user.id_ so we can detect when it is not
	//the same user account. ( change need to be made in webApiCaller.loginUser )
	await (async () => {

		if (params.assertJsRuntimeEnv === "browser") {
			return;
		}

		pushNotificationToken = await getPushToken({
			"assertJsRuntimeEnv": params.assertJsRuntimeEnv
		});

		if (pushNotificationToken === await declaredPushNotificationToken.get()) {
			return;
		}

		log("Declaring UA");


		await webApi.declareUa({
			"assertJsRuntimeEnv": params.assertJsRuntimeEnv,
			"platform": env.hostOs!,
			pushNotificationToken
		});

		await declaredPushNotificationToken.set(pushNotificationToken);

	})();



	const {
		getWdApiFactory,
		connectionApi,
		coreApi,
		readyToDisplayUnsolicitedDialogs,
		userSims,
		userSimEvts
	} = await minimalLaunch((() => {

		const common_: minimalLaunch.Params.Common_ = {
			restartApp,
			dialogApi,
			startMultiDialogProcess,
			networkStateMonitoringApi,
			tryLoginWithStoredCredentialIfNotAlreadyLogedIn,
			AuthenticatedSessionDescriptorSharedData,
			"requestTurnCred": true
		};

		switch (params.assertJsRuntimeEnv) {
			case "browser": return id<minimalLaunch.Params.Browser>({
				"assertJsRuntimeEnv": params.assertJsRuntimeEnv,
				...common_
			});
			case "react-native": return id<minimalLaunch.Params.ReactNative>({
				"assertJsRuntimeEnv": params.assertJsRuntimeEnv,
				"notConnectedUserFeedback": params.notConnectedUserFeedback,
				...common_
			});
		}

	})());

	prReadyToDisplayUnsolicitedDialogs.then(() => readyToDisplayUnsolicitedDialogs());

	{

		userSimEvts.evtNew.attachOnce(
			({ cause }) => cause === "SIM REGISTERED FROM LAN",
			() => restartApp("Sim registered from lan")
		);

		userSimEvts.evtNowConfirmed.attachOnce(
			() => restartApp("Sim is now confirmed")
		);

		userSimEvts.evtDelete.attachOnce(
			({ cause }) => (
				cause === "PERMISSION LOSS" ||
				cause === "USER UNREGISTER SIM"
			),
			({ cause }) => restartApp(`Usable sim removed from set: ${cause}`)
		);


		if (params.assertJsRuntimeEnv === "react-native") {

			userSimEvts.evtFriendlyNameChange.attachOnce(
				() => restartApp("Sim friendlyName change")
			);

		}

	}

	const usableOnly = types.UserSim.Usable.Evts.build({ userSims, userSimEvts });

	return {
		"accountManagementApi": {
			email,
			...usableOnly,
			coreApi,
			webApi,
		},
		"getWebphones": async ({ phoneCallUiCreateFactory }) => {

			const createWebphone = createWebphoneFactory({
				"createSipUserAgent": createSipUserAgentFactory({
					email,
					uaInstanceId,
					"cryptoRelatedParams": paramsNeededToInstantiateUa,
					"pushNotificationToken": pushNotificationToken ?? "",
					connectionApi,
					userSimEvts
				}),
				"getWdApi": getWdApiFactory({
					"encryptorDecryptor": paramsNeededToEncryptDecryptWebphoneData.encryptorDecryptor,
					"userEmail": email
				}),
				"phoneCallUiCreate": await phoneCallUiCreateFactory({
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
				}),
				"userSimEvts": usableOnly.userSimEvts,
				coreApi
			});

			return Promise.all(
				usableOnly.userSims.map(createWebphone)
			).then(webphones => webphones.sort(Webphone.sortPuttingFirstTheOneThatWasLastUsed))

		}
	};

}





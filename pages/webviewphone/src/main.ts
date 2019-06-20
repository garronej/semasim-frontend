
import { Ua } from "../../../shared/dist/lib/Ua";
import * as connection from "../../../shared/dist/lib/toBackend/connection";
import * as remoteApiCaller from "../../../shared/dist/lib/toBackend/remoteApiCaller";
import * as localApiHandler from "../../../shared/dist/lib/toBackend/localApiHandlers";
import * as webApiCaller from "../../../shared/dist/lib/webApiCaller";
import { VoidSyncEvent } from "ts-events-extended";
import * as jsSipWebRTCIsolation from "../../../shared/dist/tools/pjSipWebRTCIsolation";
import { TowardUserKeys } from "../../../shared/dist/lib/localStorage/logic";
import * as cryptoLib from "crypto-lib";


const workerThreadPoolId = cryptoLib.workerThreadPool.Id.generate();

//NOTE: For now we don't actually use crypto here so we can disable multithreading.
cryptoLib.disableMultithreading();

declare const apiExposedByHost: jsSipWebRTCIsolation.Api.Methods & {
	onCallTerminated(errorMessage: null | string): void;
	onRingback(): void;
	onEstablished(): void;
};

let webRTCListeners: jsSipWebRTCIsolation.Api.Listeners;

if (typeof apiExposedByHost !== "undefined") {

	jsSipWebRTCIsolation.useAlternativeWebRTCImplementation(
		(() => {

			const webRTCApi: jsSipWebRTCIsolation.Api = {
				"methods": apiExposedByHost,
				"setListeners": listeners => webRTCListeners = listeners
			};

			return webRTCApi;

		})()
	);

	{

		let resolvePrErrorMessage: (errorMessage: string) => void;
		const prErrorMessage = new Promise<string>(resolve => resolvePrErrorMessage = resolve);

		window.onerror = (msg, url, lineNumber) => {
			resolvePrErrorMessage(`${msg}\n'${url}:${lineNumber}`);
			return false;
		};

		(Promise as any).onPossiblyUnhandledRejection(error => {
			resolvePrErrorMessage(`${error.message} ${error.stack}`);
		});

		prErrorMessage.then(errorMessage =>
			apiExposedByHost.onCallTerminated(errorMessage)
		);

	}

}


const evtAcceptIncomingCall = new VoidSyncEvent();

/** 
 * Never resolve and call onCallTerminated if anything goes wrong.
 * The returned ua is registering.
*/
async function initUa(session: typeof Ua["session"], imsi: string): Promise<Ua> {

	Ua.session= session;

	connection.connect({
		"connectionType": "AUXILIARY",
		"requestTurnCred": true,
		"uaInstanceId": session.instanceId
	});

	//NOTE: UA does not receive the live update on sim online state.
	localApiHandler.evtSimIsOnlineStatusChange.attachOnce(
		isOnline => !isOnline,
		() => apiExposedByHost.onCallTerminated("Socket disconnected")
	);

	const [userSim] = await Promise.all([
		remoteApiCaller.getUsableUserSims(false)
			.then(userSims => userSims.find(({ sim }) => sim.imsi === imsi)!)
	]);

	if (!userSim.isOnline) {

		apiExposedByHost.onCallTerminated("Sim is offline");
		await new Promise(_resolve => { });

	}

	const ua = new Ua(
		imsi,
		userSim.password,
		cryptoLib.rsa.encryptorFactory(
			cryptoLib.RsaKey.parse(
				userSim.towardSimEncryptKeyStr
			),
			workerThreadPoolId
		),
		"DISABLE MESSAGES"
	);

	ua.register();

	ua.evtRegistrationStateChanged.attachOnce(
		isRegistered => !isRegistered,
		() => apiExposedByHost.onCallTerminated("UA unregistered")
	);

	ua.evtRegistrationStateChanged.waitFor(6000)
		.catch(() => apiExposedByHost.onCallTerminated("UA failed to register"));

	return ua;

}


const START_ACTION = {
	"PLACE_OUTGOING_CALL": 0,
	"GET_READY_TO_ACCEPT_INCOMING_CALL": 1
};


const apiExposedToHost: jsSipWebRTCIsolation.Api.Listeners & {
	start(
		action: typeof START_ACTION[keyof typeof START_ACTION],
		email: string,
		secret: string,
		towardUserKeysStr: string,
		uaInstanceId: string,
		imsi: string,
		number: string
	): void;
	sendDtmf(signal: Ua.DtmFSignal, duration: number): void;
	terminateCall(): void;
	acceptIncomingCall(): void;
} = {
	...webRTCListeners!,
	"start": async (action, email, secret, towardUserKeysStr, uaInstanceId, imsi, number) => {

		cryptoLib.workerThreadPool.preSpawn(workerThreadPoolId, 1);

		{

			const { status } = await webApiCaller.loginUser(email, secret);

			if (status !== "SUCCESS") {
				apiExposedByHost.onCallTerminated("Login failed");
				return;
			}

		}

		const ua = await initUa(
			(() => {

				const towardUserKeys = TowardUserKeys.parse(
					towardUserKeysStr
				);

				return {
					email,
					"instanceId": uaInstanceId,
					"towardUserEncryptKey": towardUserKeys.encryptKey,
					"towardUserDecryptor": cryptoLib.rsa.decryptorFactory(
						towardUserKeys.decryptKey,
						workerThreadPoolId
					)
				};


			})(),
			imsi
		);

		switch (action) {
			case START_ACTION.PLACE_OUTGOING_CALL: {

				ua.evtIncomingCall.attach(({ terminate }) => terminate());

				await ua.evtRegistrationStateChanged.waitFor();

				const { terminate, prTerminated, prNextState } = await ua.placeOutgoingCall(number);

				apiExposedToHost.terminateCall = () => terminate();

				prTerminated.then(() => apiExposedByHost.onCallTerminated(null));

				prNextState.then(({ prNextState }) => {

					apiExposedByHost.onRingback();

					prNextState.then(({ sendDtmf }) => {

						apiExposedToHost.sendDtmf = (signal, duration) => sendDtmf(signal, duration);

						apiExposedByHost.onEstablished();

					});

				});

			} break;
			case START_ACTION.GET_READY_TO_ACCEPT_INCOMING_CALL: {

				const evtCallReceived = new VoidSyncEvent();

				ua.evtRegistrationStateChanged.attachOnce(
					isRegistered => isRegistered,
					() => {

						if (evtCallReceived.postCount === 0) {

							evtCallReceived.waitFor(1500)
								.catch(() => apiExposedByHost.onCallTerminated("Call missed"))
								;

						}

					}
				);

				const { terminate, prTerminated, onAccepted } = await ua.evtIncomingCall.waitFor(
					({ fromNumber }) => fromNumber === number
				);

				evtCallReceived.post();

				apiExposedToHost.terminateCall = () => terminate();

				prTerminated.then(() => apiExposedByHost.onCallTerminated(null));

				if (evtAcceptIncomingCall.postCount === 0) {
					await evtAcceptIncomingCall.waitFor();
				}

				const { sendDtmf } = await onAccepted();

				apiExposedToHost.sendDtmf = (signal, duration) => sendDtmf(signal, duration);

				apiExposedByHost.onEstablished();

			} break;
		}

	},
	"sendDtmf": () => apiExposedByHost.onCallTerminated("never"),
	"terminateCall": () => apiExposedByHost.onCallTerminated(null),
	"acceptIncomingCall": () => evtAcceptIncomingCall.post()
};

window["apiExposedToHost"] = apiExposedToHost;


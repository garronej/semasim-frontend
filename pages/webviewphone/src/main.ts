
import { Ua } from "../../../shared/dist/lib/Ua";
import * as connection from "../../../shared/dist/lib/toBackend/connection";
import * as remoteApiCaller from "../../../shared/dist/lib/toBackend/remoteApiCaller";
import * as localApiHandler from "../../../shared/dist/lib/toBackend/localApiHandlers";
import { getURLParameter } from "../../../shared/dist/lib/tools/getURLParameter";
import { VoidSyncEvent } from "ts-events-extended";
import * as jsSipWebRTCIsolation from "../../../shared/dist/lib/tools/pjSipWebRTCIsolation";
import * as observer from "../../../shared/dist/lib/tools/observer";

declare const Buffer: any;

declare const apiExposedByHost: jsSipWebRTCIsolation.Api.Methods & {
	onCallTerminated(errorMessage: null | string): void;
	onRingback(): void;
	onEstablished(): void;
};

{

	//const { onCallTerminated }= apiExposedByHost;

	apiExposedByHost["onCallTerminated"]= errorMessage=> {

		console.log({ errorMessage });

		console.log("Doing nothing, debugging...");

	};

}

observer.observeObjectProperty(navigator.mediaDevices, "getUserMedia");
observer.observeObjectProperty(window, "RTCPeerConnection");

console.log(
	JSON.stringify(
		Object.getOwnPropertyNames(apiExposedByHost),
		null,
		2
	)
);


let webRTCListeners: jsSipWebRTCIsolation.Api.Listeners;

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

const evtAcceptIncomingCall = new VoidSyncEvent();

const readEmailFromUrl = () => Buffer.from(getURLParameter("email_as_hex"), "hex").toString("utf8");

/** 
 * Never resolve and call onCallTerminated if anything goes wrong.
 * The returned ua is registering.
*/
async function initUa(uaInstanceId: string, email: string, imsi: string): Promise<Ua> {

	connection.connect({
		"requestTurnCred": true,
		uaInstanceId
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

	Ua.setUaInstanceId(uaInstanceId, email);

	if (!userSim.isOnline) {

		apiExposedByHost.onCallTerminated("Sim is offline");
		await new Promise(_resolve => { });

	}

	const ua = new Ua(userSim.sim.imsi, userSim.password, "DISABLE MESSAGES");

	ua.register();

	ua.evtRegistrationStateChanged.attachOnce(
		isRegistered => !isRegistered,
		() => apiExposedByHost.onCallTerminated("UA unregistered")
	);

	ua.evtRegistrationStateChanged.waitFor(6000)
		.catch(() => apiExposedByHost.onCallTerminated("UA failed to register"));

	return ua;

}



const apiExposedToHost: jsSipWebRTCIsolation.Api.Listeners & {
	placeOutgoingCall(uaInstanceId: string, imsi: string, number: string): void;
	getReadyToAcceptIncomingCall(uaInstanceId: string, imsi: string, number: string): void;
	sendDtmf(signal: Ua.DtmFSignal, duration: number): void;
	terminateCall(): void;
	acceptIncomingCall(): void;
} = {
	...webRTCListeners!,
	"placeOutgoingCall": async (uaInstanceId, imsi, number) => {

		console.log("waiting...");

		await new Promise(resolve => setTimeout(resolve,5000));

		console.log("go!");

		const ua = await initUa(uaInstanceId, readEmailFromUrl(), imsi);

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

	},
	/** Assume androidEventHandles.onReady() have been called  */
	"getReadyToAcceptIncomingCall": async (uaInstanceId, imsi, number) => {

		const ua = await initUa(uaInstanceId, readEmailFromUrl(), imsi);

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

	},
	"sendDtmf": () => apiExposedByHost.onCallTerminated("never"),
	"terminateCall": () => apiExposedByHost.onCallTerminated(null),
	"acceptIncomingCall": () => evtAcceptIncomingCall.post()
};

window["apiExposedToHost"] = apiExposedToHost;


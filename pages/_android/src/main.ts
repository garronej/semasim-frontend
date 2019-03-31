
import { Ua } from "../../../shared/dist/lib/Ua";
import * as connection from "../../../shared/dist/lib/toBackend/connection";
import * as remoteApiCaller from "../../../shared/dist/lib/toBackend/remoteApiCaller";
import * as localApiHandler from "../../../shared/dist/lib/toBackend/localApiHandlers";
import { getURLParameter } from "../../../shared/dist/lib/tools/getURLParameter";
import { VoidSyncEvent } from "ts-events-extended";

declare const Buffer: any;

declare const androidEventHandlers: {
	/** Always called no matter what */
	onCallTerminated(errorMessage: string | null): void;
	onRingback(): void;
	onEstablished(): void;
	onReady(): void;

};

window.onerror = (msg, url, lineNumber) => {
	androidEventHandlers.onCallTerminated(`${msg}\n'${url}:${lineNumber}`);
	return false;
};

if ("onPossiblyUnhandledRejection" in Promise) {

	(Promise as any).onPossiblyUnhandledRejection( error => {
		androidEventHandlers.onCallTerminated(error.message + " " + error.stack);
	});

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
		() => androidEventHandlers.onCallTerminated("Socket disconnected")
	);

	const [userSim] = await Promise.all([
		remoteApiCaller.getUsableUserSims(false)
			.then(userSims => userSims.find(({ sim }) => sim.imsi === imsi)!)
	]);

	Ua.setUaInstanceId(uaInstanceId, email);

	if (!userSim.isOnline) {

		androidEventHandlers.onCallTerminated("Sim is offline");
		await new Promise(_resolve => { });

	}

	const ua = new Ua(userSim.sim.imsi, userSim.password, "DISABLE MESSAGES");

	ua.register();

	ua.evtRegistrationStateChanged.attachOnce(
		isRegistered => !isRegistered,
		() => androidEventHandlers.onCallTerminated("UA unregistered")
	);

	ua.evtRegistrationStateChanged.waitFor( 6000)
		.catch(() => androidEventHandlers.onCallTerminated("UA failed to register"));

	return ua;

}

const exposedToAndroid = {
	/** Assume androidEventHandles.onReady() have been called  */
	"placeOutgoingCall": async (uaInstanceId: string, imsi: string, number: string) => {

		const ua = await initUa(uaInstanceId, readEmailFromUrl(), imsi);

		ua.evtIncomingCall.attach(({ terminate }) => terminate());

		await ua.evtRegistrationStateChanged.waitFor();

		const { terminate, prTerminated, prNextState } = await ua.placeOutgoingCall(number);

		exposedToAndroid.terminateCall = () => terminate();

		prTerminated.then(() => androidEventHandlers.onCallTerminated(null));

		prNextState.then(({ prNextState }) => {

			androidEventHandlers.onRingback();

			prNextState.then(({ sendDtmf }) => {

				exposedToAndroid.sendDtmf = (signal, duration) => sendDtmf(signal, duration);

				androidEventHandlers.onEstablished();

			});

		});

	},
	/** Assume androidEventHandles.onReady() have been called  */
	"getReadyToAcceptIncomingCall": async (uaInstanceId: string, imsi: string, number: string) => {

		const ua = await initUa(uaInstanceId, readEmailFromUrl(), imsi);

		const wrap = await ua.evtIncomingCall.waitFor(
			({ fromNumber }) => fromNumber === number,
			7000
		).catch(() => undefined);

		if (wrap === undefined) {

			androidEventHandlers.onCallTerminated("Call missed");

			return;

		}

		const { terminate, prTerminated, onAccepted } = wrap;

		exposedToAndroid.terminateCall = () => terminate()

		prTerminated.then(() => androidEventHandlers.onCallTerminated(null));

		if (evtAcceptIncomingCall.postCount === 0) {
			await evtAcceptIncomingCall.waitFor();
		}

		const { sendDtmf } = await onAccepted();

		exposedToAndroid.sendDtmf = (signal, duration) => sendDtmf(signal, duration);

		androidEventHandlers.onEstablished();

	},
	"sendDtmf": (signal: Ua.DtmFSignal, duration: number) => androidEventHandlers.onCallTerminated("never"),
	"terminateCall": () => androidEventHandlers.onCallTerminated(null),
	"acceptIncomingCall": () => evtAcceptIncomingCall.post()
};


window["exposedToAndroid"] = exposedToAndroid

document.addEventListener("DOMContentLoaded", () => androidEventHandlers.onReady());


import { Ua } from "../../../shared/dist/lib/Ua";
import * as connection from "../../../shared/dist/lib/toBackend/connection";
import * as remoteApiCaller from "../../../shared/dist/lib/toBackend/remoteApiCaller";
import * as localApiHandler from "../../../shared/dist/lib/toBackend/localApiHandlers";
import { getURLParameter } from "../../../shared/dist/lib/tools/getURLParameter";

declare const Buffer: any;

declare const androidEventHandlers: {
	onOutgoingCallTerminated(): void;
	onOutgoingCallStateRingback(): void;
	onOutgoingCallStateEstablished(): void;
	onError(message: string): void;
	onReady(): void;
};

window.onerror = (msg, url, linenumber) => {
	androidEventHandlers.onError(msg + '\n' + url + ':' + linenumber);
	return false;
};

if ("onPossiblyUnhandledRejection" in Promise) {

	(Promise as any).onPossiblyUnhandledRejection((error) => {
		androidEventHandlers.onError(error.message + " " + error.stack);
	});

}

const exposedToAndroid = {
	"placeOutgoingCall": async (imsi: string, number: string, uaInstanceId: string) => {
		//Assume androidEventHandles.onReady() have been called.

		console.log("placeOutgoingCall" + JSON.stringify({ imsi, number }, null, 2));

		localApiHandler.evtSimIsOnlineStatusChange.attachOnce(
			isOnline => !isOnline,
			() => androidEventHandlers.onError(`Sim no longer online or socket disconnected`)
		);

		const [userSim] = await Promise.all([
			remoteApiCaller.getUsableUserSims(false)
				.then(userSims => userSims.find(({ sim }) => sim.imsi === imsi)!)
		]);

		Ua.setUaInstanceId(
			uaInstanceId,
			Buffer.from(getURLParameter("email_as_hex"), "hex").toString("utf8") 
		);

		if (!userSim.isOnline) {

			androidEventHandlers.onError("Sim is offline");
			return;

		}

		const ua = new Ua(userSim.sim.imsi, userSim.password, "DISABLE MESSAGES");

		ua.evtIncomingCall.attach(
			async ({ terminate }) => terminate()
		);

		ua.register();

		ua.evtRegistrationStateChanged.attachOnce(
			isRegistered => !isRegistered,
			() => androidEventHandlers.onError("UA unregistered")
		);

		try {

			await ua.evtRegistrationStateChanged.waitFor(
				isRegistered => isRegistered,
				6000
			);

		} catch{

			androidEventHandlers.onError("UA failed to register");
			return;

		}

		console.log("About to place outgoing call");

		const { terminate, prTerminated, prNextState } =
			await ua.placeOutgoingCall(number);

		console.log("Outgoing call placed");

		exposedToAndroid.outgoingCallTerminate = () => terminate();

		prTerminated.then(() => androidEventHandlers.onOutgoingCallTerminated());

		prNextState.then(({ prNextState }) => {

			console.log("Ringing");

			androidEventHandlers.onOutgoingCallStateRingback();

			prNextState.then(({ sendDtmf }) => {

				exposedToAndroid.outgoingCallSendDtmf = (signal: string, duration: number) =>
					sendDtmf(signal as Ua.DtmFSignal, duration)

				androidEventHandlers.onOutgoingCallStateEstablished();

			});

		});

	},
	"outgoingCallSendDtmf": (signal: string, duration: number) => {
		androidEventHandlers.onError("outgoingCallSendDtmf cant be called now");
	},
	"outgoingCallTerminate": () => {
		androidEventHandlers.onOutgoingCallTerminated();
	}

};

window["exposedToAndroid"] = exposedToAndroid

document.addEventListener("DOMContentLoaded", () => {
	connection.connect({ 
		"sessionType": "AUXILIARY", 
		"requestTurnCred": true 
	});
	androidEventHandlers.onReady();
});


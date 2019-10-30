
import { UiWebphoneController } from "./UiWebphoneController";
import * as connection from "frontend-shared/dist/lib/toBackend/connection";
import * as remoteApiCaller from "frontend-shared/dist/lib/toBackend/remoteApiCaller";
import * as webApiCaller from "frontend-shared/dist/lib/webApiCaller";
import { dialogApi } from "frontend-shared/dist/tools/modal/dialog";
import * as backendEvents from "frontend-shared/dist/lib/toBackend/events";

import * as types from "frontend-shared/dist/lib/types/userSim";
import * as wd from "frontend-shared/dist/lib/types/webphoneData/logic";
import { AuthenticatedSessionDescriptorSharedData } from
	"frontend-shared/dist/lib/localStorage/AuthenticatedSessionDescriptorSharedData";
import * as availablePages from "frontend-shared/dist/lib/availablePages";
import * as observer from "frontend-shared/dist/tools/observer";
import { setWebDataEncryptorDecryptorAndGetCryptoRelatedParamsNeededToInstantiateUa } from
	"frontend-shared/dist/lib/crypto/setWebDataEncryptorDecryptorAndGetCryptoRelatedParamsNeededToInstantiateUa";
import { uaInstantiationHelper } from "frontend-shared/dist/lib/Ua"
import { SyncEvent, VoidSyncEvent } from "frontend-shared/node_modules/ts-events-extended";


import * as overrideWebRTCImplementation from "frontend-shared/dist/tools/overrideWebRTCImplementation";

overrideWebRTCImplementation.testOverrideWebRTCImplementation();

observer.observeWebRTC();

$(document).ready(async () => {

	$("#logout").click(async () => {

		await webApiCaller.logoutUser();

		location.href = `/${availablePages.PageName.login}`;

	});

	//TODO: Do this in every page that require the user to be logged in.
	if (!(await AuthenticatedSessionDescriptorSharedData.isPresent())) {
		//NOTE: User have deleted local storage but still have cookie.
		$("#logout").trigger("click");
		return;

	}

	const ua = await uaInstantiationHelper({
		"cryptoRelatedParams": await setWebDataEncryptorDecryptorAndGetCryptoRelatedParamsNeededToInstantiateUa(),
		"pushNotificationToken": ""
	});

	connection.connect({ "requestTurnCred": true });

	$("#page-payload").html("");

	dialogApi.loading("Decrypting your conversation history 🔐", 0);

	const userSims = await remoteApiCaller.getUsableUserSims();

	if (userSims.length === 0) {

		window.location.href = "/manager";

	}

	const wdInstances = await (async () => {

		const out = new Map<types.UserSim, wd.Instance<"PLAIN">>();

		await Promise.all(
			userSims.map(
				userSim => remoteApiCaller.getOrCreateWdInstance(userSim)
					.then(wdInstance => out.set(userSim, wdInstance))
			)
		);

		return out;

	})();






	//NOTE: Sort user sims so we always have the most relevant at the top of the page.
	userSims
		.sort((s1, s2) => {

			if (!!s1.reachableSimState !== !!s2.reachableSimState) {
				return !!s1.reachableSimState ? 1 : -1;
			}

			const [c1, c2] = [s1, s2].map(userSim =>
				wd.getChatWithLatestActivity(
					wdInstances.get(userSim)!
				)
			);

			if (!c1 !== !c2) {
				return !!c1 ? 1 : -1;
			}

			if (!c1) {
				return 0;
			}

			return wd.compareChat(c1, c2!);

		})
		.reverse()
		.forEach(userSim => $("#page-payload").append(
			(
				new UiWebphoneController(
					ua,
					userSim,
					wdInstances.get(userSim)!,
					buildUiWebphoneControllerBackendEvents(userSim),
					uiWebphoneControllerRemoteApiCaller
				)
			).structure
		));




	dialogApi.dismissLoading();

	backendEvents.evtSimPermissionLost.attach(
		async userSim => {

			await dialogApi.create("alert", {
				"message": `${userSim.ownership.ownerEmail} revoked your access to ${userSim.friendlyName}`
			});

			//TODO: Improve
			location.reload();

		}
	);

	backendEvents.evtSimPasswordChanged.attach(
		async userSim => {

			//TODO: Improve
			await dialogApi.create("alert", {
				"message": `Sim password changed for ${userSim.friendlyName}, need page reload`
			});

			location.reload();

		}
	);

	backendEvents.evtUsableSim.attach(
		async userSim => $("#page-payload").append(
			(
				new UiWebphoneController(
					ua,
					userSim,
					await remoteApiCaller.getOrCreateWdInstance(
						userSim
					),
					buildUiWebphoneControllerBackendEvents(userSim),
					uiWebphoneControllerRemoteApiCaller
				)
			).structure
		)
	);

});

const uiWebphoneControllerRemoteApiCaller: UiWebphoneController.RemoteApiCaller = (() => {

	const {
		newWdChat,
		updateWdChatContactInfos,
		newWdMessage,
		notifySendReportReceived,
		notifyStatusReportReceived,
		updateWdChatIdOfLastMessageSeen,
		shouldAppendPromotionalMessage,
		notifyUaFailedToSendMessage,
		updateContactName,
		createContact,
		deleteContact,
		destroyWdChat,
		fetchOlderWdMessages
	} = remoteApiCaller;

	return {
		newWdChat,
		updateWdChatContactInfos,
		newWdMessage,
		notifySendReportReceived,
		notifyStatusReportReceived,
		updateWdChatIdOfLastMessageSeen,
		shouldAppendPromotionalMessage,
		notifyUaFailedToSendMessage,
		updateContactName,
		createContact,
		deleteContact,
		destroyWdChat,
		fetchOlderWdMessages
	};

})();

function buildUiWebphoneControllerBackendEvents(userSim: types.UserSim.Usable): UiWebphoneController.BackendEvents {

	function clone1<T extends { userSim: types.UserSim.Usable; }>(
		evt: SyncEvent<T>,
		userSim: types.UserSim.Usable
	): SyncEvent<Omit<T, "userSim">> {

		const out = new SyncEvent<Omit<T, "userSim">>();

		evt.attach(
			evtData => evtData.userSim === userSim,
			({ userSim, ...rest }) => out.post(rest)
		);

		return out;

	}

	function clone2(
		evt: SyncEvent<types.UserSim.Usable>,
		userSim: types.UserSim.Usable
	): VoidSyncEvent {

		const out = new VoidSyncEvent();

		evt.attach(
			evtData => evtData === userSim,
			() => out.post()
		);

		return out;

	}


	return {
		...(() => {

			const key = "evtContactCreatedOrUpdated";

			return { [key]: clone1(backendEvents[key], userSim) };

		})(),
		...(() => {

			const key = "evtContactDeleted";

			return { [key]: clone1(backendEvents[key], userSim) };

		})(),
		...(() => {

			const key = "evtSimReachabilityStatusChange";

			return { [key]: clone2(backendEvents[key], userSim) };

		})(),
		...(() => {

			const key = "evtSimGsmConnectivityChange";

			return { [key]: clone2(backendEvents[key], userSim) };

		})(),
		...(() => {

			const key = "evtSimCellSignalStrengthChange";

			return { [key]: clone2(backendEvents[key], userSim) };

		})(),
		...(() => {

			const key = "evtOngoingCall";

			return { [key]: clone2(backendEvents[key], userSim) };

		})()

	};


}


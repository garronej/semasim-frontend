
import { Ua } from "../../../shared/dist/lib/Ua";
import { UiWebphoneController } from "./UiWebphoneController";
import * as connection from "../../../shared/dist/lib/toBackend/connection";
import * as remoteApiCaller from "../../../shared/dist/lib/toBackend/remoteApiCaller";
import * as webApiCaller from "../../../shared/dist/lib/webApiCaller";
import * as bootbox_custom from "../../../shared/dist/tools/bootbox_custom";
import * as localApiHandlers from "../../../shared/dist/lib/toBackend/localApiHandlers";
import * as types from "../../../shared/dist/lib/types/userSim";
import * as wd from "../../../shared/dist/lib/types/webphoneData/logic";
import * as crypto from "../../../shared/dist/lib/crypto";
import * as cryptoLib from "crypto-lib";
import * as cookies from "../../../shared/dist/lib/cookies/logic/frontend";
import * as localStorage from "../../../shared/dist/lib/localStorage/logic";
import * as availablePages from "../../../shared/dist/lib/availablePages";
import { rsaWorkerThreadPoolId } from "./workerThreadPoolId";
//import * as observer from "../../../shared/dist/tools/observer";

import * as overrideWebRTCImplementation from "../../../shared/dist/tools/overrideWebRTCImplementation";

overrideWebRTCImplementation.testOverrideWebRTCImplementation();

//observer.observeWebRTC();

$(document).ready(async () => {

	$("#logout").click(async () => {

		await webApiCaller.logoutUser();

		location.href = `/${availablePages.PageName.login}`;

	});

	{

		const { email, webUaInstanceId, encryptedSymmetricKey } = cookies.AuthenticatedSessionDescriptorSharedData.get();

		//NOTE: Only one thread as for rsa we need the encrypt function to be run exclusive.
		cryptoLib.workerThreadPool.preSpawn(rsaWorkerThreadPoolId, 1);

		const towardUserKeys = localStorage.TowardUserKeys.retrieve();

		if (towardUserKeys === undefined) {

			$("#logout").trigger("click");
			return;

		}

		const towardUserDecryptor = cryptoLib.rsa.decryptorFactory(
			towardUserKeys.decryptKey,
			rsaWorkerThreadPoolId
		);

		{

			const aesWorkerThreadPoolId = cryptoLib.workerThreadPool.Id.generate();

			cryptoLib.workerThreadPool.preSpawn(aesWorkerThreadPoolId, 3);

			remoteApiCaller.setWebDataEncryptorDescriptor(
				cryptoLib.aes.encryptorDecryptorFactory(
					await crypto.symmetricKey.decryptKey(
						towardUserDecryptor,
						encryptedSymmetricKey
					),
					aesWorkerThreadPoolId
				)
			);

		}

		Ua.session = {
			email,
			"instanceId": webUaInstanceId,
			"towardUserEncryptKeyStr": cryptoLib.RsaKey.stringify(
				towardUserKeys.encryptKey
			),
			towardUserDecryptor
		};

	}

	connection.connect({
		"connectionType": "MAIN",
		"requestTurnCred": true
	});

	$("#page-payload").html("");

	bootbox_custom.loading("Decrypting your conversation history 🔐", 0);

	const userSims = await remoteApiCaller.getUsableUserSims();

	if (userSims.length === 0) {

		window.location.href = "/manager";

	}

	const wdInstances = new Map<types.UserSim, wd.Instance<"PLAIN">>();

	await Promise.all([
		...userSims.map(
			userSim => remoteApiCaller.getOrCreateWdInstance(userSim)
				.then(wdInstance => { wdInstances.set(userSim, wdInstance) })
		),
	]);

	//NOTE: Sort user sims so we always have the most relevant at the top of the page.
	userSims
		.sort((s1, s2) => {

			if (s1.isOnline !== s2.isOnline) {
				return s1.isOnline ? 1 : -1;
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
					userSim,
					wdInstances.get(userSim)!
				)
			).structure
		));


	bootbox_custom.dismissLoading();

	localApiHandlers.evtSimPermissionLost.attachOnce(
		userSim => {

			bootbox_custom.alert(
				`${userSim.ownership.ownerEmail} revoked your access to ${userSim.friendlyName}`
			);

			//TODO: Improve
			location.reload();

		}
	);

	remoteApiCaller.evtUsableSim.attach(
		async userSim => $("#page-payload").append(
			(
				new UiWebphoneController(
					userSim,
					await remoteApiCaller.getOrCreateWdInstance(
						userSim
					)
				)
			).structure
		)
	);

});


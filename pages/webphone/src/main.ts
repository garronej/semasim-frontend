declare const require: (path: string) => any;
require("es6-map/implement");
require("es6-weak-map/implement");
require("array.prototype.find").shim();

import { Ua } from "./Ua";
import { UiWebphoneController, Action } from "./UiWebphoneController";
import * as connection from "../../../shared/dist/lib/toBackend/connection";
import * as remoteApiCaller from "../../../shared/dist/lib/toBackend/remoteApiCaller";
import * as webApiCaller from "../../../shared/dist/lib/webApiCaller";
import * as bootbox_custom from "../../../shared/dist/lib/tools/bootbox_custom";
import * as localApiHandlers from "../../../shared/dist/lib/toBackend/localApiHandlers";
import * as types from "../../../shared/dist/lib/types";
import * as DetectRTC from "detectrtc";
import { phoneNumber } from "phone-number";
import { getURLParameter } from "../../../shared/dist/lib/tools/getURLParameter";
import { backToAppUrl } from "../../../shared/dist/lib/backToAndroidAppUrl";

declare const Buffer: any;

$(document).ready(async () => {

	$("#logout").click(async () => {

		await webApiCaller.logoutUser();

		window.location.href = "/login";

	});

	connection.connect("REQUEST TURN CRED");

	$("#page-payload").html("");

	const action: (Action & { imsi: string; }) | undefined = (() => {

		const type = getURLParameter("action") as Action["type"] | undefined;

		if (!type) {
			return undefined;
		}

		switch (type) {
			case "CALL":
				return {
					type,
					"number": Buffer.from(getURLParameter("number_as_hex"), "hex")
						.toString("utf8"),
					"imsi": getURLParameter("imsi")!
				};
		}

	})();

	if (!!action) {

		bootbox_custom.loading(`Preparing call to ${phoneNumber.prettyPrint(action.number)}`, 0);

		const userSim = await remoteApiCaller.getUsableUserSims()
			.then(userSims => userSims.find(({ sim }) => sim.imsi === action.imsi)!);

		if (!userSim.isOnline) {

			await new Promise(resolve =>
				bootbox_custom.alert(
					`${userSim.friendlyName} is currently offline`,
					() => resolve()
				)
			);

			window.location.href = backToAppUrl;
			return;


		}

		const [wdInstance] = await Promise.all([
			remoteApiCaller
				.getOrCreateWdInstance(userSim)
				.then(wdInstance => wdInstance),
			new Promise<void>(resolve => DetectRTC.load(async () => {

				if (!DetectRTC.isRtpDataChannelsSupported) {

					await new Promise(resolve =>
						bootbox_custom.alert(
							"Call not supported by this browser sorry. ( Try updating google chrome ) ",
							() => resolve()
						)
					);

					window.location.href = backToAppUrl;
					return;

				}

				resolve();

			})),
			Ua.init()
		]);

		bootbox_custom.dismissLoading();

		$("#page-payload").append(
			(
				new UiWebphoneController(
					userSim,
					wdInstance,
					action
				)
			).structure
		);

		return;

	}


	bootbox_custom.loading("Fetching contacts and SMS history", 0);

	const userSims = await remoteApiCaller.getUsableUserSims();

	if (userSims.length === 0) {

		window.location.href = "/manager";

	}

	const wdInstances = new Map<types.UserSim, types.webphoneData.Instance>();


	await Promise.all([
		new Promise<void>(resolve => DetectRTC.load(resolve)),
		Ua.init(),
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
				types.webphoneData.getChatWithLatestActivity(
					wdInstances.get(userSim)!
				)
			);

			if (!c1 !== !c2) {
				return !!c1 ? 1 : -1;
			}

			if (!c1) {
				return 0;
			}

			return types.webphoneData.compareChat(c1, c2!);

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


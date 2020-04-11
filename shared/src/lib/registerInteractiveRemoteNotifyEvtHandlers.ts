import * as dcTypes from "chan-dongle-extended-client/dist/lib/types";
import * as types from "./types";
import { env } from "./env";

type DialogApi = import("../tools/modal/dialog").DialogApi;

type CoreApi = Pick<import("./toBackend/remoteApiCaller").CoreApi,
    "unlockSim" |
    "registerSim" |
    "rejectSharingRequest" |
    "acceptSharingRequest"
>;

type RemoteNotifyEvts = Pick<types.RemoteNotifyEvts, "evtDongleOnLan" | "evtOpenElsewhere">;

type UserSimEvts = Pick<
    types.UserSim.Evts,
    "evtNew" | "evtSharedUserSetChange"
>;

export function registerInteractiveRemoteNotifyEvtHandlers(
    params: {
        getUsableSimFriendlyNames: () => string[];
        sharedNotConfirmedUserSims: types.UserSim.Shared.NotConfirmed[],
        userSimEvts: UserSimEvts,
        prReadyToDisplayUnsolicitedDialogs: Promise<void>,
        remoteNotifyEvts: RemoteNotifyEvts,
        coreApi: CoreApi,
        dialogApi: import("../tools/modal/dialog").DialogApi,
        startMultiDialogProcess: typeof import("../tools/modal/dialog").startMultiDialogProcess,
        restartApp: (typeof import("./restartApp"))["restartApp"]
    }
) {

    const {
        getUsableSimFriendlyNames, userSimEvts, prReadyToDisplayUnsolicitedDialogs, remoteNotifyEvts, coreApi,
        dialogApi, startMultiDialogProcess, restartApp
    } = params;

    const interactiveProcedures = getInteractiveProcedures({
        coreApi,
        getUsableSimFriendlyNames
    });

    remoteNotifyEvts.evtDongleOnLan.attach(
        eventData => prReadyToDisplayUnsolicitedDialogs.then(async () => {

            const { dialogApi, endMultiDialogProcess } = startMultiDialogProcess();

            await ((eventData.type === "LOCKED") ?
                interactiveProcedures.onLockedDongleOnLan(
                    eventData.dongle,
                    eventData.prSimUnlocked,
                    dialogApi
                ) : interactiveProcedures.onUsableDongleOnLan(
                    eventData.dongle,
                    dialogApi
                ));

            endMultiDialogProcess();

        })
    );

    {

        const handler = (userSim: types.UserSim.Shared.NotConfirmed) =>
            prReadyToDisplayUnsolicitedDialogs.then(async () => {

                const { endMultiDialogProcess, dialogApi } = startMultiDialogProcess();

                await interactiveProcedures.onSimSharingRequest(userSim, dialogApi)

                endMultiDialogProcess();

            });

        userSimEvts.evtNew.attach(
            eventData => {

                if (eventData.cause !== "SHARING REQUEST RECEIVED") {
                    return;
                }

                handler(eventData.userSim);

            }
        );

        params.sharedNotConfirmedUserSims.forEach(handler);

    }

    userSimEvts.evtSharedUserSetChange.attach(
        ({ userSim: { friendlyName }, action, targetSet, email }) => prReadyToDisplayUnsolicitedDialogs.then(() => {

            const acceptedOrRejectedAlert = (isAccepted: boolean) =>
                dialogApi.create(
                    "alert",
                    { "message": `${email} ${isAccepted ? "accepted" : "rejected"} the sharing request for ${friendlyName}` }
                );

            switch (action) {
                case "MOVE TO CONFIRMED":
                    acceptedOrRejectedAlert(true);
                    return;
                case "REMOVE":
                    switch (targetSet) {
                        case "NOT CONFIRMED USERS":
                            acceptedOrRejectedAlert(false);
                            return;
                        case "CONFIRMED USERS":
                            dialogApi.create(
                                "alert",
                                { "message": `${email} no longer share ${friendlyName}` }
                            );
                            return;
                    }
            }


        })
    );

    remoteNotifyEvts.evtOpenElsewhere.attachOnce(
        () => prReadyToDisplayUnsolicitedDialogs.then(() =>
            dialogApi.create(
                "alert",
                {
                    "message": "You are connected somewhere else",
                    "callback": () => restartApp("Connected somewhere else with uaInstanceId")
                }
            )
        )
    );

}


function getInteractiveProcedures(params: {
    coreApi: Pick<CoreApi, "unlockSim" | "registerSim" | "rejectSharingRequest" | "acceptSharingRequest">,
    getUsableSimFriendlyNames: () => string[];

}) {

    const { coreApi, getUsableSimFriendlyNames } = params;

    const getDefaultFriendlyName = (sim: dcTypes.Sim): string => {

        let tag = sim.serviceProvider.fromImsi ?? sim.serviceProvider.fromNetwork ?? "";

        const num = sim.storage.number;

        if (!tag && num && num.length > 6) {

            tag = num.slice(0, 4) + ".." + num.slice(-2);

        }

        tag = tag || "X";

        let build = (i: number) => `SIM ${tag}${i === 0 ? "" : ` ( ${i} )`}`;

        let i = 0;


        while (
            getUsableSimFriendlyNames().filter(
                friendlyName => friendlyName === build(i)
            ).length
        ) {
            i++;
        }

        return build(i);

    };

    return {
        "onLockedDongleOnLan": async (
            dongle: dcTypes.Dongle.Locked,
            prSimUnlocked: Promise<void>,
            dialogApi: DialogApi
        ) => {

            if (dongle.sim.pinState !== "SIM PIN") {

                await dialogApi.create(
                    "alert",
                    { "message": `${dongle.sim.pinState} require manual unlock` }
                );

                return;

            }

            let isPrSimUnlockedResolved = false;

            prSimUnlocked.then(() => isPrSimUnlockedResolved = true);


            const pin = await (async function callee(): Promise<string | undefined> {

                const pin = await new Promise<string | null>(
                    resolve => dialogApi.create("prompt", {
                        "title": `PIN code for sim inside ${dongle.manufacturer} ${dongle.model} (${dongle.sim.tryLeft} tries left)`,
                        "inputType": "number",
                        "callback": result => resolve(result)
                    })
                );

                if (pin === null) {
                    return undefined;
                }

                if (!pin.match(/^[0-9]{4}$/)) {

                    let shouldContinue = await new Promise<boolean>(
                        resolve => dialogApi.create("confirm", {
                            "title": "PIN malformed!",
                            "message": "A pin code is composed of 4 digits, e.g. 0000",
                            callback: result => resolve(result)
                        })
                    );

                    if (!shouldContinue) {
                        return undefined;
                    }

                    return callee();

                }

                return pin;

            })();

            if (pin === undefined) {
                return;
            }

            if (isPrSimUnlockedResolved) {

                await dialogApi.create(
                    "alert",
                    { "message": "The Sim has already been unlocked" }
                );

                return;
            }

            dialogApi.loading("Your sim is being unlocked please wait...", 0);

            const unlockResult = await coreApi.unlockSim({
                "lockedDongle": dongle,
                pin
            });

            dialogApi.dismissLoading();

            if (!unlockResult) {

                alert("Unlock failed for unknown reason");
                return;

            }

            if (!unlockResult.success) {

                //NOTE: Interact will be called again with an updated dongle.
                return;

            }

            dialogApi.loading("Initialization of the sim...", 0);

            await prSimUnlocked;

            dialogApi.dismissLoading();

        },
        "onUsableDongleOnLan": async (
            dongle: dcTypes.Dongle.Usable,
            dialogApi: DialogApi
        ) => {

            const shouldAdd_message = [
                `SIM inside:`,
                `${dongle.manufacturer} ${dongle.model}`,
                `Sim IMSI: ${dongle.sim.imsi}`,
            ].join("<br>");

            const shouldAdd = await new Promise<boolean>(
                resolve => dialogApi.create(
                    "dialog",
                    {
                        "title": "SIM ready to be registered",
                        "message": env.jsRuntimeEnv === "browser" ?
                            `<p class="text-center">${shouldAdd_message}</p>` :
                            shouldAdd_message,
                        "buttons": {
                            "cancel": {
                                "label": "Not now",
                                "callback": () => resolve(false)
                            },
                            "success": {
                                "label": "Yes, register this sim",
                                "className": "btn-success",
                                "callback": () => resolve(true)
                            }
                        },
                        "closeButton": false,
                        "onEscape": false
                    }
                )
            );

            if (!shouldAdd) {
                return;
            }

            if (dongle.isVoiceEnabled === false) {

                //TODO: Improve message.
                await new Promise<void>(
                    resolve => dialogApi.create("alert",
                        {
                            "message": [
                                "You won't be able to make phone call with this device until it have been voice enabled",
                                "See: <a href='https://www.semasim.com/enable-voice'></a>"
                            ].join("<br>"),
                            "callback": () => resolve()
                        }
                    )
                );

            }

            dialogApi.loading("Suggesting a suitable friendly name ...");

            let friendlyName = await getDefaultFriendlyName(dongle.sim);

            let friendlyNameSubmitted = await new Promise<string | null>(
                resolve => dialogApi.create("prompt", {
                    "title": "Friendly name for this sim?",
                    "value": friendlyName,
                    "callback": result => resolve(result),
                })
            );

            if (!friendlyNameSubmitted) {
                return;
            }

            friendlyName = friendlyNameSubmitted;

            dialogApi.loading("Registering SIM...");

            await coreApi.registerSim({ dongle, friendlyName });

            dialogApi.dismissLoading();
        },
        "onSimSharingRequest": async (
            userSim: types.UserSim.Shared.NotConfirmed,
            dialogApi: DialogApi
        ) => {

            const shouldProceed = await new Promise<"ACCEPT" | "REFUSE" | "LATER">(
                resolve => dialogApi.create("dialog", {
                    "title": `${userSim.ownership.ownerEmail} would like to share a SIM with you, accept?`,
                    "message": userSim.ownership.sharingRequestMessage ?
                        `«${userSim.ownership.sharingRequestMessage.replace(/\n/g, "<br>")}»` : "",
                    "buttons": {
                        "cancel": {
                            "label": "Refuse",
                            "callback": () => resolve("REFUSE")
                        },
                        "success": {
                            "label": "Yes, use this SIM",
                            "className": "btn-success",
                            "callback": () => resolve("ACCEPT")
                        }
                    },
                    "closeButton": true,
                    "onEscape": () => resolve("LATER")
                })
            );

            if (shouldProceed === "LATER") {
                return undefined;
            }

            if (shouldProceed === "REFUSE") {

                dialogApi.loading("Rejecting SIM sharing request...");

                await coreApi.rejectSharingRequest(userSim);

                dialogApi.dismissLoading();

                return undefined;

            }

            //TODO: max length for friendly name, should only have ok button
            let friendlyNameSubmitted = await new Promise<string | null>(
                resolve => dialogApi.create("prompt", {
                    "title": "Friendly name for this sim?",
                    "value": userSim.friendlyName,
                    "callback": result => resolve(result),
                })
            );

            if (!friendlyNameSubmitted) {

                dialogApi.loading("Rejecting SIM sharing request...");

                await coreApi.rejectSharingRequest(userSim);

                dialogApi.dismissLoading();

                return undefined;

            }

            userSim.friendlyName = friendlyNameSubmitted;

            dialogApi.loading("Accepting SIM sharing request...");

            await coreApi.acceptSharingRequest({
                "notConfirmedUserSim": userSim,
                "friendlyName": userSim.friendlyName
            });

            dialogApi.dismissLoading();


        }
    };

}




import * as apiDeclaration from "../../sip_api_declarations/backendClientSideSocket";
import * as sipLibrary from "ts-sip";
import { SyncEvent, VoidSyncEvent } from "ts-events-extended";
import * as types from "../types";
import * as dcTypes from "chan-dongle-extended-client/dist/lib/types";
import * as remoteApiCaller from "./remoteApiCaller";

//NOTE: Global JS deps.
import * as bootbox_custom from "../tools/bootbox_custom";

export const handlers: sipLibrary.api.Server.Handlers = {};

export const evtSimIsOnlineStatusChange = new SyncEvent<types.UserSim.Usable>();

(() => {

    const methodName = apiDeclaration.notifySimOffline.methodName;
    type Params = apiDeclaration.notifySimOffline.Params;
    type Response = apiDeclaration.notifySimOffline.Response;

    const handler: sipLibrary.api.Server.Handler<Params, Response> = {
        "handler": async ({ imsi }) => {

            const userSim = (await remoteApiCaller.getUsableUserSims())
                .find(({ sim }) => sim.imsi === imsi)!;

            userSim.isOnline = false;

            evtSimIsOnlineStatusChange.post(userSim);

            return undefined;

        }
    };

    handlers[methodName] = handler;

})();

(() => {

    const methodName = apiDeclaration.notifySimOnline.methodName;
    type Params = apiDeclaration.notifySimOnline.Params;
    type Response = apiDeclaration.notifySimOnline.Response;

    const handler: sipLibrary.api.Server.Handler<Params, Response> = {
        "handler": async ({
            imsi, hasInternalSimStorageChanged,
            newPassword, newSimDongle, newGatewayLocation
        }) => {

            const userSim = (await remoteApiCaller.getUsableUserSims())
                .find(({ sim }) => sim.imsi === imsi)!;

            if (hasInternalSimStorageChanged) {

                location.reload();

                return;

            }

            if (newPassword !== undefined) {

                userSim.password = newPassword;

            }

            if (newSimDongle !== undefined) {

                userSim.dongle = newSimDongle;

            }

            if (newGatewayLocation !== undefined) {

                userSim.gatewayLocation = newGatewayLocation;

            }

            evtSimIsOnlineStatusChange.post(userSim);

            return undefined;

        }
    };

    handlers[methodName] = handler;

})();

/** posted when a user that share the SIM created or updated a contact. */
export const evtContactCreatedOrUpdated = new SyncEvent<{
    userSim: types.UserSim.Usable;
    contact: types.UserSim.Contact
}>();

(() => {

    const methodName = apiDeclaration.notifyContactCreatedOrUpdated.methodName;
    type Params = apiDeclaration.notifyContactCreatedOrUpdated.Params;
    type Response = apiDeclaration.notifyContactCreatedOrUpdated.Response;

    const handler: sipLibrary.api.Server.Handler<Params, Response> = {
        "handler": async ({ imsi, name, number_raw, number_local_format, storage }) => {

            const userSim = (await remoteApiCaller.getUsableUserSims())
                .find(({ sim }) => sim.imsi === imsi)!;


            let contact = userSim.phonebook.find(contact => {

                if (!!storage) {
                    return contact.mem_index === storage.mem_index;
                }

                return number_raw === number_raw;

            });

            if (!!contact) {

                contact.name = name;

                if (!!storage) {


                    userSim.sim.storage.contacts
                        .find(({ index }) => index === storage.mem_index)!.name =
                        storage.name_as_stored;

                }

            } else {

                contact = {
                    name, number_raw, number_local_format
                };

                userSim.phonebook.push(contact);

                if (!!storage) {

                    userSim.sim.storage.infos.storageLeft--;

                    contact.mem_index = storage.mem_index;

                    userSim.sim.storage.contacts.push({
                        "index": contact.mem_index,
                        name,
                        "number": number_raw
                    });

                }

            }

            if (!!storage) {

                userSim.sim.storage.digest = storage.new_digest;

            }

            evtContactCreatedOrUpdated.post({ userSim, contact });

            return undefined;

        }
    };

    handlers[methodName] = handler;

})();

export const evtContactDeleted = new SyncEvent<{
    userSim: types.UserSim.Usable;
    contact: types.UserSim.Contact
}>();



(() => {

    const methodName = apiDeclaration.notifyContactDeleted.methodName;
    type Params = apiDeclaration.notifyContactDeleted.Params;
    type Response = apiDeclaration.notifyContactDeleted.Response;

    const handler: sipLibrary.api.Server.Handler<Params, Response> = {
        "handler": async ({ imsi, number_raw, storage }) => {

            const userSim = (await remoteApiCaller.getUsableUserSims())
                .find(({ sim }) => sim.imsi === imsi)!;

            let i: number;
            let contact: types.UserSim.Contact;

            for (i = 0; i < userSim.phonebook.length; i++) {

                contact = userSim.phonebook[i];

                if (
                    !!storage ?
                        storage.mem_index === contact.mem_index :
                        contact.number_raw === number_raw
                ) {

                    userSim.phonebook.splice(i, 1);

                    break;

                }

            }

            if (!!storage) {

                userSim.sim.storage.digest = storage.new_digest;

                userSim.sim.storage.infos.storageLeft--;

                userSim.sim.storage.contacts.splice(
                    userSim.sim.storage.contacts.indexOf(
                        userSim.sim.storage.contacts.find(({ index }) => index === storage.mem_index)!
                    )
                    , 1
                );


            }

            evtContactDeleted.post({ userSim, "contact": contact! });

            return undefined;

        }
    };

    handlers[methodName] = handler;

})();

(() => {

    const methodName = apiDeclaration.notifyDongleCaryingPotentiallyUnregisteredSimOnLan.methodName;
    type Params = apiDeclaration.notifyDongleCaryingPotentiallyUnregisteredSimOnLan.Params;
    type Response = apiDeclaration.notifyDongleCaryingPotentiallyUnregisteredSimOnLan.Response;

    const handler: sipLibrary.api.Server.Handler<Params, Response> = {
        "handler": async params => {

            interact(params);

            return undefined;

        }
    };

    handlers[methodName] = handler;

    //TODO: run exclusive
    async function interact(dongle: dcTypes.Dongle) {

        const shouldAdd_message = (() => {

            let arr = [
                `SIM inside:`,
                `${dongle.manufacturer} ${dongle.model}`,
                `IMEI: ${dongle.imei}`,
            ];

            if (dongle.sim.iccid) {

                arr = [
                    ...arr,
                    "",
                    "SIM ICCID (number printed on SIM): ",
                    dongle.sim.iccid
                ];

            }

            return arr.join("<br>");

        })();

        const shouldAdd = await new Promise<boolean>(
            resolve => bootbox_custom.dialog({
                "title": "SIM ready to be registered",
                "message": `<p class="text-center">${shouldAdd_message}</p>`,
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
                "closeButton": false
            })
        );

        if (!shouldAdd) {
            return undefined;
        }

        if (dcTypes.Dongle.Locked.match(dongle)) {

            let unlockResultValidPin: types.unlockSim_Response.ValidPin;

            while (true) {

                if (dongle.sim.pinState !== "SIM PIN") {

                    bootbox_custom.alert(`${dongle.sim.pinState} require manual unlock`);

                    return undefined;

                }

                let tryLeft = dongle.sim.tryLeft;

                let pin = await new Promise<string>(
                    resolve => bootbox_custom.prompt({
                        "title": `PIN code? (${tryLeft} tries left)`,
                        "inputType": "number",
                        "callback": result => resolve(result)
                    })
                );

                if (pin === null) {
                    return undefined;
                }

                if (!pin.match(/^[0-9]{4}$/)) {

                    let shouldContinue = await new Promise<boolean>(
                        resolve => bootbox_custom.confirm({
                            "title": "PIN malformed!",
                            "message": "A pin code is composed of 4 digits, e.g. 0000",
                            callback: result => resolve(result)
                        })
                    );

                    if (!shouldContinue) return undefined;

                    continue;

                }

                bootbox_custom.loading("Your sim is being unlocked please wait...", 0);

                const unlockResult = await remoteApiCaller.unlockSim(dongle, pin);

                if (!unlockResult.wasPinValid) {

                    dongle.sim.pinState = unlockResult.pinState;
                    dongle.sim.tryLeft = unlockResult.tryLeft;

                    continue;

                }

                unlockResultValidPin = unlockResult;

                break;

            }

            if (!unlockResultValidPin.isSimRegisterable) {

                if (unlockResultValidPin.simRegisteredBy.who === "MYSELF") {

                    bootbox_custom.alert([
                        "Unlock success. You already have registered this SIM,",
                        " it just needed to be unlock again"
                    ].join(""));

                } else {

                    bootbox_custom.alert([
                        "Unlock success, the SIM is currently registered ",
                        `by account: ${unlockResultValidPin.simRegisteredBy.email}`
                    ].join(""));

                }

                return undefined;

            }

            dongle = unlockResultValidPin.dongle;

        }

        if (dongle.isVoiceEnabled !== true) {

            let sure = dongle.isVoiceEnabled === false;

            await new Promise<void>(
                resolve => bootbox_custom.alert(
                    [
                        "Warning:",
                        `Voice is ${sure ? "" : "( maybe )"} not enabled on the 3G Key you are using with this SIM.`,
                        `As as a result you ${sure ? "will" : "may"} not be able to place phones calls ${sure ? "(try and see for yourself)" : ""}.`,
                        "Chances are voice can be enabled on your HUAWEI dongle with dc-unlocker",
                        "Go to www.dc-unlocker.com and download dc-unlocker client (windows)",
                        "Connect your 3G key to your PC and try to get dc-unlocker to detect it",
                        "once your manage to get your dongle detected by the software go to",
                        "unlocking -> Activate Voice",
                        "They will charge you 4€ for it...",
                        "We are currently trying to implement this ourself so you dont have to pay",
                        "for that but so far this is the only option.",
                        "",
                        `Dongle IMEI: ${dongle.imei}`
                    ].join("<br>"),
                    () => resolve()
                )
            );

        }

        bootbox_custom.loading("Suggesting a suitable friendly name ...");

        let friendlyName = await getDefaultFriendlyName(dongle.sim);

        let friendlyNameSubmitted = await new Promise<string | null>(
            resolve => bootbox_custom.prompt({
                "title": "Friendly name for this sim?",
                "value": friendlyName,
                "callback": result => resolve(result),
            })
        );

        if (friendlyNameSubmitted) {
            friendlyName = friendlyNameSubmitted;
        }

        bootbox_custom.loading("Registering SIM...");

        await remoteApiCaller.registerSim(dongle, friendlyName);

    }

    async function getDefaultFriendlyName(sim: dcTypes.Sim) {

        let tag = sim.serviceProvider.fromImsi || sim.serviceProvider.fromNetwork || "";

        const num = sim.storage.number;

        if (!tag && num && num.length > 6) {

            tag = num.slice(0, 4) + ".." + num.slice(-2);

        }

        tag = tag || "X";

        let build = (i: number) => `SIM ${tag}${i === 0 ? "" : ` ( ${i} )`}`;

        let i = 0;

        const userSims = await remoteApiCaller.getUsableUserSims();

        while (
            userSims.filter(
                ({ friendlyName, sim }) => friendlyName === build(i)
            ).length
        ) {
            i++;
        }

        return build(i);

    }


})();



(() => {

    const methodName = apiDeclaration.notifySimSharingRequest.methodName;
    type Params = apiDeclaration.notifySimSharingRequest.Params;
    type Response = apiDeclaration.notifySimSharingRequest.Response;

    const handler: sipLibrary.api.Server.Handler<Params, Response> = {
        "handler": async params => {

            interact(params);

            return undefined;

        }
    };

    handlers[methodName] = handler;

    //TODO: run exclusive
    async function interact(
        userSim: types.UserSim.Shared.NotConfirmed
    ): Promise<void> {

        let shouldProceed = await new Promise<"ACCEPT" | "REFUSE" | "LATER">(
            resolve => bootbox_custom.dialog({
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
                "onEscape": () => resolve("LATER")
            })
        );

        if (shouldProceed === "LATER") {
            return undefined;
        }

        if (shouldProceed === "REFUSE") {

            bootbox_custom.loading("Rejecting SIM sharing request...");

            await remoteApiCaller.rejectSharingRequest(userSim);

            return undefined;

        }

        //TODO: max length for friendly name
        let friendlyNameSubmitted = await new Promise<string | null>(
            resolve => bootbox_custom.prompt({
                "title": "Friendly name for this sim?",
                "value": userSim.friendlyName,
                "callback": result => resolve(result),
            })
        );

        if (friendlyNameSubmitted) {
            userSim.friendlyName = friendlyNameSubmitted;
        }

        bootbox_custom.loading("Accepting SIM sharing request...");

        await remoteApiCaller.acceptSharingRequest(
            userSim,
            userSim.friendlyName
        );

    }

})();


export const evtSharingRequestResponse = new SyncEvent<{
    userSim: types.UserSim.Owned;
    email: string;
    isAccepted: boolean;
}>();


(() => {

    const methodName = apiDeclaration.notifySharingRequestResponse.methodName;
    type Params = apiDeclaration.notifySharingRequestResponse.Params;
    type Response = apiDeclaration.notifySharingRequestResponse.Response;

    const handler: sipLibrary.api.Server.Handler<Params, Response> = {
        "handler": async ({ imsi, email, isAccepted }) => {

            const userSim = (await remoteApiCaller.getUsableUserSims())
                .find(({ sim }) => sim.imsi === imsi)! as types.UserSim.Owned;

            userSim.ownership.sharedWith.notConfirmed.splice(
                userSim.ownership.sharedWith.notConfirmed.indexOf(email),
                1
            );

            if (isAccepted) {

                userSim.ownership.sharedWith.confirmed.push(email);

            }

            evtSharingRequestResponse.post({ userSim, email, isAccepted });

            return undefined;

        }
    };

    handlers[methodName] = handler;

})();

export const evtSharedSimUnregistered = new SyncEvent<{
    userSim: types.UserSim.Owned;
    email: string;
}>();

(() => {

    const methodName = apiDeclaration.notifySharedSimUnregistered.methodName;
    type Params = apiDeclaration.notifySharedSimUnregistered.Params;
    type Response = apiDeclaration.notifySharedSimUnregistered.Response;

    const handler: sipLibrary.api.Server.Handler<Params, Response> = {
        "handler": async ({ imsi, email }) => {


            const userSim = (await remoteApiCaller.getUsableUserSims())
                .find(({ sim }) => sim.imsi === imsi)! as types.UserSim.Owned;

            userSim.ownership.sharedWith.confirmed.splice(
                userSim.ownership.sharedWith.confirmed.indexOf(email),
                1
            );

            evtSharedSimUnregistered.post({ userSim, email });

            return undefined;

        }
    };

    handlers[methodName] = handler;

})();

export const evtOpenElsewhere = new VoidSyncEvent();

(() => {

    const methodName = apiDeclaration.notifyWebAppOpenOnOtherBrowserTab.methodName;
    type Params = apiDeclaration.notifyWebAppOpenOnOtherBrowserTab.Params;
    type Response = apiDeclaration.notifyWebAppOpenOnOtherBrowserTab.Response;

    const handler: sipLibrary.api.Server.Handler<Params, Response> = {
        "handler": async () => {

            evtOpenElsewhere.post();

            return undefined;

        }
    };

    handlers[methodName] = handler;

})();



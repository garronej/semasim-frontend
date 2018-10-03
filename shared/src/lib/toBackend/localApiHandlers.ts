
import * as apiDeclaration from "../../sip_api_declarations/uaToBackend";
import * as sipLibrary from "ts-sip";
import { SyncEvent, VoidSyncEvent } from "ts-events-extended";
import * as types from "../types";
import * as dcTypes from "chan-dongle-extended-client/dist/lib/types";
import * as remoteApiCaller from "./remoteApiCaller";

//NOTE: Global JS deps.
import * as bootbox_custom from "../tools/bootbox_custom";

export const handlers: sipLibrary.api.Server.Handlers = {};

export const evtSimIsOnlineStatusChange = new SyncEvent<types.UserSim.Usable>();

{

    const methodName = apiDeclaration.notifySimOffline.methodName;
    type Params = apiDeclaration.notifySimOffline.Params;
    type Response = apiDeclaration.notifySimOffline.Response;

    const handler: sipLibrary.api.Server.Handler<Params, Response> = {
        "handler": async ({ imsi }) => {

            const userSim = (await remoteApiCaller.getUsableUserSims())
                .find(({ sim }) => sim.imsi === imsi)!;

            userSim.isOnline = false;

            evtSimIsOnlineStatusChange.post(userSim);

            //TODO: Improve
            console.log({ methodName });

            return undefined;

        }
    };

    handlers[methodName] = handler;

}

{

    const methodName = apiDeclaration.notifySimOnline.methodName;
    type Params = apiDeclaration.notifySimOnline.Params;
    type Response = apiDeclaration.notifySimOnline.Response;

    const handler: sipLibrary.api.Server.Handler<Params, Response> = {
        "handler": async ({
            imsi, hasInternalSimStorageChanged,
            password, simDongle, gatewayLocation
        }) => {

            const userSim = (await remoteApiCaller.getUsableUserSims())
                .find(({ sim }) => sim.imsi === imsi)!;

            if (hasInternalSimStorageChanged) {

                location.reload();

                return;

            }

            userSim.isOnline= true;

            userSim.password = password;

            userSim.dongle = simDongle;

            userSim.gatewayLocation = gatewayLocation;

            evtSimIsOnlineStatusChange.post(userSim);

            console.log({ methodName });

            return undefined;

        }
    };

    handlers[methodName] = handler;

}

/** posted when a user that share the SIM created or updated a contact. */
export const evtContactCreatedOrUpdated = new SyncEvent<{
    userSim: types.UserSim.Usable;
    contact: types.UserSim.Contact
}>();

{

    const methodName = apiDeclaration.notifyContactCreatedOrUpdated.methodName;
    type Params = apiDeclaration.notifyContactCreatedOrUpdated.Params;
    type Response = apiDeclaration.notifyContactCreatedOrUpdated.Response;

    const handler: sipLibrary.api.Server.Handler<Params, Response> = {
        "handler": async ({ imsi, name, number_raw, storage }) => {

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

                contact = { name, number_raw };

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

            console.log({ methodName });

            return undefined;

        }
    };

    handlers[methodName] = handler;

}

export const evtContactDeleted = new SyncEvent<{
    userSim: types.UserSim.Usable;
    contact: types.UserSim.Contact
}>();

{

    const methodName = apiDeclaration.notifyContactDeleted.methodName;
    type Params = apiDeclaration.notifyContactDeleted.Params;
    type Response = apiDeclaration.notifyContactDeleted.Response;

    const handler: sipLibrary.api.Server.Handler<Params, Response> = {
        "handler": async ({ imsi, number_raw, storage }) => {

            const userSim = (await remoteApiCaller.getUsableUserSims())
                .find(({ sim }) => sim.imsi === imsi)!;

            let contact: types.UserSim.Contact;

            for (let i = 0; i < userSim.phonebook.length; i++) {

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

            console.log({ methodName });

            return undefined;

        }
    };

    handlers[methodName] = handler;

}

{

    const methodName = apiDeclaration.notifyDongleOnLan.methodName;
    type Params = apiDeclaration.notifyDongleOnLan.Params;
    type Response = apiDeclaration.notifyDongleOnLan.Response;

    const handler: sipLibrary.api.Server.Handler<Params, Response> = {
        "handler": async params => {

            interact(params);

            return undefined;

        }
    };

    handlers[methodName] = handler;

    const interact = async (dongle: dcTypes.Dongle) => {


        if (dcTypes.Dongle.Locked.match(dongle)) {

            while (true) {

                if (dongle.sim.pinState !== "SIM PIN") {

                    bootbox_custom.alert(`${dongle.sim.pinState} require manual unlock`);

                    return;

                }

                const tryLeft = dongle.sim.tryLeft;

                const pin = await new Promise<string>(
                    resolve => bootbox_custom.prompt({
                        "title": `PIN code for sim inside ${dongle.manufacturer} ${dongle.model} (${tryLeft} tries left)`,
                        "inputType": "number",
                        "callback": result => resolve(result)
                    })
                );

                if (pin === null) {
                    return;
                }

                if (!pin.match(/^[0-9]{4}$/)) {

                    let shouldContinue = await new Promise<boolean>(
                        resolve => bootbox_custom.confirm({
                            "title": "PIN malformed!",
                            "message": "A pin code is composed of 4 digits, e.g. 0000",
                            callback: result => resolve(result)
                        })
                    );

                    if (!shouldContinue) {
                        return;
                    }

                    continue;

                }

                bootbox_custom.loading("Your sim is being unlocked please wait...", 0);

                const unlockResult = await remoteApiCaller.unlockSim(dongle, pin);

                if (!unlockResult) {

                    //TODO: Improve
                    alert("Unlock failed for unknown reason");
                    return;

                }

                if (!unlockResult.success) {

                    dongle.sim.pinState = unlockResult.pinState;
                    dongle.sim.tryLeft = unlockResult.tryLeft;

                    continue;

                }

                break;

            }

            //TODO: Implement some kind of queue as we cant fire an alert when
            //an other one is already open


        } else {

            const shouldAdd_message = [
                `SIM inside:`,
                `${dongle.manufacturer} ${dongle.model}`,
                `Sim IMSI: ${dongle.sim.imsi}`,
            ].join("<br>");

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
                return;
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

            bootbox_custom.dismissLoading();

        }

    };

    const getDefaultFriendlyName = async (sim: dcTypes.Sim) => {

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

    };

}

export const evtSimPermissionLost = new SyncEvent<types.UserSim.Shared.Confirmed>();

{

    const methodName = apiDeclaration.notifySimPermissionLost.methodName;
    type Params = apiDeclaration.notifySimPermissionLost.Params;
    type Response = apiDeclaration.notifySimPermissionLost.Response;

    const handler: sipLibrary.api.Server.Handler<Params, Response> = {
        "handler": async ({ imsi }) => {

            const userSims = await remoteApiCaller.getUsableUserSims();

            const userSim = userSims.find(
                ({ sim }) => sim.imsi === imsi
            )! as types.UserSim.Shared.Confirmed;

            userSims.splice(userSims.indexOf(userSim), 1);

            evtSimPermissionLost.post(userSim);

            //TODO: Display notification
            console.log(methodName);

            return undefined;

        }
    };

    handlers[methodName] = handler;

}

{

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
    const interact = async (userSim: types.UserSim.Shared.NotConfirmed): Promise<void> => {

        const shouldProceed = await new Promise<"ACCEPT" | "REFUSE" | "LATER">(
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

        bootbox_custom.dismissLoading();

    };

}


export const evtSharingRequestResponse = new SyncEvent<{
    userSim: types.UserSim.Owned;
    email: string;
    isAccepted: boolean;
}>();

{

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

            bootbox_custom.alert(`${email} ${isAccepted?"accepted":"rejected"} your sharing request for ${userSim.friendlyName}`);

            return undefined;

        }
    };

    handlers[methodName] = handler;

}

export const evtSharedSimUnregistered = new SyncEvent<{
    userSim: types.UserSim.Owned;
    email: string;
}>();

{

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

            bootbox_custom.alert(`${email} no longer share ${userSim.friendlyName}`);

            return undefined;

        }
    };

    handlers[methodName] = handler;

}

export const evtOpenElsewhere = new VoidSyncEvent();

{

    const methodName = apiDeclaration.notifyLoggedFromOtherTab.methodName;
    type Params = apiDeclaration.notifyLoggedFromOtherTab.Params;
    type Response = apiDeclaration.notifyLoggedFromOtherTab.Response;

    const handler: sipLibrary.api.Server.Handler<Params, Response> = {
        "handler": async () => {

            evtOpenElsewhere.post();

            bootbox_custom.alert("This session is over, only one semasim web browser tab can be active.");

            console.log({ methodName });

            return undefined;

        }
    };

    handlers[methodName] = handler;

}



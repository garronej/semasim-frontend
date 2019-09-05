
import * as apiDeclaration from "../../sip_api_declarations/uaToBackend";
import * as sipLibrary from "ts-sip";
import { SyncEvent, VoidSyncEvent } from "ts-events-extended";
import * as types from "../types/userSim";
import * as dcTypes from "chan-dongle-extended-client/dist/lib/types";
import * as remoteApiCaller from "./remoteApiCaller/base";

//NOTE: Global JS deps.
import * as bootbox_custom from "../../tools/bootbox_custom";

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

            const hadOngoingCall= ( 
                userSim.reachableSimState !== undefined && 
                userSim.reachableSimState.isGsmConnectivityOk && 
                userSim.reachableSimState.ongoingCall !== undefined
            );

            userSim.reachableSimState = undefined;

            if( hadOngoingCall ){

                evtOngoingCall.post(userSim);

            }

            evtSimIsOnlineStatusChange.post(userSim);

            return undefined;

        }
    };

    handlers[methodName] = handler;

}

/** 
 * Posted when a Dongle with an unlocked SIM goes online.
 * Used so we can display a loading between the moment 
 * when the card have been unlocked and the card is ready 
 * to use.
 */
const evtUsableDongle = new SyncEvent<{ imei: string; }>();

{

    const methodName = apiDeclaration.notifySimOnline.methodName;
    type Params = apiDeclaration.notifySimOnline.Params;
    type Response = apiDeclaration.notifySimOnline.Response;

    const handler: sipLibrary.api.Server.Handler<Params, Response> = {
        "handler": async ({
            imsi, hasInternalSimStorageChanged,
            password, simDongle, gatewayLocation,
            isGsmConnectivityOk, cellSignalStrength
        }) => {

            evtUsableDongle.post({ "imei": simDongle.imei });

            const userSim = (await remoteApiCaller.getUsableUserSims())
                .find(({ sim }) => sim.imsi === imsi)!;

            if (hasInternalSimStorageChanged) {

                location.reload();

                return;

            }

            userSim.reachableSimState = isGsmConnectivityOk ?
                ({ "isGsmConnectivityOk": true, cellSignalStrength, "ongoingCall": undefined }) :
                ({ "isGsmConnectivityOk": false, cellSignalStrength })
                ;

            userSim.password = password;

            userSim.dongle = simDongle;

            userSim.gatewayLocation = gatewayLocation;

            evtSimIsOnlineStatusChange.post(userSim);

            return undefined;

        }
    };

    handlers[methodName] = handler;

}

export const evtSimGsmConnectivityChange = new SyncEvent<types.UserSim.Usable>();

{

    const { methodName } = apiDeclaration.notifyGsmConnectivityChange;
    type Params = apiDeclaration.notifyGsmConnectivityChange.Params;
    type Response = apiDeclaration.notifyGsmConnectivityChange.Response;

    const handler: sipLibrary.api.Server.Handler<Params, Response> = {
        "handler": async ({ imsi, isGsmConnectivityOk }) => {

            const userSim = (await remoteApiCaller.getUsableUserSims())
                .find(({ sim }) => sim.imsi === imsi)!;

            const { reachableSimState } = userSim;

            if (reachableSimState === undefined) {
                throw new Error("assert");
            }

            if( isGsmConnectivityOk === reachableSimState.isGsmConnectivityOk ){
                throw new Error("assert");
            }

            if( reachableSimState.isGsmConnectivityOk ){

                let hadOngoingCall= false;

                if( reachableSimState.ongoingCall !== undefined ){
                    delete reachableSimState.ongoingCall;
                    hadOngoingCall= true;
                }

                reachableSimState.isGsmConnectivityOk =false as any;

                if( hadOngoingCall ){
                    evtOngoingCall.post(userSim);
                }

            }else{

                reachableSimState.isGsmConnectivityOk = true as any;

            }


            evtSimGsmConnectivityChange.post(userSim);

            return undefined;

        }
    };

    handlers[methodName] = handler;

}

export const evtSimCellSignalStrengthChange = new SyncEvent<types.UserSim.Usable>();


{

    const { methodName } = apiDeclaration.notifyCellSignalStrengthChange;
    type Params = apiDeclaration.notifyCellSignalStrengthChange.Params;
    type Response = apiDeclaration.notifyCellSignalStrengthChange.Response;

    const handler: sipLibrary.api.Server.Handler<Params, Response> = {
        "handler": async ({ imsi, cellSignalStrength }) => {

            const userSim = (await remoteApiCaller.getUsableUserSims())
                .find(({ sim }) => sim.imsi === imsi)!;

            if (userSim.reachableSimState === undefined) {
                throw new Error("Sim should be reachable");
            }

            userSim.reachableSimState.cellSignalStrength = cellSignalStrength;

            evtSimCellSignalStrengthChange.post(userSim);

            return undefined;

        }
    };

    handlers[methodName] = handler;

}

//TODO: Make use of.
export const evtOngoingCall = new SyncEvent<types.UserSim.Usable>();

/*
evtOngoingCall.attach(userSim => {

    const { reachableSimState } = userSim;

    if( !reachableSimState ){

        console.log("===> sim no longer reachable");

        return;
        
    }

    if( !reachableSimState.isGsmConnectivityOk ){

        console.log("=============> cell connectivity lost");

        return;

    }

    if( reachableSimState.ongoingCall === undefined ){

        console.log("=================> call terminated");

        return;

    }

    console.log("===========> ", JSON.stringify(reachableSimState.ongoingCall, null, 2));

});
*/


{

    const { methodName } = apiDeclaration.notifyOngoingCall;
    type Params = apiDeclaration.notifyOngoingCall.Params;
    type Response = apiDeclaration.notifyOngoingCall.Response;

    const handler: sipLibrary.api.Server.Handler<Params, Response> = {
        "handler": async params => {


            const { imsi } = params;

            const userSim = (await remoteApiCaller.getUsableUserSims())
                .find(({ sim }) => sim.imsi === imsi)!;

            if (params.isTerminated) {

                const { ongoingCallId }= params;

                const { reachableSimState } = userSim;

                if( !reachableSimState ){
                    //NOTE: The event would have been posted in setSimOffline handler.
                    return;
                }

                if( !reachableSimState.isGsmConnectivityOk ){
                    //NOTE: If we have had event notifying connectivity lost
                    //before this event the evtOngoingCall will have been posted
                    //in notifyGsmConnectivityChange handler function.
                    return;
                }

                if( 
                    reachableSimState.ongoingCall === undefined || 
                    reachableSimState.ongoingCall.ongoingCallId !== ongoingCallId 
                ) {
                    return;
                }

                reachableSimState.ongoingCall= undefined;

            } else {

                const { ongoingCall } = params;



                const { reachableSimState } = userSim;

                if (reachableSimState === undefined) {
                    throw new Error("assert");
                }

                if (!reachableSimState.isGsmConnectivityOk) {
                    throw new Error("assert");
                }

                if( reachableSimState.ongoingCall === undefined ){
                    reachableSimState.ongoingCall = ongoingCall;
                } else if ( reachableSimState.ongoingCall.ongoingCallId !== ongoingCall.ongoingCallId){

                    reachableSimState.ongoingCall === undefined;

                    evtOngoingCall.post(userSim);

                    reachableSimState.ongoingCall = ongoingCall;

                }else{

                    const {
                        ongoingCallId,
                        from,
                        number,
                        isUserInCall,
                        otherUserInCallEmails
                    } = ongoingCall;

                    const prevOngoingCall = reachableSimState.ongoingCall;

                    Object.assign(prevOngoingCall, { ongoingCallId, from, number, isUserInCall });

                    prevOngoingCall.otherUserInCallEmails.splice(0, prevOngoingCall.otherUserInCallEmails.length);

                    otherUserInCallEmails.forEach(email => prevOngoingCall.otherUserInCallEmails.push(email));

                }

            }

            evtOngoingCall.post(userSim);

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

                return contact.number_raw === number_raw;

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
        "handler": async dongle => {

            if (dcTypes.Dongle.Locked.match(dongle)) {

                interact_onLockedDongle(dongle);

            } else {

                evtUsableDongle.post({ "imei": dongle.imei });

                interact_onUsableDongle(dongle);

            }

            return undefined;

        }
    };

    handlers[methodName] = handler;

    const interact_onLockedDongle = async (dongle: dcTypes.Dongle.Locked) => {

        if (dongle.sim.pinState !== "SIM PIN") {

            bootbox_custom.alert(`${dongle.sim.pinState} require manual unlock`);

            return;

        }

        const pin = await (async function callee(): Promise<string | undefined> {

            const pin = await new Promise<string>(
                resolve => bootbox_custom.prompt({
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
                    resolve => bootbox_custom.confirm({
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

        bootbox_custom.loading("Your sim is being unlocked please wait...", 0);

        const unlockResult = await remoteApiCaller.unlockSim(dongle, pin);

        bootbox_custom.dismissLoading();

        if (!unlockResult) {

            alert("Unlock failed for unknown reason");
            return;

        }

        if (!unlockResult.success) {

            //NOTE: Interact will be called again with an updated dongle.
            return;

        }

        bootbox_custom.loading("Initialization of the sim...", 0);

        await evtUsableDongle.waitFor(({ imei }) => imei === dongle.imei);

        bootbox_custom.dismissLoading();
    };

    const interact_onUsableDongle = async (dongle: dcTypes.Dongle.Usable) => {

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

        if (dongle.isVoiceEnabled === false) {

            //TODO: Improve message.
            await new Promise<void>(
                resolve => bootbox_custom.alert(
                    [
                        "You won't be able to make phone call with this device until it have been voice enabled",
                        "See: <a href='https://www.semasim.com/enable-voice'></a>"
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

        if (!friendlyNameSubmitted) {
            return;
        }

        friendlyName = friendlyNameSubmitted;

        bootbox_custom.loading("Registering SIM...");

        await remoteApiCaller.registerSim(dongle, friendlyName);

        bootbox_custom.dismissLoading();

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

            bootbox_custom.dismissLoading();

            return undefined;

        }

        //TODO: max length for friendly name, should only have ok button
        let friendlyNameSubmitted = await new Promise<string | null>(
            resolve => bootbox_custom.prompt({
                "title": "Friendly name for this sim?",
                "value": userSim.friendlyName,
                "callback": result => resolve(result),
            })
        );

        if (!friendlyNameSubmitted) {

            bootbox_custom.loading("Rejecting SIM sharing request...");

            await remoteApiCaller.rejectSharingRequest(userSim);

            bootbox_custom.dismissLoading();

            return undefined;

        }

        userSim.friendlyName = friendlyNameSubmitted;

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

            //TODO: change and also for stop sharing.


            const userSim = (await remoteApiCaller.getUsableUserSims())
                .find(({ sim }) => sim.imsi === imsi)! as types.UserSim.Owned | types.UserSim.Shared.Confirmed;

            switch (userSim.ownership.status) {
                case "OWNED":


                    userSim.ownership.sharedWith.notConfirmed.splice(
                        userSim.ownership.sharedWith.notConfirmed.indexOf(email),
                        1
                    );

                    if (isAccepted) {
                        userSim.ownership.sharedWith.confirmed.push(email);
                    }


                    break;
                case "SHARED CONFIRMED":

                    if (isAccepted) {
                        userSim.ownership.otherUserEmails.push(email);
                    }

                    break;
            }

            bootbox_custom.alert(`${email} ${isAccepted ? "accepted" : "rejected"} sharing request for ${userSim.friendlyName}`);

            return undefined;

        }
    };

    handlers[methodName] = handler;

}

export const evtOtherSimUserUnregisteredSim = new SyncEvent<{
    userSim: types.UserSim.Owned;
    email: string;
}>();

{

    const { methodName } = apiDeclaration.notifyOtherSimUserUnregisteredSim;
    type Params = apiDeclaration.notifyOtherSimUserUnregisteredSim.Params;
    type Response = apiDeclaration.notifyOtherSimUserUnregisteredSim.Response;

    const handler: sipLibrary.api.Server.Handler<Params, Response> = {
        "handler": async ({ imsi, email }) => {


            const userSim = (await remoteApiCaller.getUsableUserSims())
                .find(({ sim }) => sim.imsi === imsi)! as types.UserSim.Owned | types.UserSim.Shared.Confirmed;

            switch (userSim.ownership.status) {
                case "OWNED":

                    userSim.ownership.sharedWith.confirmed.splice(
                        userSim.ownership.sharedWith.confirmed.indexOf(email),
                        1
                    );

                    break;

                case "SHARED CONFIRMED":


                    userSim.ownership.otherUserEmails.splice(
                        userSim.ownership.otherUserEmails.indexOf(email),
                        1
                    );


                    break;

            }

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

            bootbox_custom.alert(
                "You are connected somewhere else",
                () => location.reload()
            );

            return undefined;

        }
    };

    handlers[methodName] = handler;

}

const evtRTCIceEServer = new SyncEvent<{
    rtcIceServer: RTCIceServer;
    socket: sipLibrary.Socket
}>();

export const getRTCIceServer = (() => {

    let current: RTCIceServer | undefined = undefined;

    const evtUpdated = new VoidSyncEvent();

    evtRTCIceEServer.attach(({ rtcIceServer, socket }) => {

        socket.evtClose.attachOnce(() => current = undefined);

        current = rtcIceServer;

        evtUpdated.post();

    });

    return async function callee(): Promise<RTCIceServer> {

        if (current !== undefined) {
            return current;
        }

        await evtUpdated.waitFor();

        return callee();

    };

})();

{

    const methodName = apiDeclaration.notifyIceServer.methodName;
    type Params = apiDeclaration.notifyIceServer.Params;
    type Response = apiDeclaration.notifyIceServer.Response;

    const handler: sipLibrary.api.Server.Handler<Params, Response> = {
        "handler": async (params, fromSocket) => {

            evtRTCIceEServer.post({
                "rtcIceServer": params !== undefined ? params :
                    ({
                        "urls": [
                            "stun:stun1.l.google.com:19302",
                            "stun:stun2.l.google.com:19302",
                            "stun:stun3.l.google.com:19302",
                            "stun:stun4.l.google.com:19302"
                        ]
                    }),
                "socket": fromSocket
            });

            return undefined;

        }
    };

    handlers[methodName] = handler;

}

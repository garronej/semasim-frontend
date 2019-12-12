
import * as apiDeclaration from "../../sip_api_declarations/uaToBackend";
import * as sipLibrary from "ts-sip";
import { SyncEvent } from "ts-events-extended";
import * as types from "../types/userSim";
import * as dcTypes from "chan-dongle-extended-client/dist/lib/types";

import { appEvts } from "./appEvts";


import { restartApp } from "../restartApp";

export const handlers: sipLibrary.api.Server.Handlers = {};

declare const require: any;


//NOTE: To avoid require cycles.
const getUsableUserSims= () => (require("./remoteApiCaller") as typeof import("./remoteApiCaller")).core.getUsableUserSims();
const getUsableUserSim = (imsi: string) => getUsableUserSims().then(userSims => userSims.find(({ sim }) => sim.imsi === imsi)!);

{

    const { methodName } = apiDeclaration.notifySimOffline;
    type Params = apiDeclaration.notifySimOffline.Params;
    type Response = apiDeclaration.notifySimOffline.Response;

    const handler: sipLibrary.api.Server.Handler<Params, Response> = {
        "handler": async ({ imsi }) => {

            const userSim = await getUsableUserSim(imsi);

            const hadOngoingCall = (
                userSim.reachableSimState !== undefined &&
                userSim.reachableSimState.isGsmConnectivityOk &&
                userSim.reachableSimState.ongoingCall !== undefined
            );

            userSim.reachableSimState = undefined;

            if (hadOngoingCall) {

                appEvts.evtOngoingCall.post(userSim);

            }

            appEvts.evtSimReachabilityStatusChange.post(userSim);

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

    const { methodName } = apiDeclaration.notifySimOnline;
    type Params = apiDeclaration.notifySimOnline.Params;
    type Response = apiDeclaration.notifySimOnline.Response;

    const handler: sipLibrary.api.Server.Handler<Params, Response> = {
        "handler": async ({
            imsi, hasInternalSimStorageChanged,
            password, simDongle, gatewayLocation,
            isGsmConnectivityOk, cellSignalStrength
        }) => {

            evtUsableDongle.post({ "imei": simDongle.imei });

            const userSim = await getUsableUserSim(imsi);

            if (hasInternalSimStorageChanged) {

                //NOTE: RestartApp should not be used here but we do not refactor 
                //as this is a hack to avoid having to write code for very unusual events.
                return restartApp("Sim internal storage has changed ( notifySimOnline )");


            }


            //NOTE: True when password changed for example.
            const wasAlreadyReachable= userSim.reachableSimState !== undefined;

            userSim.reachableSimState = isGsmConnectivityOk ?
                ({ "isGsmConnectivityOk": true, cellSignalStrength, "ongoingCall": undefined }) :
                ({ "isGsmConnectivityOk": false, cellSignalStrength })
                ;
            
            const hasPasswordChanged= userSim.password !== password;

            userSim.password = password;

            userSim.dongle = simDongle;

            userSim.gatewayLocation = gatewayLocation;

            if( wasAlreadyReachable && hasPasswordChanged ){
                appEvts.evtSimPasswordChanged.post(userSim);
                return undefined;
            }

            if( wasAlreadyReachable ){
                return undefined;
            }

            appEvts.evtSimReachabilityStatusChange.post(userSim);

            return undefined;

        }
    };

    handlers[methodName] = handler;

}


{

    const { methodName } = apiDeclaration.notifyGsmConnectivityChange;
    type Params = apiDeclaration.notifyGsmConnectivityChange.Params;
    type Response = apiDeclaration.notifyGsmConnectivityChange.Response;

    const handler: sipLibrary.api.Server.Handler<Params, Response> = {
        "handler": async ({ imsi, isGsmConnectivityOk }) => {

            const userSim = await getUsableUserSim(imsi);

            const { reachableSimState } = userSim;

            if (reachableSimState === undefined) {
                throw new Error("assert");
            }

            if (isGsmConnectivityOk === reachableSimState.isGsmConnectivityOk) {
                throw new Error("assert");
            }

            if (reachableSimState.isGsmConnectivityOk) {

                let hadOngoingCall = false;

                if (reachableSimState.ongoingCall !== undefined) {
                    delete reachableSimState.ongoingCall;
                    hadOngoingCall = true;
                }

                reachableSimState.isGsmConnectivityOk = false as any;

                if (hadOngoingCall) {
                    appEvts.evtOngoingCall.post(userSim);
                }

            } else {

                reachableSimState.isGsmConnectivityOk = true as any;

            }


            appEvts.evtSimGsmConnectivityChange.post(userSim);

            return undefined;

        }
    };

    handlers[methodName] = handler;

}



{

    const { methodName } = apiDeclaration.notifyCellSignalStrengthChange;
    type Params = apiDeclaration.notifyCellSignalStrengthChange.Params;
    type Response = apiDeclaration.notifyCellSignalStrengthChange.Response;

    const handler: sipLibrary.api.Server.Handler<Params, Response> = {
        "handler": async ({ imsi, cellSignalStrength }) => {

            const userSim = await getUsableUserSim(imsi);

            if (userSim.reachableSimState === undefined) {
                throw new Error("Sim should be reachable");
            }

            userSim.reachableSimState.cellSignalStrength = cellSignalStrength;

            appEvts.evtSimCellSignalStrengthChange.post(userSim);

            return undefined;

        }
    };

    handlers[methodName] = handler;

}




{

    const { methodName } = apiDeclaration.notifyOngoingCall;
    type Params = apiDeclaration.notifyOngoingCall.Params;
    type Response = apiDeclaration.notifyOngoingCall.Response;

    const handler: sipLibrary.api.Server.Handler<Params, Response> = {
        "handler": async params => {


            const { imsi } = params;

            const userSim = await getUsableUserSim(imsi);

            if (params.isTerminated) {

                const { ongoingCallId } = params;

                const { reachableSimState } = userSim;

                if (!reachableSimState) {
                    //NOTE: The event would have been posted in setSimOffline handler.
                    return;
                }

                if (!reachableSimState.isGsmConnectivityOk) {
                    //NOTE: If we have had event notifying connectivity lost
                    //before this event the evtOngoingCall will have been posted
                    //in notifyGsmConnectivityChange handler function.
                    return;
                }

                if (
                    reachableSimState.ongoingCall === undefined ||
                    reachableSimState.ongoingCall.ongoingCallId !== ongoingCallId
                ) {
                    return;
                }

                reachableSimState.ongoingCall = undefined;

            } else {

                const { ongoingCall } = params;



                const { reachableSimState } = userSim;

                if (reachableSimState === undefined) {
                    throw new Error("assert");
                }

                if (!reachableSimState.isGsmConnectivityOk) {
                    throw new Error("assert");
                }

                if (reachableSimState.ongoingCall === undefined) {
                    reachableSimState.ongoingCall = ongoingCall;
                } else if (reachableSimState.ongoingCall.ongoingCallId !== ongoingCall.ongoingCallId) {

                    reachableSimState.ongoingCall === undefined;

                    appEvts.evtOngoingCall.post(userSim);

                    reachableSimState.ongoingCall = ongoingCall;

                } else {

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

            appEvts.evtOngoingCall.post(userSim);

            return undefined;

        }
    };

    handlers[methodName] = handler;

}



{

    const { methodName } = apiDeclaration.notifyContactCreatedOrUpdated;
    type Params = apiDeclaration.notifyContactCreatedOrUpdated.Params;
    type Response = apiDeclaration.notifyContactCreatedOrUpdated.Response;

    const handler: sipLibrary.api.Server.Handler<Params, Response> = {
        "handler": async ({ imsi, name, number_raw, storage }) => {

            const userSim = await getUsableUserSim(imsi);


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

            appEvts.evtContactCreatedOrUpdated.post({ userSim, contact });

            return undefined;

        }
    };

    handlers[methodName] = handler;

}


{

    const { methodName } = apiDeclaration.notifyContactDeleted;
    type Params = apiDeclaration.notifyContactDeleted.Params;
    type Response = apiDeclaration.notifyContactDeleted.Response;

    const handler: sipLibrary.api.Server.Handler<Params, Response> = {
        "handler": async ({ imsi, number_raw, storage }) => {

            const userSim = await getUsableUserSim(imsi);

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

            appEvts.evtContactDeleted.post({ userSim, "contact": contact! });

            return undefined;

        }
    };

    handlers[methodName] = handler;

}


{

    const { methodName } = apiDeclaration.notifyDongleOnLan;
    type Params = apiDeclaration.notifyDongleOnLan.Params;
    type Response = apiDeclaration.notifyDongleOnLan.Response;

    const handler: sipLibrary.api.Server.Handler<Params, Response> = {
        "handler": async dongle => {

            const data: SyncEvent.Type<typeof appEvts.evtDongleOnLan> =
                dcTypes.Dongle.Locked.match(dongle) ? ({
                    "type": "LOCKED",
                    dongle,
                    "prSimUnlocked": evtUsableDongle
                        .waitFor(({ imei }) => imei === dongle.imei)
                        .then(() => undefined)
                }) : ({
                    "type": "USABLE",
                    dongle
                });

            if (data.type === "USABLE") {
                evtUsableDongle.post({ "imei": dongle.imei });
            }

            appEvts.evtDongleOnLan.post(data);

            return undefined;

        }
    };

    handlers[methodName] = handler;

}


{

    const { methodName } = apiDeclaration.notifySimPermissionLost;
    type Params = apiDeclaration.notifySimPermissionLost.Params;
    type Response = apiDeclaration.notifySimPermissionLost.Response;

    const handler: sipLibrary.api.Server.Handler<Params, Response> = {
        "handler": async ({ imsi }) => {

            const userSims = await getUsableUserSims();

            const userSim = userSims.find(
                ({ sim }) => sim.imsi === imsi
            )! as types.UserSim.Shared.Confirmed;

            userSims.splice(userSims.indexOf(userSim), 1);

            appEvts.evtSimPermissionLost.post(userSim);

            return undefined;

        }
    };

    handlers[methodName] = handler;

}

{

    const { methodName } = apiDeclaration.notifySimSharingRequest;
    type Params = apiDeclaration.notifySimSharingRequest.Params;
    type Response = apiDeclaration.notifySimSharingRequest.Response;

    const handler: sipLibrary.api.Server.Handler<Params, Response> = {
        "handler": params => {

            appEvts.evtSimSharingRequest.post(params);

            return Promise.resolve(undefined);

        }
    };

    handlers[methodName] = handler;


}

{

    const { methodName } = apiDeclaration.notifySharingRequestResponse;
    type Params = apiDeclaration.notifySharingRequestResponse.Params;
    type Response = apiDeclaration.notifySharingRequestResponse.Response;

    const handler: sipLibrary.api.Server.Handler<Params, Response> = {
        "handler": async ({ imsi, email, isAccepted }) => {

            //TODO: change and also for stop sharing.

            const userSim = await getUsableUserSim(imsi);


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


            appEvts.evtSharingRequestResponse.post({
                "userSim": userSim as any,
                email,
                isAccepted

            });

            return undefined;

        }
    };

    handlers[methodName] = handler;

}


{

    const { methodName } = apiDeclaration.notifyOtherSimUserUnregisteredSim;
    type Params = apiDeclaration.notifyOtherSimUserUnregisteredSim.Params;
    type Response = apiDeclaration.notifyOtherSimUserUnregisteredSim.Response;

    const handler: sipLibrary.api.Server.Handler<Params, Response> = {
        "handler": async ({ imsi, email }) => {

            const userSim = await getUsableUserSim(imsi);

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

            appEvts.evtOtherSimUserUnregisteredSim.post({
                "userSim": userSim as any,
                email
            });

            return undefined;

        }
    };

    handlers[methodName] = handler;

}


{

    const { methodName } = apiDeclaration.notifyLoggedFromOtherTab;
    type Params = apiDeclaration.notifyLoggedFromOtherTab.Params;
    type Response = apiDeclaration.notifyLoggedFromOtherTab.Response;

    const handler: sipLibrary.api.Server.Handler<Params, Response> = {
        "handler":() => {

            appEvts.evtOpenElsewhere.post();

            return Promise.resolve(undefined);

        }
    };

    handlers[methodName] = handler;

}


{

    const { methodName } = apiDeclaration.notifyIceServer;
    type Params = apiDeclaration.notifyIceServer.Params;
    type Response = apiDeclaration.notifyIceServer.Response;

    const handler: sipLibrary.api.Server.Handler<Params, Response> = {
        "handler": (params, fromSocket) => {

            appEvts.rtcIceEServer.evt.post({
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

            return Promise.resolve(undefined);

        }
    };

    handlers[methodName] = handler;

}

{

    const { methodName } = apiDeclaration.wd_notifyActionFromOtherUa;
    type Params = apiDeclaration.wd_notifyActionFromOtherUa.Params;
    type Response = apiDeclaration.wd_notifyActionFromOtherUa.Response;

    const handler: sipLibrary.api.Server.Handler<Params, Response> = {
        "handler":  params => {

            appEvts.evtWdActionFromOtherUa.post(params);

            return Promise.resolve(undefined);

        }
    };

    handlers[methodName] = handler;

}

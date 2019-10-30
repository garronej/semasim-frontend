

import { sendRequest } from "./sendRequest";
import * as apiDeclaration from "../../../sip_api_declarations/backendToUa";
import { phoneNumber } from "phone-number/dist/lib";
import * as types from "../../types/userSim";
import * as dcTypes from "chan-dongle-extended-client/dist/lib/types";
import * as connection from "../connection";
import { restartApp } from "../../restartApp";

import { evtSimReachabilityStatusChange, evtUsableSim } from "../events";


//TODO: Fix, it's called two times!!
export const getUsableUserSims = (() => {

    const { methodName } = apiDeclaration.getUsableUserSims;
    type Params = apiDeclaration.getUsableUserSims.Params;
    type Response = apiDeclaration.getUsableUserSims.Response;

    const sendGetUsableUserSimsRequest = () =>
        sendRequest<Params, Response>(
            methodName,
            { "includeContacts": true }
        );

    const updateUserSims = (
        oldUserSims: types.UserSim.Usable[],
        newUserSims: types.UserSim.Usable[]
    ): void => {

        for (const newUserSim of newUserSims) {

            const userSim = oldUserSims!
                .find(({ sim }) => sim.imsi === newUserSim.sim.imsi);

            /*
            By testing if digests are the same we cover 99% of the case
            when the sim could have been modified while offline...good enough.
            */
            if (
                !userSim ||
                userSim.sim.storage.digest !== newUserSim.sim.storage.digest
            ) {

                restartApp();

                return;

            }

            /*
            If userSim is online we received a notification before having the 
            response of the request... even possible?
             */
            if (!!userSim.reachableSimState) {
                continue;
            }

            userSim.reachableSimState = newUserSim.reachableSimState;

            userSim.password = newUserSim.password;

            userSim.dongle = newUserSim.dongle;

            userSim.gatewayLocation = newUserSim.gatewayLocation;

            if (!!userSim.reachableSimState) {

                evtSimReachabilityStatusChange.post(userSim);

            }


        }

    };


    const prUserSims: Promise<types.UserSim.Usable[]> =
        Promise.resolve(connection.get())
            .then(() => {

                connection.evtConnect.attach(socket => {

                    socket.evtClose.attachOnce(async () => {

                        for (const userSim of await prUserSims) {

                            userSim.reachableSimState = undefined;

                            evtSimReachabilityStatusChange.post(userSim);

                        }

                    });

                    Promise.all([
                        prUserSims,
                        sendGetUsableUserSimsRequest()
                    ]).then(
                        ([oldUserSims, newUserSims]) => updateUserSims(
                            oldUserSims,
                            newUserSims
                        )
                    );

                });

                return sendGetUsableUserSimsRequest();

            })
        ;

    return () => prUserSims;


})();

export const unlockSim = (() => {

    const { methodName } = apiDeclaration.unlockSim;
    type Params = apiDeclaration.unlockSim.Params;
    type Response = apiDeclaration.unlockSim.Response;

    return function (
        lockedDongle: dcTypes.Dongle.Locked,
        pin: string
    ): Promise<Response> {

        return sendRequest<Params, Response>(
            methodName,
            { "imei": lockedDongle.imei, pin }
        );

    };

})();

export const registerSim = (() => {

    const { methodName } = apiDeclaration.registerSim;
    type Params = apiDeclaration.registerSim.Params;
    type Response = apiDeclaration.registerSim.Response;

    return async function (
        dongle: dcTypes.Dongle.Usable,
        friendlyName: string
    ): Promise<void> {

        const userSim = await sendRequest<Params, Response>(
            methodName,
            {
                "imsi": dongle.sim.imsi,
                "imei": dongle.imei,
                friendlyName
            }
        );

        (await getUsableUserSims()).push(userSim);

        evtUsableSim.post(userSim);

    };

})();

export const unregisterSim = (() => {

    const { methodName } = apiDeclaration.unregisterSim;
    type Params = apiDeclaration.unregisterSim.Params;
    type Response = apiDeclaration.unregisterSim.Response;

    return async function (
        userSim: types.UserSim.Usable
    ): Promise<void> {

        await sendRequest<Params, Response>(
            methodName,
            { "imsi": userSim.sim.imsi }
        );

        const usableUserSims = await getUsableUserSims();

        usableUserSims.splice(
            usableUserSims.indexOf(userSim),
            1
        );

    };


})();

export const rebootDongle = (() => {

    const { methodName } = apiDeclaration.rebootDongle;
    type Params = apiDeclaration.rebootDongle.Params;
    type Response = apiDeclaration.rebootDongle.Response;

    return function (
        userSim: types.Online<types.UserSim.Usable>
    ): Promise<void> {

        return sendRequest<Params, Response>(
            methodName,
            { "imsi": userSim.sim.imsi }
        );

    };

})();

export const shareSim = (() => {

    const { methodName } = apiDeclaration.shareSim;
    type Params = apiDeclaration.shareSim.Params;
    type Response = apiDeclaration.shareSim.Response;

    return async function (
        userSim: types.UserSim.Owned,
        emails: string[],
        message: string
    ): Promise<void> {

        await sendRequest<Params, Response>(
            methodName,
            { "imsi": userSim.sim.imsi, emails, message }
        );

        for (const email of emails) {

            userSim.ownership.sharedWith.notConfirmed.push(email);

        }

    };

})();

export const stopSharingSim = (() => {

    const { methodName } = apiDeclaration.stopSharingSim;
    type Params = apiDeclaration.stopSharingSim.Params;
    type Response = apiDeclaration.stopSharingSim.Response;

    return async function (
        userSim: types.UserSim.Owned,
        emails: string[]
    ): Promise<void> {

        await sendRequest<Params, Response>(
            methodName,
            { "imsi": userSim.sim.imsi, emails }
        );

        for (const email of emails) {

            const { notConfirmed, confirmed } = userSim.ownership.sharedWith;

            let arr: string[];
            let index: number;

            index = notConfirmed.indexOf(email);

            if (index > 0) {
                arr = notConfirmed;
            } else {
                index = confirmed.indexOf(email);
                arr = confirmed;
            }

            arr.splice(index, 1);

        }

    };


})();

export const changeSimFriendlyName = (() => {

    const { methodName } = apiDeclaration.changeSimFriendlyName;
    type Params = apiDeclaration.changeSimFriendlyName.Params;
    type Response = apiDeclaration.changeSimFriendlyName.Response;

    return async function (
        userSim: types.UserSim.Usable,
        friendlyName: string
    ): Promise<void> {

        await sendRequest<Params, Response>(
            methodName,
            { "imsi": userSim.sim.imsi, friendlyName }
        );

        userSim.friendlyName = friendlyName;

    };

})();

export const acceptSharingRequest = (() => {

    const { methodName } = apiDeclaration.acceptSharingRequest;
    type Params = apiDeclaration.acceptSharingRequest.Params;
    type Response = apiDeclaration.acceptSharingRequest.Response;

    return async function (
        notConfirmedUserSim: types.UserSim.Shared.NotConfirmed,
        friendlyName: string
    ): Promise<void> {

        const { password } = await sendRequest<Params, Response>(
            methodName,
            { "imsi": notConfirmedUserSim.sim.imsi, friendlyName }
        );

        const userSim: types.UserSim.Shared.Confirmed = {
            "sim": notConfirmedUserSim.sim,
            friendlyName,
            password,
            "towardSimEncryptKeyStr": notConfirmedUserSim.towardSimEncryptKeyStr,
            "dongle": notConfirmedUserSim.dongle,
            "gatewayLocation": notConfirmedUserSim.gatewayLocation,
            "ownership": {
                "status": "SHARED CONFIRMED",
                "ownerEmail": notConfirmedUserSim.ownership.ownerEmail,
                "otherUserEmails": notConfirmedUserSim.ownership.otherUserEmails
            },
            "phonebook": notConfirmedUserSim.phonebook,
            "reachableSimState": notConfirmedUserSim.reachableSimState
        };

        (await getUsableUserSims()).push(userSim);

        evtUsableSim.post(userSim);

    };

})();

export const rejectSharingRequest = (() => {

    const { methodName } = apiDeclaration.rejectSharingRequest;
    type Params = apiDeclaration.rejectSharingRequest.Params;
    type Response = apiDeclaration.rejectSharingRequest.Response;

    return async function (
        userSim: types.UserSim.Shared.NotConfirmed
    ): Promise<void> {

        await sendRequest<Params, Response>(
            methodName,
            { "imsi": userSim.sim.imsi }
        );

    };

})();

export const createContact = (() => {

    const { methodName } = apiDeclaration.createContact;
    type Params = apiDeclaration.createContact.Params;
    type Response = apiDeclaration.createContact.Response;

    return async function (
        userSim: types.UserSim.Usable,
        name: string,
        number: phoneNumber
    ): Promise<types.UserSim.Contact> {

        const resp = await sendRequest<Params, Response>(
            methodName,
            { "imsi": userSim.sim.imsi, name, number }
        );

        const contact: types.UserSim.Contact = {
            "mem_index": !!resp ? resp.mem_index : undefined,
            name,
            "number_raw": number
        };

        userSim.phonebook.push(contact);

        if (!!resp) {

            userSim.sim.storage.contacts.push({
                "index": resp.mem_index,
                name,
                number
            });

            userSim.sim.storage.digest = resp.new_digest;

            userSim.sim.storage.infos.storageLeft--;

        }

        return contact;

    };

})();

export const updateContactName = (() => {

    const { methodName } = apiDeclaration.updateContactName;

    /** Assert contact is the ref of the object stored in userSim */
    return async function (
        userSim: types.UserSim.Usable,
        contact: types.UserSim.Contact,
        newName: string
    ): Promise<void> {

        if (contact.mem_index !== undefined) {

            type Params = apiDeclaration.updateContactName.contactInSim.Params;
            type Response = apiDeclaration.updateContactName.contactInSim.Response;

            const {
                name_as_stored_in_sim,
                new_digest
            } = await sendRequest<Params, Response>(
                methodName,
                {
                    "imsi": userSim.sim.imsi,
                    "contactRef": { "mem_index": contact.mem_index },
                    newName
                }
            );

            contact.name = newName;

            userSim
                .sim.storage.contacts.find(({ index }) => index === contact.mem_index)!
                .name = name_as_stored_in_sim;

            userSim.sim.storage.digest = new_digest;

        } else {

            type Params = apiDeclaration.updateContactName.contactNotInSim.Params;
            type Response = apiDeclaration.updateContactName.contactNotInSim.Response;

            await sendRequest<Params, Response>(
                methodName,
                {
                    "imsi": userSim.sim.imsi,
                    "contactRef": { "number": contact.number_raw },
                    newName
                }
            );

            contact.name = newName;

        }

    };

})();

export const deleteContact = (() => {

    const { methodName } = apiDeclaration.deleteContact;
    type Params = apiDeclaration.deleteContact.Params;
    type Response = apiDeclaration.deleteContact.Response;

    return async function (
        userSim: types.UserSim.Usable,
        contact: types.UserSim.Contact
    ): Promise<void> {

        const { new_digest } = await sendRequest<Params, Response>(
            methodName,
            {
                "imsi": userSim.sim.imsi,
                "contactRef": contact.mem_index === null ?
                    ({ "mem_index": contact.mem_index }) :
                    ({ "number": contact.number_raw })
            }
        );

        if (contact.mem_index !== null) {

            userSim.sim.storage.contacts.splice(
                userSim.sim.storage.contacts.findIndex(
                    ({ index }) => index === contact.mem_index
                ),
                1
            );

        }

        userSim.phonebook.splice(
            userSim.phonebook.indexOf(contact),
            1
        );

        if (new_digest !== undefined) {

            userSim.sim.storage.digest = new_digest;

        }

    };

})();

/** Api only called once */
export const shouldAppendPromotionalMessage = (() => {

    const { methodName } = apiDeclaration.shouldAppendPromotionalMessage;
    type Params = apiDeclaration.shouldAppendPromotionalMessage.Params;
    type Response = apiDeclaration.shouldAppendPromotionalMessage.Response;

    let cachedResponse: Response | undefined = undefined;

    return function (
    ): Promise<boolean> | boolean {

        if (cachedResponse !== undefined) {
            return cachedResponse;
        }

        return sendRequest<Params, Response>(
            methodName,
            undefined
        ).then(response => cachedResponse = response);

    };

})();

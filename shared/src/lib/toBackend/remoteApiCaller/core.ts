

import * as apiDeclaration from "../../../sip_api_declarations/backendToUa";
import * as types from "../../types";
import { Evt } from "evt";
import { assert } from "../../../tools/typeSafety/assert";
import * as dcTypes from "chan-dongle-extended-client/dist/lib/types";
import { createObjectWithGivenRef } from "../../../tools/createObjectWithGivenRef";
import { id } from "../../../tools/typeSafety/id";
import { phoneNumber as phoneNumberLib } from "phone-number";
import { NonPostableEvts } from "../../../tools/NonPostableEvts";
import * as _ from "../../../tools/reducers";

export type RemoteNotifyEvts = Pick<types.RemoteNotifyEvts, "evtUserSimChange">;

export function getCoreApi(
    sendRequest: ReturnType<typeof import("./getSendRequest").getSendRequest>,
    remoteNotifyEvts: RemoteNotifyEvts,
    restartApp: (typeof import("../../restartApp"))["restartApp"],
    userEmail: string
) {

    const getUserSimEvts = getGetUserSimEvts({ remoteNotifyEvts, restartApp });

    return {
        "getUserSims": (() => {

            //TODO: This was before called as soon as the socket is was connected
            //make sure it is called early.

            const { methodName } = apiDeclaration.getUserSims;
            type Params = apiDeclaration.getUserSims.Params;
            type Response = apiDeclaration.getUserSims.Response;

            return async function ({ includeContacts }:{includeContacts: boolean;}): Promise<{
                userSims: types.UserSim[];
                userSimEvts: NonPostableEvts<types.UserSim.Evts>;
            }> {

                const userSims = await sendRequest<Params, Response>(
                    methodName,
                    { includeContacts }
                );

                return {
                    userSims,
                    "userSimEvts": getUserSimEvts(userSims)
                };

            };

        })(),
        "unlockSim": (() => {

            const { methodName } = apiDeclaration.unlockSim;
            type Params = apiDeclaration.unlockSim.Params;
            type Response = apiDeclaration.unlockSim.Response;

            return function ({ lockedDongle, pin }: {
                lockedDongle: dcTypes.Dongle.Locked;
                pin: string;
            }): Promise<Response> {

                return sendRequest<Params, Response>(
                    methodName,
                    { "imei": lockedDongle.imei, pin }
                );

            };

        })(),
        "registerSim": (() => {

            const { methodName } = apiDeclaration.registerSim;
            type Params = apiDeclaration.registerSim.Params;
            type Response = apiDeclaration.registerSim.Response;

            return async function ({dongle, friendlyName}:{
                dongle: dcTypes.Dongle.Usable;
                friendlyName: string;
            }): Promise<void> {

                const { imsi } = dongle.sim;

                await Promise.all([
                    remoteNotifyEvts.evtUserSimChange.waitFor(
                        eventData => (
                            eventData.type === "NEW" &&
                            types.UserSim.Owned.match(eventData.userSim) &&
                            eventData.userSim.sim.imsi === imsi

                        )
                    ),
                    sendRequest<Params, Response>(
                        methodName,
                        {
                            imsi,
                            "imei": dongle.imei,
                            friendlyName
                        }
                    ),
                ]);


            };

        })(),
        "unregisterSim": (() => {

            const { methodName } = apiDeclaration.unregisterSim;
            type Params = apiDeclaration.unregisterSim.Params;
            type Response = apiDeclaration.unregisterSim.Response;

            return async function ( userSim: types.UserSim.Usable): Promise<void> {

                const { imsi } = userSim.sim;

                await Promise.all([
                    remoteNotifyEvts.evtUserSimChange.waitFor(
                        eventData => (
                            eventData.type === "DELETE" &&
                            eventData.cause === "USER UNREGISTER SIM" &&
                            eventData.imsi === imsi
                        )
                    ),
                    sendRequest<Params, Response>(
                        methodName,
                        { imsi }
                    )
                ]);


            };

        })(),
        /** Assert sim is reachable */
        "rebootDongle": (() => {

            const { methodName } = apiDeclaration.rebootDongle;
            type Params = apiDeclaration.rebootDongle.Params;
            type Response = apiDeclaration.rebootDongle.Response;

            return function (userSim: types.UserSim.Usable): Promise<void> {

                assert(!!userSim.reachableSimState);

                return sendRequest<Params, Response>(
                    methodName,
                    { "imsi": userSim.sim.imsi }
                );

            };

        })(),
        "shareSim": (() => {

            const { methodName } = apiDeclaration.shareSim;
            type Params = apiDeclaration.shareSim.Params;
            type Response = apiDeclaration.shareSim.Response;

            return async function ({ userSim, emails, message }: {
                userSim: types.UserSim.Owned;
                emails: string[];
                message: string;
            }): Promise<void> {

                const { sim: { imsi }, ownership: { sharedWith } } = userSim;

                emails = emails
                    .map(email => email.toLowerCase())
                    .filter(email => email !== userEmail)
                    .reduce(..._.removeDuplicates<string>())
                    ;

                if (emails.length === 0) {
                    return;
                }

                await Promise.all([
                    ...emails
                        .filter(email => (
                            sharedWith.notConfirmed.indexOf(email) < 0 &&
                            sharedWith.confirmed.indexOf(email) < 0
                        ))
                        .map(email => remoteNotifyEvts.evtUserSimChange.waitFor(
                            eventData => (
                                eventData.type === "SHARED USER SET CHANGE" &&
                                eventData.imsi === imsi &&
                                eventData.action === "ADD" &&
                                eventData.targetSet === "NOT CONFIRMED USERS" &&
                                eventData.email === email
                            )
                        )),
                    sendRequest<Params, Response>(
                        methodName,
                        { imsi, emails, message }
                    )
                ]);

            };

        })(),
        "stopSharingSim": (() => {

            const { methodName } = apiDeclaration.stopSharingSim;
            type Params = apiDeclaration.stopSharingSim.Params;
            type Response = apiDeclaration.stopSharingSim.Response;

            return async function ({ userSim, emails }: {
                userSim: types.UserSim.Owned;
                emails: string[];
            }): Promise<void> {

                const { sim: { imsi }, ownership: { sharedWith } } = userSim;

                emails = emails
                    .map(email => email.toLowerCase())
                    .filter(email => email !== userEmail)
                    .reduce(..._.removeDuplicates<string>())
                    ;

                if (emails.length === 0) {
                    return;
                }

                await Promise.all([
                    ...emails
                        .filter(email => (
                            sharedWith.notConfirmed.indexOf(email) >= 0 &&
                            sharedWith.confirmed.indexOf(email) >= 0
                        ))
                        .map(email => remoteNotifyEvts.evtUserSimChange.waitFor(
                            eventData => (
                                eventData.type === "SHARED USER SET CHANGE" &&
                                eventData.imsi === imsi &&
                                eventData.action === "REMOVE" &&
                                eventData.email === email
                            )
                        )),
                    sendRequest<Params, Response>(
                        methodName,
                        { imsi, emails }
                    )
                ]);


            };

        })(),
        "changeSimFriendlyName": (() => {

            const { methodName } = apiDeclaration.changeSimFriendlyName;
            type Params = apiDeclaration.changeSimFriendlyName.Params;
            type Response = apiDeclaration.changeSimFriendlyName.Response;

            return async function ({ userSim, friendlyName }: {
                userSim: types.UserSim.Usable;
                friendlyName: string;
            }): Promise<void> {

                const { imsi } = userSim.sim;

                await Promise.all([
                    remoteNotifyEvts.evtUserSimChange.waitFor(
                        eventData => (
                            eventData.type === "FRIENDLY NAME CHANGE" &&
                            eventData.imsi === imsi
                        )
                    ),
                    sendRequest<Params, Response>(
                        methodName,
                        { imsi, friendlyName }
                    )
                ]);


            };

        })(),
        "acceptSharingRequest": (() => {

            const { methodName } = apiDeclaration.acceptSharingRequest;
            type Params = apiDeclaration.acceptSharingRequest.Params;
            type Response = apiDeclaration.acceptSharingRequest.Response;

            return async function ({ notConfirmedUserSim, friendlyName }: {
                notConfirmedUserSim: types.UserSim.Shared.NotConfirmed;
                friendlyName: string;
            }): Promise<void> {

                const { imsi } = notConfirmedUserSim.sim;

                await Promise.all([
                    remoteNotifyEvts.evtUserSimChange.waitFor(
                        eventData => (
                            eventData.type === "IS NOW CONFIRMED" &&
                            eventData.imsi === imsi
                        )
                    ),
                    sendRequest<Params, Response>(
                        methodName,
                        { imsi, friendlyName }
                    )
                ]);

            };

        })(),
        "rejectSharingRequest": (() => {

            const { methodName } = apiDeclaration.rejectSharingRequest;
            type Params = apiDeclaration.rejectSharingRequest.Params;
            type Response = apiDeclaration.rejectSharingRequest.Response;

            return async function (
                userSim: types.UserSim.Shared.NotConfirmed
            ): Promise<void> {

                const { imsi } = userSim.sim;

                await Promise.all([
                    remoteNotifyEvts.evtUserSimChange.waitFor(
                        eventData => (
                            eventData.type === "DELETE" &&
                            eventData.cause === "REJECT SHARING REQUEST" &&
                            eventData.imsi === imsi
                        )
                    ),
                    sendRequest<Params, Response>(
                        methodName,
                        { imsi }
                    )
                ]);

            };

        })(),
        "createContact": (() => {

            const { methodName } = apiDeclaration.createContact;
            type Params = apiDeclaration.createContact.Params;
            type Response = apiDeclaration.createContact.Response;


            /** Assert there is not already a contact with this number in the phonebook */
            return async function ({ userSim, name, number_raw }: {
                userSim: types.UserSim.Usable;
                name: string;
                number_raw: string;
            }): Promise<types.UserSim.Contact> {

                //NOTE: Test assertion
                {

                    const isSameAsInput = (() => {

                        const formatedNumberInput = phoneNumberLib.build(
                            number_raw,
                            userSim.sim.country?.iso
                        );

                        return (other_number_raw: string) => phoneNumberLib.areSame(
                            formatedNumberInput,
                            other_number_raw
                        );

                    })();

                    if (!!userSim.phonebook.find(({ number_raw }) => isSameAsInput(number_raw))) {

                        throw new Error("Already a contact with this number");

                    }

                }

                const { imsi } = userSim.sim;

                await Promise.all([
                    remoteNotifyEvts.evtUserSimChange.waitFor(
                        eventData => (
                            eventData.type === "CONTACT CREATED OR UPDATED" &&
                            eventData.imsi === imsi &&
                            eventData.number_raw === number_raw
                        )
                    ),
                    sendRequest<Params, Response>(
                        methodName,
                        { imsi, name, number_raw }
                    )
                ]);

                const contact = userSim.phonebook
                    .find(contact => contact.number_raw === number_raw);

                assert(contact !== undefined);

                return contact;


            };

        })(),
        "updateContactName": (() => {

            const { methodName } = apiDeclaration.updateContactName;
            type Response = apiDeclaration.updateContactName.Response;

            return async function ({ userSim, contact, newName }: {
                userSim: types.UserSim.Usable;
                contact: types.UserSim.Contact;
                newName: string;
            }): Promise<void> {

                //NOTE: If formating is needed on newName apply it here.
                newName = id(newName);

                if (newName === contact.name) {
                    return;
                }

                const { imsi } = userSim.sim;

                const prDone = remoteNotifyEvts.evtUserSimChange.waitFor(
                    eventData => (
                        eventData.type === "CONTACT CREATED OR UPDATED" &&
                        eventData.number_raw === contact.number_raw &&
                        eventData.name === newName
                    )
                );

                if (contact.mem_index !== undefined) {

                    type Params = apiDeclaration.updateContactName.contactInSim.Params;

                    await sendRequest<Params, Response>(
                        methodName,
                        {
                            imsi,
                            "contactRef": { "mem_index": contact.mem_index },
                            newName
                        }
                    );


                } else {

                    type Params = apiDeclaration.updateContactName.contactNotInSim.Params;

                    await sendRequest<Params, Response>(
                        methodName,
                        {
                            imsi,
                            "contactRef": { "number": contact.number_raw },
                            newName
                        }
                    );

                }

                await prDone;

            };

        })(),
        "deleteContact": (() => {

            const { methodName } = apiDeclaration.deleteContact;
            type Params = apiDeclaration.deleteContact.Params;
            type Response = apiDeclaration.deleteContact.Response;

            return async function ({ userSim, contact }: {
                userSim: types.UserSim.Usable;
                contact: types.UserSim.Contact;
            }): Promise<void> {

                const { imsi } = userSim.sim;

                await Promise.all([
                    remoteNotifyEvts.evtUserSimChange.waitFor(
                        eventData => (
                            eventData.type === "CONTACT DELETED" &&
                            eventData.imsi === imsi &&
                            eventData.number_raw === contact.number_raw
                        )
                    ),
                    sendRequest<Params, Response>(
                        methodName,
                        {
                            imsi,
                            "contactRef": contact.mem_index === null ?
                                ({ "mem_index": contact.mem_index }) :
                                ({ "number": contact.number_raw })
                        }
                    )
                ]);

            };

        })(),
        "shouldAppendPromotionalMessage": (() => {

            const { methodName } = apiDeclaration.shouldAppendPromotionalMessage;
            type Params = apiDeclaration.shouldAppendPromotionalMessage.Params;
            type Response = apiDeclaration.shouldAppendPromotionalMessage.Response;

            let cachedResponse: Response | undefined = undefined;

            return function (): Promise<boolean> | boolean {

                if (cachedResponse !== undefined) {
                    return cachedResponse;
                }

                return sendRequest<Params, Response>(
                    methodName,
                    undefined
                ).then(response => cachedResponse = response);

            };

        })()
    };

}

export type CoreApi = ReturnType<typeof getCoreApi>;

function getGetUserSimEvts(
    params: {
        remoteNotifyEvts: RemoteNotifyEvts,
        restartApp: (typeof import("../../restartApp"))["restartApp"]
    }
) {

    const { remoteNotifyEvts, restartApp } = params;

    return function getUserSimChangEvts(userSims: types.UserSim[]): NonPostableEvts<types.UserSim.Evts> {

        const out: types.UserSim.Evts = {
            "evtNew": new Evt(),
            "evtNowConfirmed": new Evt(),
            "evtDelete": new Evt(),
            "evtReachabilityStatusChange": new Evt(),
            "evtSipPasswordRenewed": new Evt(),
            "evtCellularConnectivityChange": new Evt(),
            "evtCellularSignalStrengthChange": new Evt(),
            "evtOngoingCall": new Evt(),
            "evtNewUpdatedOrDeletedContact": new Evt(),
            "evtSharedUserSetChange": new Evt(),
            "evtFriendlyNameChange": new Evt()
        };

        const findUserSim = (imsi: string) => {

            const userSim = userSims.find(({ sim }) => sim.imsi === imsi);

            assert(userSim !== undefined);

            return userSim;

        };

        remoteNotifyEvts.evtUserSimChange.attach(
            eventData => {

                switch (eventData.type) {
                    case "NEW": {

                        const { userSim } = eventData;

                        userSims.push(userSim);

                        out.evtNew.post((() => {

                            if (types.UserSim.Owned.match(userSim)) {


                                return {
                                    "cause": "SIM REGISTERED FROM LAN" as const,
                                    userSim
                                };

                            }

                            if (types.UserSim.Shared.NotConfirmed.match(userSim)) {


                                return {
                                    "cause": "SHARING REQUEST RECEIVED" as const,
                                    userSim

                                };

                            }

                            throw new Error("never");

                        })());


                    } return;
                    case "IS NOW CONFIRMED": {

                        const notConfirmedUserSim = findUserSim(eventData.imsi);

                        assert(types.UserSim.Shared.NotConfirmed.match(notConfirmedUserSim));

                        out.evtNowConfirmed.post(
                            createObjectWithGivenRef(
                                notConfirmedUserSim,
                                id<types.UserSim.Shared.Confirmed>({
                                    ...notConfirmedUserSim,
                                    "friendlyName": eventData.friendlyName,
                                    "ownership": {
                                        "status": "SHARED CONFIRMED",
                                        "ownerEmail": notConfirmedUserSim.ownership.ownerEmail,
                                        "otherUserEmails": notConfirmedUserSim.ownership.otherUserEmails
                                    }
                                })
                            )
                        );

                    } return;
                    case "DELETE": {

                        const userSim = findUserSim(eventData.imsi);

                        userSims.splice(userSims.indexOf(userSim), 1);

                        out.evtDelete.post((() => {

                            const { cause } = eventData;

                            switch (cause) {
                                case "USER UNREGISTER SIM":

                                    assert(types.UserSim.Usable.match(userSim));

                                    return { cause, userSim };
                                case "PERMISSION LOSS":

                                    assert(types.UserSim.Shared.match(userSim));

                                    return { cause, userSim };

                                case "REJECT SHARING REQUEST":

                                    assert(types.UserSim.Shared.NotConfirmed.match(userSim));

                                    return { cause, userSim };

                            }

                        })());


                    } return;
                    case "IS NOW UNREACHABLE": {

                        const userSim = findUserSim(eventData.imsi);

                        const hadOngoingCall = !!userSim.reachableSimState?.ongoingCall;

                        userSim.reachableSimState = undefined;

                        if (hadOngoingCall) {

                            out.evtOngoingCall.post(userSim);

                        }

                        out.evtReachabilityStatusChange.post(userSim);

                    } return;
                    case "IS NOW REACHABLE": {

                        const userSim = findUserSim(eventData.imsi);

                        const {
                            hasInternalSimStorageChanged,
                            isGsmConnectivityOk,
                            cellSignalStrength,
                            password,
                            simDongle,
                            gatewayLocation
                        } = eventData;

                        if (hasInternalSimStorageChanged) {

                            //NOTE: RestartApp should not be used here but we do not refactor 
                            //as this is a hack to avoid having to write code for very unusual events.
                            restartApp("Sim internal storage has changed ( notifySimOnline )");

                            return;


                        }

                        //NOTE: True when password changed for example.
                        const wasAlreadyReachable = userSim.reachableSimState !== undefined;

                        userSim.reachableSimState = {
                            isGsmConnectivityOk,
                            cellSignalStrength,
                            "ongoingCall": undefined
                        };

                        const hasPasswordChanged = userSim.password !== password;

                        userSim.password = password;

                        userSim.dongle = simDongle;

                        userSim.gatewayLocation = gatewayLocation;

                        if (wasAlreadyReachable && hasPasswordChanged) {

                            out.evtSipPasswordRenewed.post(userSim);

                            return;

                        }

                        if (wasAlreadyReachable) {
                            return;
                        }

                        out.evtReachabilityStatusChange.post(userSim);

                    } return;
                    case "CELLULAR CONNECTIVITY CHANGE": {

                        const userSim = findUserSim(eventData.imsi);

                        const { reachableSimState } = userSim;

                        assert(
                            reachableSimState !== undefined &&
                            eventData.isGsmConnectivityOk !== reachableSimState.isGsmConnectivityOk
                        );

                        reachableSimState.isGsmConnectivityOk = eventData.isGsmConnectivityOk;

                        out.evtCellularConnectivityChange.post(userSim);

                    } return;
                    case "CELLULAR SIGNAL STRENGTH CHANGE": {

                        const userSim = findUserSim(eventData.imsi);

                        assert(userSim.reachableSimState !== undefined, "sim should be reachable");

                        userSim.reachableSimState.cellSignalStrength = eventData.cellSignalStrength;

                        out.evtCellularSignalStrengthChange.post(userSim);

                    } return;
                    case "ONGOING CALL": {

                        const userSim = findUserSim(eventData.imsi);

                        if (eventData.isTerminated) {

                            const { ongoingCallId } = eventData;

                            const { reachableSimState } = userSim;

                            if (!reachableSimState) {
                                //NOTE: The event would have been posted in setSimOffline handler.
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

                            const { ongoingCall } = eventData;

                            const { reachableSimState } = userSim;

                            assert(reachableSimState !== undefined);

                            if (reachableSimState.ongoingCall === undefined) {
                                reachableSimState.ongoingCall = ongoingCall;
                            } else if (reachableSimState.ongoingCall.ongoingCallId !== ongoingCall.ongoingCallId) {

                                reachableSimState.ongoingCall === undefined;

                                out.evtOngoingCall.post(userSim);

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

                        out.evtOngoingCall.post(userSim);



                    } return;
                    case "CONTACT CREATED OR UPDATED": {

                        const userSim = findUserSim(eventData.imsi);

                        const { storage, number_raw, name } = eventData;

                        let contact = userSim.phonebook.find(contact => {

                            if (storage !== undefined) {
                                return contact.mem_index === storage.mem_index;
                            }

                            return contact.number_raw === number_raw;

                        });

                        let eventType: "NEW" | "UPDATED";

                        if (!!contact) {

                            eventType = "UPDATED";

                            contact.name = name;

                            if (!!storage) {

                                userSim.sim.storage.contacts
                                    .find(({ index }) => index === storage.mem_index)!.name =
                                    storage.name_as_stored;

                            }

                        } else {

                            eventType = "NEW";

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

                        out.evtNewUpdatedOrDeletedContact.post({ eventType, contact, userSim });

                    } return;
                    case "CONTACT DELETED": {

                        const userSim = findUserSim(eventData.imsi);

                        const { number_raw, storage } = eventData;

                        let contact: types.UserSim.Contact | undefined = undefined;

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

                        assert(contact !== undefined);

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

                        out.evtNewUpdatedOrDeletedContact.post({ "eventType": "DELETED", userSim, contact });

                    } return;
                    case "SHARED USER SET CHANGE": {

                        const userSim = findUserSim(eventData.imsi);

                        const doChange = (action: "ADD" | "REMOVE", targetSet: typeof eventData["targetSet"]) => {

                            const emails = ((ownership: types.UserSim.Ownership): (string[] | null) =>
                                ownership.status === "OWNED" ? (
                                    ownership.sharedWith[(() => {
                                        switch (targetSet) {
                                            case "CONFIRMED USERS": return "confirmed" as const;
                                            case "NOT CONFIRMED USERS": return "notConfirmed" as const;
                                        }
                                    })()]
                                ) : (
                                        targetSet === "NOT CONFIRMED USERS" ?
                                            null :
                                            ownership.otherUserEmails
                                    )
                            )(userSim.ownership);

                            switch (action) {
                                case "ADD":
                                    emails?.push(eventData.email);
                                    break;
                                case "REMOVE":

                                    if (emails === null) {
                                        break;
                                    }

                                    emails.splice(
                                        emails.indexOf(eventData.email),
                                        1
                                    );
                                    break;
                            }

                        };

                        if (eventData.action === "MOVE TO CONFIRMED") {
                            doChange("REMOVE", "NOT CONFIRMED USERS");
                            doChange("ADD", "CONFIRMED USERS");
                        } else {
                            doChange(eventData.action, eventData.targetSet);
                        }


                        out.evtSharedUserSetChange.post({
                            ...(() => {

                                const { imsi, type, ...out } = eventData;

                                return out;

                            })(),
                            userSim
                        });


                    } return;
                    case "FRIENDLY NAME CHANGE": {

                        const userSim = findUserSim(eventData.imsi);

                        assert(types.UserSim.Usable.match(userSim));

                        userSim.friendlyName = eventData.friendlyName;

                        out.evtFriendlyNameChange.post(userSim);

                    } return;
                }

                throw new Error("never");

            }
        );

        return out;


    };
}



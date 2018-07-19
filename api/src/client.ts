import * as d from "./declaration";
import * as types from "./types";
import * as ttJC from "transfer-tools/dist/lib/JSON_CUSTOM";
//@ts-ignore: Import Dongle.Usable
import * as dcTypes from "../node_modules/chan-dongle-extended-client/dist/lib/types";

const JSON_CUSTOM= ttJC.get();

async function makeRequest<Params, Response>(
    methodName, params: Params
): Promise<Response> {
    return new Promise<Response>(
        resolve => (window["$"] as JQueryStatic).ajax({
            "url": `/${d.apiPath}/${methodName}`,
            "method": "POST",
            "contentType": "application/json; charset=UTF-8",
            "data": JSON_CUSTOM.stringify(params),
            "dataType": "text",
            "statusCode": {
                "400": () => alert("Bad request"),
                "401": () => window.location.reload(),
                "500": () => alert("Internal server error"),
                "200": (data: string) =>
                    resolve(JSON_CUSTOM.parse(data))
            }
        })
    );
}

export function registerUser(
    email: string,
    password: string
) {

    const methodName = d.registerUser.methodName;
    type Params = d.registerUser.Params;
    type Response = d.registerUser.Response;

    return makeRequest<Params, Response>(
        methodName,
        { email, password }
    );

}

export function loginUser(
    email: string,
    password: string
) {

    const methodName = d.loginUser.methodName;
    type Params = d.loginUser.Params;
    type Response = d.loginUser.Response;

    return makeRequest<Params, Response>(
        methodName,
        { email, password }
    );

}

export function logoutUser() {

    const methodName = d.logoutUser.methodName;
    type Params = d.logoutUser.Params;
    type Response = d.logoutUser.Response;

    return makeRequest<Params, Response>(
        methodName,
        undefined
    );

}

/** Return true if email has account */
export function sendRenewPasswordEmail(
    email: string
) {

    const methodName = d.sendRenewPasswordEmail.methodName;
    type Params = d.sendRenewPasswordEmail.Params;
    type Response = d.sendRenewPasswordEmail.Response;

    return makeRequest<Params, Response>(
        methodName,
        { email }
    );

}

export function getUserSims() {

    const methodName = d.getSims.methodName;
    type Params = d.getSims.Params;
    type Response = d.getSims.Response;

    return makeRequest<Params, Response>(
        methodName,
        undefined
    );

}

export function getUnregisteredLanDongles() {

    const methodName = d.getUnregisteredLanDongles.methodName;
    type Params = d.getUnregisteredLanDongles.Params;
    type Response = d.getUnregisteredLanDongles.Response;

    return makeRequest<Params, Response>(
        methodName,
        undefined
    );

}

export function unlockSim(
    imei: string,
    pin: string
) {

    const methodName = d.unlockSim.methodName;
    type Params = d.unlockSim.Params;
    type Response = d.unlockSim.Response;

    return makeRequest<Params, Response>(
        methodName,
        { imei, pin }
    );

}

export function registerSim(
    imsi: string,
    friendlyName: string
) {

    const methodName = d.registerSim.methodName;
    type Params = d.registerSim.Params;
    type Response = d.registerSim.Response;

    return makeRequest<Params, Response>(
        methodName,
        { imsi, friendlyName }
    );

}

export function unregisterSim(
    imsi: string
) {

    const methodName = d.unregisterSim.methodName;
    type Params = d.unregisterSim.Params;
    type Response = d.unregisterSim.Response;

    return makeRequest<Params, Response>(
        methodName,
        { imsi }
    );


}

export function shareSim(
    imsi: string,
    emails: string[],
    message: string
) {

    const methodName = d.shareSim.methodName;
    type Params = d.shareSim.Params;
    type Response = d.shareSim.Response;

    return makeRequest<Params, Response>(
        methodName,
        { imsi, emails, message }
    );


}

export function stopSharingSim(
    imsi: string,
    emails: string[]
) {

    const methodName = d.stopSharingSim.methodName;
    type Params = d.stopSharingSim.Params;
    type Response = d.stopSharingSim.Response;

    return makeRequest<Params, Response>(
        methodName,
        { imsi, emails }
    );

}

export function setSimFriendlyName(
    imsi: string,
    friendlyName: string
) {

    const methodName = d.setSimFriendlyName.methodName;
    type Params = d.setSimFriendlyName.Params;
    type Response = d.setSimFriendlyName.Response;

    return makeRequest<Params, Response>(
        methodName,
        { imsi, friendlyName }
    );

}

export function createContact(
    imsi: string,
    name: string,
    phoneNumber: string
){

    const methodName = d.createContact.methodName;
    type Params = d.createContact.Params;
    type Response = d.createContact.Response;

    return makeRequest<Params, Response>(
        methodName,
        { imsi, name, "number": phoneNumber }
    );

}

export function updateContactName(
    imsi: string,
    contactRef: { mem_index: number; } | { number: string; },
    newName: string
){

    const methodName = d.updateContactName.methodName;
    type Params = d.updateContactName.Params;
    type Response = d.updateContactName.Response;

    return makeRequest<Params, Response>(
        methodName,
        { imsi, contactRef, newName }
    );

}

//TODO: implement in UI.
export function deleteContact(
    imsi: string,
    contactRef: { mem_index: number; } | { number: string; }
){

    const methodName = d.deleteContact.methodName;
    type Params = d.deleteContact.Params;
    type Response = d.deleteContact.Response;

    return makeRequest<Params, Response>(
        methodName,
        { imsi, contactRef }
    );

}

export namespace webphoneData {

    import dw = d.webphoneData;

    export function fetch() {

        const methodName = dw.fetch.methodName;
        type Params = dw.fetch.Params;
        type Response = dw.fetch.Response;

        return makeRequest<Params, Response>(
            methodName,
            undefined
        );


    }

    export function newInstance(imsi: string) {

        const methodName = dw.newInstance.methodName;
        type Params = dw.newInstance.Params;
        type Response = dw.newInstance.Response;

        return makeRequest<Params, Response>(
            methodName,
            { imsi }
        );

    }

    export function newChat(
        instance_id: number,
        contactNumber: string,
        contactName: string,
        contactIndexInSim: number | null
    ) {

        const methodName = dw.newChat.methodName;
        type Params = dw.newChat.Params;
        type Response = dw.newChat.Response;

        return makeRequest<Params, Response>(
            methodName,
            {
                instance_id,
                contactNumber,
                contactName,
                contactIndexInSim
            }
        );

    }

    export function updateChat(
        chat_id: number,
        updatedFields: Partial<{
            lastSeenTime: number;
            contactName: string;
            contactIndexInSim: number | null;
        }>
    ) {

        const methodName = dw.updateChat.methodName;
        type Params = dw.updateChat.Params;
        type Response = dw.updateChat.Response;

        return makeRequest<Params, Response>(
            methodName,
            { chat_id, ...updatedFields }
        );

    }

    export function destroyChat(
        chat_id: number
    ) {

        const methodName = dw.destroyChat.methodName;
        type Params = dw.destroyChat.Params;
        type Response = dw.destroyChat.Response;

        return makeRequest<Params, Response>(
            methodName,
            { chat_id }
        );

    }

    /** message require id_ set to NaN return id_ */
    export function newMessage(
        chat_id: number,
        message: types.WebphoneData.Message
    ): Promise<number> {

        const methodName = dw.newMessage.methodName;
        type Params = dw.newMessage.Params;
        type Response = dw.newMessage.Response;

        return makeRequest<Params, Response>(
            methodName,
            { chat_id, message }
        );

    }

    export function updateOutgoingMessageStatusToSendReportReceived(
        message_id: number,
        dongleSendTime: number | null
    ) {

        const methodName = dw.updateOutgoingMessageStatusToSendReportReceived.methodName;
        type Params = dw.updateOutgoingMessageStatusToSendReportReceived.Params;
        type Response = dw.updateOutgoingMessageStatusToSendReportReceived.Response;

        return makeRequest<Params, Response>(
            methodName,
            { message_id, dongleSendTime }
        );

    }

    export function updateOutgoingMessageStatusToStatusReportReceived(
        message_id: number,
        deliveredTime: number | null
    ) {

        const methodName = dw.updateOutgoingMessageStatusToStatusReportReceived.methodName;
        type Params = dw.updateOutgoingMessageStatusToStatusReportReceived.Params;
        type Response = dw.updateOutgoingMessageStatusToStatusReportReceived.Response;

        return makeRequest<Params, Response>(
            methodName,
            { message_id, deliveredTime }
        );

    }

}


/*
function buildUrl(
    methodName: string,
    params: Record<string, string | undefined>
): string {

    let query: string[] = [];

    for (let key of Object.keys(params)) {

        let value = params[key];

        if (value === undefined) continue;

        query[query.length] = `${key}=${params[key]}`;

    }

    let url = `https://${c.backendHostname}:${c.webApiPort}/${c.webApiPath}/${methodName}?${query.join("&")}`;

    console.log(`GET ${url}`);

    return url;
}
*/